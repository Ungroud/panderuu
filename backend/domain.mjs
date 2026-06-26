export const PERMISSION_ERROR = 'permisos no autorizados';
export const INITIAL_LOAN_LIMIT_CENTS = 15000;
export const BASE_RATE_PERCENT = 5;
export const ALLOWED_RATES = new Set([2, 5, 10]);

export function nowIso() {
  return new Date().toISOString();
}

export function id(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function requireAdminLevel(actor, level, action) {
  if (!actor || Number(actor.adminLevel) < level) {
    const error = new Error(PERMISSION_ERROR);
    error.code = 'PERMISSION_DENIED';
    error.action = action;
    throw error;
  }
}

export function ensurePositiveCents(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    const error = new Error(`${fieldName} debe ser un entero positivo en centimos`);
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
}

export function ensureRate(ratePercent) {
  if (!ALLOWED_RATES.has(Number(ratePercent))) {
    const error = new Error('La tasa debe ser 2%, 5% o 10%');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
}

export function cashBalanceCents(state) {
  return state.cashMovements.reduce((total, movement) => {
    return movement.direction === 'entrada' ? total + movement.amountCents : total - movement.amountCents;
  }, 0);
}

export function loanBalanceCents(loan) {
  return Math.max(loan.totalCents - loan.paidCents, 0);
}

export function quotaBalanceCents(quota) {
  return Math.max(quota.totalCents - quota.paidCents, 0);
}

export function hasGoodHistory(person) {
  return Number(person.punctualLoans || 0) > 2 && person.creditStatus !== 'evaluado';
}

export function createAudit(state, actor, action, entityType, entityId, result, details = {}) {
  state.auditEvents.unshift({
    id: id('audit'),
    at: nowIso(),
    actorId: actor?.id || 'anonymous',
    actorName: actor?.name || 'anonymous',
    adminLevel: actor?.adminLevel || 0,
    action,
    entityType,
    entityId,
    result,
    details
  });
}

export function createPerson(state, actor, payload) {
  ensureStateCollections(state);
  requireAdminLevel(actor, 2, 'personas.crear');
  if (!payload.name || /\d/.test(payload.name)) {
    throw validation('El nombre es obligatorio y no debe contener numeros');
  }
  if (!payload.document || !payload.phone || !payload.address) {
    throw validation('Documento, celular y direccion son obligatorios');
  }
  if (payload.email && !String(payload.email).includes('@')) {
    throw validation('Correo invalido');
  }

  const exists = state.people.some((person) => person.document === payload.document || (payload.email && person.email === payload.email));
  if (exists) {
    throw validation('Ya existe una persona con ese documento o correo');
  }

  const person = {
    id: id('person'),
    type: payload.type === 'empresa' ? 'empresa' : 'natural',
    name: payload.name.trim(),
    document: payload.document.trim(),
    phone: payload.phone.trim(),
    email: payload.email?.trim() || '',
    address: payload.address.trim(),
    roles: Array.isArray(payload.roles) && payload.roles.length > 0 ? payload.roles : ['Prestamista'],
    creditStatus: 'nuevo',
    loansCount: 0,
    punctualLoans: 0,
    registeredBy: actor.name,
    createdAt: nowIso()
  };

  state.people.unshift(person);
  createAudit(state, actor, 'personas.crear', 'personas', person.id, 'ok', { document: person.document, roles: person.roles });
  return person;
}

export function createLoan(state, actor, payload) {
  ensureStateCollections(state);
  requireAdminLevel(actor, 2, 'prestamos.crear');
  const person = state.people.find((item) => item.id === payload.personId);
  if (!person) throw validation('Prestamista no encontrado');
  if (!person.roles.includes('Prestamista')) throw validation('La persona debe tener rol Prestamista');

  ensurePositiveCents(payload.capitalCents, 'capitalCents');
  ensureRate(payload.ratePercent);
  if (!Number.isInteger(payload.months) || payload.months <= 0) throw validation('Los meses deben ser mayores a cero');
  const installmentCount = Number.isInteger(payload.installments) && payload.installments > 0 ? payload.installments : payload.months;
  if (!Number.isInteger(installmentCount) || installmentCount <= 0) throw validation('Las cuotas deben ser mayores a cero');

  const needsInitialLimit = person.creditStatus === 'nuevo' || Number(person.punctualLoans || 0) <= 2;
  if (needsInitialLimit && payload.capitalCents > INITIAL_LOAN_LIMIT_CENTS) {
    throw validation('Prestamista nuevo o sin mas de dos prestamos puntuales: maximo S/ 150');
  }

  const interestCents = Math.round(payload.capitalCents * (payload.ratePercent / 100));
  const totalCents = payload.capitalCents + interestCents;
  const loanDate = normalizeDate(payload.loanDate || payload.createdAt || nowIso());
  const loan = {
    id: id('loan'),
    personId: person.id,
    personName: person.name,
    capitalCents: payload.capitalCents,
    ratePercent: payload.ratePercent,
    interestCents,
    totalCents,
    paidCents: 0,
    months: payload.months,
    installments: installmentCount,
    status: person.creditStatus === 'evaluado' ? 'evaluado' : 'activo',
    createdBy: actor.id,
    createdAt: `${loanDate}T00:00:00.000Z`
  };

  if (cashBalanceCents(state) < payload.capitalCents) {
    throw validation('Caja insuficiente para desembolsar el prestamo');
  }

  state.loans.unshift(loan);
  const quotas = createLoanQuotas(loan, installmentCount, loanDate);
  state.quotas.unshift(...quotas);
  person.loansCount += 1;
  state.cashMovements.unshift({
    id: id('cash'),
    at: nowIso(),
    type: 'prestamo',
    description: `Desembolso ${loan.id}`,
    amountCents: payload.capitalCents,
    direction: 'salida',
    referenceType: 'prestamo',
    referenceId: loan.id,
    actorId: actor.id
  });
  createAudit(state, actor, 'prestamos.crear', 'prestamos', loan.id, 'ok', {
    capitalCents: loan.capitalCents,
    ratePercent: loan.ratePercent,
    installments: installmentCount,
    quotaIds: quotas.map((quota) => quota.id)
  });
  return { ...loan, quotas };
}

export function registerPayment(state, actor, payload) {
  ensureStateCollections(state);
  requireAdminLevel(actor, 2, 'pagos.registrar');
  ensurePositiveCents(payload.amountCents, 'amountCents');
  const loan = state.loans.find((item) => item.id === payload.loanId);
  if (!loan) throw validation('Prestamo no encontrado');
  if (loan.status === 'anulado') throw validation('No se puede pagar un prestamo anulado');
  if (loanBalanceCents(loan) <= 0) throw validation('Prestamo ya pagado');

  const amountCents = Math.min(payload.amountCents, loanBalanceCents(loan));
  const applications = applyPaymentToQuotas(state, loan, amountCents);
  const installmentsClosed = applications.filter((application) => application.closedQuota).length;
  loan.paidCents += amountCents;
  if (loan.paidCents >= loan.totalCents) {
    loan.status = 'pagado';
    const person = state.people.find((item) => item.id === loan.personId);
    if (person) person.punctualLoans += 1;
  }

  const payment = {
    id: id('payment'),
    loanId: loan.id,
    personId: loan.personId,
    personName: loan.personName,
    amountCents,
    installmentsClosed,
    createdBy: actor.id,
    createdAt: nowIso()
  };
  state.payments.unshift(payment);
  for (const application of applications) {
    state.paymentApplications.unshift({
      ...application,
      paymentId: payment.id,
      createdAt: payment.createdAt
    });
  }
  state.cashMovements.unshift({
    id: id('cash'),
    at: nowIso(),
    type: 'pago',
    description: `Pago ${loan.id}`,
    amountCents,
    direction: 'entrada',
    referenceType: 'pago',
    referenceId: payment.id,
    actorId: actor.id
  });

  const receipt = createReceipt(state, actor, loan, payment);
  createAudit(state, actor, 'pagos.registrar', 'pagos', payment.id, 'ok', {
    amountCents,
    installmentsClosed,
    receiptId: receipt.id,
    applications: applications.map((application) => ({ quotaId: application.quotaId, amountCents: application.amountCents }))
  });
  return { payment, receipt, loan, applications };
}

export function addCashIncome(state, actor, payload) {
  ensureStateCollections(state);
  requireAdminLevel(actor, 2, 'caja.ingresar');
  ensurePositiveCents(payload.amountCents, 'amountCents');
  if (!payload.reason || !payload.reason.trim()) throw validation('La justificacion es obligatoria');
  const movement = {
    id: id('cash'),
    at: nowIso(),
    type: 'ingreso',
    description: payload.reason.trim(),
    amountCents: payload.amountCents,
    direction: 'entrada',
    referenceType: 'ingreso_manual',
    referenceId: null,
    actorId: actor.id
  };
  state.cashMovements.unshift(movement);
  createAudit(state, actor, 'caja.ingresar', 'movimientos_caja', movement.id, 'ok', { amountCents: movement.amountCents });
  return movement;
}

export function closeCash(state, actor, payload) {
  ensureStateCollections(state);
  requireAdminLevel(actor, 2, 'caja.cerrar');
  if (!Number.isInteger(payload.countedCents) || payload.countedCents < 0) throw validation('El saldo contado debe ser cero o positivo');
  const expectedCents = cashBalanceCents(state);
  const differenceCents = payload.countedCents - expectedCents;
  if (differenceCents !== 0 && !payload.reason?.trim()) throw validation('La diferencia requiere observacion obligatoria');
  const close = {
    id: id('cash-close'),
    at: nowIso(),
    range: payload.range || 'Dia actual',
    expectedCents,
    countedCents: payload.countedCents,
    differenceCents,
    reason: payload.reason || 'Sin diferencia',
    actorId: actor.id
  };
  state.cashClosures.unshift(close);
  createAudit(state, actor, 'caja.cerrar', 'cierres_caja', close.id, 'ok', { expectedCents, countedCents: payload.countedCents, differenceCents });
  return close;
}

export function dashboard(state) {
  ensureStateCollections(state);
  refreshQuotaStatuses(state);
  return {
    cashBalanceCents: cashBalanceCents(state),
    activeLoanBalanceCents: state.loans.reduce((sum, loan) => sum + loanBalanceCents(loan), 0),
    interestGeneratedCents: state.loans.reduce((sum, loan) => sum + loan.interestCents, 0),
    priorityPayments: state.quotas.filter((quota) => quota.status === 'vencida' || quota.status === 'prioritaria').length,
    quotaCount: state.quotas.length,
    peopleCount: state.people.length,
    loanCount: state.loans.length,
    paymentCount: state.payments.length,
    receiptCount: state.receipts.length
  };
}

export function refreshQuotaStatuses(state, referenceDate = todayDate()) {
  ensureStateCollections(state);
  for (const quota of state.quotas) {
    if (quota.status === 'anulada') continue;
    if (quota.paidCents >= quota.totalCents) {
      quota.status = 'pagada';
    } else if (quota.dueDate < referenceDate) {
      quota.status = 'vencida';
    } else if (quota.dueDate === referenceDate) {
      quota.status = 'prioritaria';
    } else if (quota.paidCents > 0) {
      quota.status = 'parcial';
    } else {
      quota.status = 'pendiente';
    }
  }
  return state.quotas;
}

function createReceipt(state, actor, loan, payment) {
  const receipt = {
    id: id('receipt'),
    number: `BOL-${new Date().getFullYear()}-${String(state.receipts.length + 1).padStart(4, '0')}`,
    loanId: loan.id,
    paymentId: payment.id,
    personName: loan.personName,
    capitalCents: loan.capitalCents,
    ratePercent: loan.ratePercent,
    interestCents: loan.interestCents,
    totalCents: loan.totalCents,
    paidCents: loan.paidCents,
    balanceCents: loanBalanceCents(loan),
    status: loan.status,
    installmentsClosed: payment.installmentsClosed,
    issuedBy: actor.id,
    issuedAt: nowIso()
  };
  state.receipts.unshift(receipt);
  return receipt;
}

function ensureStateCollections(state) {
  state.quotas ||= [];
  state.paymentApplications ||= [];
}

function createLoanQuotas(loan, installmentCount, loanDate) {
  const capitalParts = splitCents(loan.capitalCents, installmentCount);
  const interestParts = splitCents(loan.interestCents, installmentCount);
  return capitalParts.map((capitalCents, index) => {
    const interestCents = interestParts[index];
    return {
      id: id('quota'),
      loanId: loan.id,
      number: index + 1,
      dueDate: addMonths(loanDate, index + 1),
      capitalCents,
      interestCents,
      moraCents: 0,
      totalCents: capitalCents + interestCents,
      paidCents: 0,
      status: 'pendiente',
      createdAt: loan.createdAt
    };
  });
}

function applyPaymentToQuotas(state, loan, amountCents) {
  refreshQuotaStatuses(state);
  let remaining = amountCents;
  const applications = [];
  const quotas = state.quotas
    .filter((quota) => quota.loanId === loan.id && quota.status !== 'pagada' && quota.status !== 'anulada')
    .sort((left, right) => left.number - right.number);

  for (const quota of quotas) {
    if (remaining <= 0) break;
    const before = quota.paidCents;
    const applied = Math.min(remaining, quotaBalanceCents(quota));
    quota.paidCents += applied;
    remaining -= applied;
    refreshSingleQuotaStatus(quota);
    applications.push({
      id: id('payment-app'),
      loanId: loan.id,
      quotaId: quota.id,
      quotaNumber: quota.number,
      amountCents: applied,
      closedQuota: before < quota.totalCents && quota.paidCents >= quota.totalCents
    });
  }

  if (applications.length === 0) {
    applications.push({
      id: id('payment-app'),
      loanId: loan.id,
      quotaId: null,
      quotaNumber: 0,
      amountCents,
      closedQuota: loan.paidCents + amountCents >= loan.totalCents
    });
  }

  return applications;
}

function refreshSingleQuotaStatus(quota) {
  if (quota.status === 'anulada') return;
  if (quota.paidCents >= quota.totalCents) {
    quota.status = 'pagada';
  } else if (quota.paidCents > 0) {
    quota.status = 'parcial';
  }
}

function splitCents(totalCents, parts) {
  const base = Math.floor(totalCents / parts);
  const remainder = totalCents % parts;
  return Array.from({ length: parts }, (_, index) => base + (index < remainder ? 1 : 0));
}

function normalizeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw validation('Fecha de prestamo invalida');
  return date.toISOString().slice(0, 10);
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function addMonths(dateText, months) {
  const [year, month, day] = dateText.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString().slice(0, 10);
}

function validation(message) {
  const error = new Error(message);
  error.code = 'VALIDATION_ERROR';
  return error;
}
