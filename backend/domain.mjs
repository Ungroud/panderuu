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
  requireAdminLevel(actor, 2, 'prestamos.crear');
  const person = state.people.find((item) => item.id === payload.personId);
  if (!person) throw validation('Prestamista no encontrado');
  if (!person.roles.includes('Prestamista')) throw validation('La persona debe tener rol Prestamista');

  ensurePositiveCents(payload.capitalCents, 'capitalCents');
  ensureRate(payload.ratePercent);
  if (!Number.isInteger(payload.installments) || payload.installments <= 0) throw validation('Las cuotas deben ser mayores a cero');
  if (!Number.isInteger(payload.months) || payload.months <= 0) throw validation('Los meses deben ser mayores a cero');

  const needsInitialLimit = person.creditStatus === 'nuevo' || Number(person.punctualLoans || 0) <= 2;
  if (needsInitialLimit && payload.capitalCents > INITIAL_LOAN_LIMIT_CENTS) {
    throw validation('Prestamista nuevo o sin mas de dos prestamos puntuales: maximo S/ 150');
  }

  const interestCents = Math.round(payload.capitalCents * (payload.ratePercent / 100));
  const totalCents = payload.capitalCents + interestCents;
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
    installments: payload.installments,
    status: person.creditStatus === 'evaluado' ? 'evaluado' : 'activo',
    createdBy: actor.id,
    createdAt: nowIso()
  };

  if (cashBalanceCents(state) < payload.capitalCents) {
    throw validation('Caja insuficiente para desembolsar el prestamo');
  }

  state.loans.unshift(loan);
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
  createAudit(state, actor, 'prestamos.crear', 'prestamos', loan.id, 'ok', { capitalCents: loan.capitalCents, ratePercent: loan.ratePercent });
  return loan;
}

export function registerPayment(state, actor, payload) {
  requireAdminLevel(actor, 2, 'pagos.registrar');
  ensurePositiveCents(payload.amountCents, 'amountCents');
  const loan = state.loans.find((item) => item.id === payload.loanId);
  if (!loan) throw validation('Prestamo no encontrado');
  if (loan.status === 'anulado') throw validation('No se puede pagar un prestamo anulado');

  const amountCents = Math.min(payload.amountCents, loanBalanceCents(loan));
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
    installmentsClosed: payload.installmentsClosed || 1,
    createdBy: actor.id,
    createdAt: nowIso()
  };
  state.payments.unshift(payment);
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
  createAudit(state, actor, 'pagos.registrar', 'pagos', payment.id, 'ok', { amountCents, receiptId: receipt.id });
  return { payment, receipt, loan };
}

export function addCashIncome(state, actor, payload) {
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
  return {
    cashBalanceCents: cashBalanceCents(state),
    activeLoanBalanceCents: state.loans.reduce((sum, loan) => sum + loanBalanceCents(loan), 0),
    interestGeneratedCents: state.loans.reduce((sum, loan) => sum + loan.interestCents, 0),
    priorityPayments: state.loans.filter((loan) => loan.status === 'vencido' || loan.status === 'evaluado').length,
    peopleCount: state.people.length,
    loanCount: state.loans.length,
    paymentCount: state.payments.length,
    receiptCount: state.receipts.length
  };
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
    issuedBy: actor.id,
    issuedAt: nowIso()
  };
  state.receipts.unshift(receipt);
  return receipt;
}

function validation(message) {
  const error = new Error(message);
  error.code = 'VALIDATION_ERROR';
  return error;
}

