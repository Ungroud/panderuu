import {
  DEFAULT_TEMPORARY_PASSWORD,
  SESSION_TTL_MS,
  assertPasswordPolicy,
  createSessionToken,
  defaultUsernameForActor,
  hashPassword,
  hashSessionToken,
  normalizeUsername,
  usernameFromPerson,
  verifyPassword
} from './auth.mjs';

export const PERMISSION_ERROR = 'permisos no autorizados';
export const INITIAL_LOAN_LIMIT_CENTS = 15000;
export const BASE_RATE_PERCENT = 5;
export const DAILY_MORA_RATE = 0.001;
export const ALLOWED_RATES = new Set([2, 5, 10]);
export const ALLOWED_ROLES = ['Administrador', 'Prestamista', 'Asociado'];

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

export function dailyMoraCents(loan) {
  return Math.round(loan.capitalCents * DAILY_MORA_RATE);
}

export function loanMoraCents(state, loan) {
  ensureStateCollections(state);
  return state.quotas.filter((quota) => quota.loanId === loan.id).reduce((sum, quota) => sum + Number(quota.moraCents || 0), 0);
}

export function loanDueBalanceCents(state, loan) {
  ensureStateCollections(state);
  const quotas = state.quotas.filter((quota) => quota.loanId === loan.id);
  if (quotas.length === 0) return loanBalanceCents(loan);
  return quotas.reduce((sum, quota) => sum + quotaBalanceCents(quota), 0);
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

export function login(state, payload) {
  ensureStateCollections(state);
  const username = safeNormalizeLoginUsername(payload?.username);
  const actor = state.actors.find((item) => item.username === username);

  if (!actor) {
    createAudit(state, null, 'auth.login', 'actores', username || 'unknown', 'failed', { reason: 'not_found' });
    throw authFailed();
  }

  if ((actor.status || 'activo') !== 'activo') {
    createAudit(state, actor, 'auth.login', 'actores', actor.id, 'failed', { reason: 'inactive' });
    throw authBlocked('Usuario inactivo', true);
  }

  if (!verifyPassword(payload?.password, actor.passwordHash)) {
    actor.failedLoginCount = Number(actor.failedLoginCount || 0) + 1;
    createAudit(state, actor, 'auth.login', 'actores', actor.id, 'failed', { reason: 'bad_password' });
    throw authFailed();
  }

  const issuedAt = nowIso();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const token = createSessionToken();
  const session = {
    id: id('session'),
    actorId: actor.id,
    tokenHash: hashSessionToken(token),
    createdAt: issuedAt,
    expiresAt,
    revokedAt: '',
    lastSeenAt: issuedAt
  };

  actor.failedLoginCount = 0;
  actor.lastLoginAt = issuedAt;
  state.sessions.unshift(session);
  createAudit(state, actor, 'auth.login', 'actores', actor.id, 'ok', { sessionId: session.id, expiresAt });

  return {
    token,
    tokenType: 'Bearer',
    expiresAt,
    actor: publicActor(actor),
    mustChangePassword: Boolean(actor.mustChangePassword)
  };
}

export function authenticateSession(state, token) {
  ensureStateCollections(state);
  if (!token) throw authRequired();

  const tokenHash = hashSessionToken(token);
  const session = state.sessions.find((item) => item.tokenHash === tokenHash);
  if (!session || session.revokedAt) throw authRequired('Sesion invalida');
  if (new Date(session.expiresAt).getTime() <= Date.now()) throw authRequired('Sesion expirada', 'AUTH_EXPIRED');

  const actor = state.actors.find((item) => item.id === session.actorId);
  if (!actor) throw authRequired('Usuario de sesion no encontrado');
  if ((actor.status || 'activo') !== 'activo') throw authBlocked('Usuario inactivo');

  session.lastSeenAt = nowIso();
  return { actor, session };
}

export function logoutSession(state, actor, session) {
  ensureStateCollections(state);
  if (!session) {
    return { loggedOut: false, reason: 'Sesion no persistida' };
  }

  session.revokedAt = nowIso();
  createAudit(state, actor, 'auth.logout', 'sesiones', session.id, 'ok', {});
  return { loggedOut: true, sessionId: session.id };
}

export function changePassword(state, actor, session, payload) {
  ensureStateCollections(state);
  if (!verifyPassword(payload?.currentPassword, actor.passwordHash)) {
    createAudit(state, actor, 'auth.change_password', 'actores', actor.id, 'failed', { reason: 'bad_current_password' });
    throw authFailed('Clave actual incorrecta');
  }

  assertPasswordPolicy(payload?.newPassword);
  actor.passwordHash = hashPassword(payload.newPassword);
  actor.mustChangePassword = false;
  for (const storedSession of state.sessions) {
    if (storedSession.actorId === actor.id && storedSession.id !== session?.id && !storedSession.revokedAt) {
      storedSession.revokedAt = nowIso();
    }
  }
  createAudit(state, actor, 'auth.change_password', 'actores', actor.id, 'ok', {
    keptSessionId: session?.id || null
  });
  return { actor: publicActor(actor) };
}

export function publicActor(actor) {
  return {
    id: actor.id,
    name: actor.name,
    adminLevel: Number(actor.adminLevel),
    seedAdmin: Boolean(actor.seedAdmin),
    personId: actor.personId || null,
    createdBy: actor.createdBy || 'system',
    createdAt: actor.createdAt || '',
    status: actor.status || 'activo',
    username: actor.username || defaultUsernameForActor(actor),
    mustChangePassword: Boolean(actor.mustChangePassword),
    lastLoginAt: actor.lastLoginAt || ''
  };
}

export function safeDebugState(state) {
  ensureStateCollections(state);
  return {
    ...state,
    actors: state.actors.map(publicActor),
    sessions: state.sessions.map((session) => ({
      id: session.id,
      actorId: session.actorId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
      lastSeenAt: session.lastSeenAt
    }))
  };
}

export function createPerson(state, actor, payload) {
  ensureStateCollections(state);
  requireAdminLevel(actor, 2, 'personas.crear');
  const type = normalizePersonType(payload.type);
  if (!payload.name || /\d/.test(payload.name)) {
    throw validation('El nombre es obligatorio y no debe contener numeros');
  }
  if (!payload.document || !payload.phone || !payload.address) {
    throw validation('Documento, celular y direccion son obligatorios');
  }
  const document = normalizeDocument(type, payload.document);
  const phone = normalizePhone(payload.phone);
  const email = normalizeEmail(payload.email);
  const roles = normalizeRoles(Array.isArray(payload.roles) && payload.roles.length > 0 ? payload.roles : ['Prestamista']);

  const exists = state.people.some((person) => person.document === document || (email && person.email === email));
  if (exists) {
    throw validation('Ya existe una persona con ese documento o correo');
  }

  const person = {
    id: id('person'),
    type,
    name: payload.name.trim(),
    document,
    phone,
    email,
    address: payload.address.trim(),
    roles,
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

export function createAdmin(state, actor, payload) {
  ensureStateCollections(state);
  requireAdminLevel(actor, 3, 'administradores.crear');
  const adminLevel = Number(payload.adminLevel);
  if (![1, 2, 3].includes(adminLevel)) throw validation('El nivel de administrador debe ser 1, 2 o 3');

  const roles = normalizeRoles(['Administrador', ...(Array.isArray(payload.roles) ? payload.roles : [])]);
  const person = createPerson(state, actor, {
    ...payload,
    roles
  });
  const username = uniqueUsername(state, payload.username ? normalizeUsername(payload.username) : usernameFromPerson(person));
  const temporaryPassword = payload.password || DEFAULT_TEMPORARY_PASSWORD;
  const admin = {
    id: id('admin'),
    name: person.name,
    adminLevel,
    seedAdmin: false,
    personId: person.id,
    createdBy: actor.id,
    createdAt: nowIso(),
    status: 'activo',
    username,
    passwordHash: hashPassword(temporaryPassword),
    mustChangePassword: true,
    failedLoginCount: 0,
    lastLoginAt: '',
    lockedUntil: ''
  };

  state.actors.unshift(admin);
  createAudit(state, actor, 'administradores.crear', 'actores', admin.id, 'ok', {
    personId: person.id,
    adminLevel,
    roles: person.roles,
    username
  });
  return {
    admin: publicActor(admin),
    person,
    temporaryPassword: payload.password ? undefined : DEFAULT_TEMPORARY_PASSWORD
  };
}

export function administrators(state) {
  ensureStateCollections(state);
  return state.actors
    .filter((actor) => Number(actor.adminLevel) > 0)
    .map((actor) => {
      const person = actor.personId ? state.people.find((item) => item.id === actor.personId) : null;
      return {
        ...publicActor(actor),
        person
      };
    });
}

export function people(state) {
  ensureStateCollections(state);
  return state.people;
}

export function peopleByRole(state, role) {
  ensureStateCollections(state);
  const normalizedRole = normalizeRole(role);
  return state.people.filter((person) => person.roles.includes(normalizedRole));
}

export function personProfile(state, personId) {
  ensureStateCollections(state);
  if (!personId) throw validation('El id de persona es obligatorio');
  const person = state.people.find((item) => item.id === personId);
  if (!person) throw validation('Persona no encontrada');
  const loans = state.loans.filter((loan) => loan.personId === person.id);
  const loanIds = new Set(loans.map((loan) => loan.id));
  const quotas = state.quotas.filter((quota) => loanIds.has(quota.loanId));
  const payments = state.payments.filter((payment) => payment.personId === person.id);
  const receipts = state.receipts.filter((receipt) => loanIds.has(receipt.loanId));
  const admin = state.actors.find((actor) => actor.personId === person.id) || null;
  return {
    person,
    admin,
    loans,
    quotas,
    payments,
    receipts,
    summary: {
      loanCount: loans.length,
      activeLoanCount: loans.filter((loan) => loan.status !== 'pagado' && loan.status !== 'anulado').length,
      paymentCount: payments.length,
      quotaCount: quotas.length,
      receiptCount: receipts.length
    }
  };
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
  const paymentDate = normalizeDate(payload.paymentDate || nowIso());
  refreshQuotaStatuses(state, paymentDate);
  const dueBeforePayment = loanDueBalanceCents(state, loan);
  if (dueBeforePayment <= 0) throw validation('Prestamo ya pagado');

  const hadMoraBeforePayment = loanMoraCents(state, loan) > 0;
  const amountCents = Math.min(payload.amountCents, dueBeforePayment);
  const applications = applyPaymentToQuotas(state, loan, amountCents);
  const installmentsClosed = applications.filter((application) => application.closedQuota).length;
  loan.paidCents += amountCents;
  if (loanDueBalanceCents(state, loan) <= 0) {
    loan.status = 'pagado';
    const person = state.people.find((item) => item.id === loan.personId);
    if (person) {
      if (hadMoraBeforePayment) {
        person.creditStatus = 'evaluado';
      } else {
        person.punctualLoans += 1;
        if (person.punctualLoans > 2) person.creditStatus = 'buen_historial';
      }
    }
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
    activeLoanBalanceCents: state.loans.reduce((sum, loan) => sum + loanDueBalanceCents(state, loan), 0),
    interestGeneratedCents: state.loans.reduce((sum, loan) => sum + loan.interestCents, 0),
    moraGeneratedCents: state.loans.reduce((sum, loan) => sum + loanMoraCents(state, loan), 0),
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
  const loansById = new Map(state.loans.map((loan) => [loan.id, loan]));
  const peopleById = new Map(state.people.map((person) => [person.id, person]));
  for (const quota of state.quotas) {
    if (quota.status === 'anulada') continue;
    const loan = loansById.get(quota.loanId);
    const baseTotalCents = quota.capitalCents + quota.interestCents;
    const overdueDays = loan && quota.status !== 'pagada' ? daysPastDue(quota.dueDate, referenceDate) : 0;

    if (loan && quota.status !== 'pagada') {
      quota.moraCents = dailyMoraCents(loan) * overdueDays;
      quota.totalCents = baseTotalCents + quota.moraCents;
      if (overdueDays > 0) {
        const person = peopleById.get(loan.personId);
        if (person) person.creditStatus = 'evaluado';
        if (loan.status !== 'pagado' && loan.status !== 'anulado' && loan.status !== 'evaluado') {
          loan.status = 'vencido';
        }
      }
    }

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
  const moraCents = loanMoraCents(state, loan);
  const totalDueCents = loan.totalCents + moraCents;
  const receipt = {
    id: id('receipt'),
    number: `BOL-${new Date().getFullYear()}-${String(state.receipts.length + 1).padStart(4, '0')}`,
    loanId: loan.id,
    paymentId: payment.id,
    personName: loan.personName,
    capitalCents: loan.capitalCents,
    ratePercent: loan.ratePercent,
    interestCents: loan.interestCents,
    moraCents,
    totalCents: totalDueCents,
    paidCents: loan.paidCents,
    balanceCents: loanDueBalanceCents(state, loan),
    status: loan.status,
    installmentsClosed: payment.installmentsClosed,
    issuedBy: actor.id,
    issuedAt: nowIso()
  };
  state.receipts.unshift(receipt);
  return receipt;
}

function ensureStateCollections(state) {
  state.actors ||= [];
  state.people ||= [];
  state.loans ||= [];
  state.payments ||= [];
  state.cashMovements ||= [];
  state.cashClosures ||= [];
  state.receipts ||= [];
  state.auditEvents ||= [];
  state.quotas ||= [];
  state.paymentApplications ||= [];
  state.sessions ||= [];

  for (const actor of state.actors) {
    actor.username ||= defaultUsernameForActor(actor);
    actor.passwordHash ||= hashPassword(DEFAULT_TEMPORARY_PASSWORD);
    actor.mustChangePassword = actor.mustChangePassword === false || actor.mustChangePassword === 0 ? false : true;
    actor.failedLoginCount = Number(actor.failedLoginCount || 0);
    actor.lastLoginAt ||= '';
    actor.lockedUntil ||= '';
    actor.status ||= 'activo';
    actor.createdBy ||= 'system';
    actor.createdAt ||= '';
  }
}

function safeNormalizeLoginUsername(username) {
  try {
    return normalizeUsername(username);
  } catch {
    return String(username || '').trim().toLowerCase();
  }
}

function uniqueUsername(state, requestedUsername) {
  const base = normalizeUsername(requestedUsername);
  let candidate = base;
  let suffix = 2;
  const usernames = new Set(state.actors.map((actor) => actor.username));
  while (usernames.has(candidate)) {
    candidate = normalizeUsername(`${base}-${suffix}`);
    suffix += 1;
  }
  return candidate;
}

function authFailed(message = 'Credenciales invalidas') {
  const error = new Error(message);
  error.code = 'AUTH_FAILED';
  error.audited = true;
  return error;
}

function authRequired(message = 'Autenticacion requerida', code = 'AUTH_REQUIRED') {
  const error = new Error(message);
  error.code = code;
  return error;
}

function authBlocked(message, audited = false) {
  const error = new Error(message);
  error.code = 'AUTH_BLOCKED';
  error.audited = audited;
  return error;
}

function normalizePersonType(type) {
  const value = type ? String(type).trim().toLowerCase() : 'natural';
  if (!['natural', 'empresa'].includes(value)) throw validation('Tipo de persona debe ser natural o empresa');
  return value;
}

function normalizeDocument(type, document) {
  const digits = String(document).replace(/\D/g, '');
  if (type === 'empresa') {
    if (digits.length !== 11) throw validation('RUC debe tener 11 digitos');
    return `RUC ${digits}`;
  }
  if (digits.length !== 8) throw validation('DNI debe tener 8 digitos');
  return `DNI ${digits}`;
}

function normalizePhone(phone) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length !== 9) throw validation('Celular debe tener 9 digitos');
  return digits;
}

function normalizeEmail(email) {
  const value = String(email || '').trim().toLowerCase();
  if (!value) return '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw validation('Correo invalido');
  return value;
}

function normalizeRoles(roles) {
  return [...new Set(roles.map(normalizeRole))];
}

function normalizeRole(role) {
  const value = String(role || '').trim().toLowerCase();
  const found = ALLOWED_ROLES.find((allowed) => allowed.toLowerCase() === value);
  if (!found) throw validation(`Rol invalido: ${role}`);
  return found;
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

function daysPastDue(dueDate, referenceDate) {
  const due = Date.parse(`${dueDate}T00:00:00.000Z`);
  const reference = Date.parse(`${normalizeDate(referenceDate)}T00:00:00.000Z`);
  if (Number.isNaN(due) || Number.isNaN(reference) || reference <= due) return 0;
  return Math.floor((reference - due) / 86400000);
}

function validation(message) {
  const error = new Error(message);
  error.code = 'VALIDATION_ERROR';
  return error;
}
