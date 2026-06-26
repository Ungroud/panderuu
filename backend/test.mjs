import assert from 'node:assert/strict';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import {
  BASE_RATE_PERCENT,
  DAILY_MORA_RATE,
  INITIAL_LOAN_LIMIT_CENTS,
  addCashIncome,
  administrators,
  cashBalanceCents,
  closeCash,
  createAdmin,
  createLoan,
  createPerson,
  dailyMoraCents,
  dashboard,
  loanDueBalanceCents,
  people,
  peopleByRole,
  personProfile,
  quotaBalanceCents,
  refreshQuotaStatuses,
  registerPayment
} from './domain.mjs';
import { seedState } from './storage.mjs';
import { loadSqliteState, withSqliteStateTransaction } from './sqlite-storage.mjs';

const state = seedState();
const admin1 = state.actors.find((actor) => actor.adminLevel === 1);
const admin2 = state.actors.find((actor) => actor.adminLevel === 2);
const admin3 = state.actors.find((actor) => actor.adminLevel === 3);

assert.equal(BASE_RATE_PERCENT, 5);
assert.equal(DAILY_MORA_RATE, 0.001);
assert.equal(INITIAL_LOAN_LIMIT_CENTS, 15000);
assert.equal(cashBalanceCents(state), 180000);

assert.throws(
  () =>
    createPerson(state, admin1, {
      type: 'natural',
      name: 'Persona Bloqueada',
      document: 'DNI 70000999',
      phone: '999',
      address: 'Demo'
    }),
  /permisos no autorizados/
);

const person = createPerson(state, admin2, {
  type: 'natural',
  name: 'Persona Demo Backend',
  document: 'DNI 70000998',
  phone: '999 000 111',
  email: 'backend@example.local',
  address: 'Direccion backend',
  roles: ['Prestamista']
});
assert.equal(person.creditStatus, 'nuevo');
assert.equal(person.document, 'DNI 70000998');
assert.equal(person.phone, '999000111');

assert.throws(
  () =>
    createPerson(state, admin2, {
      type: 'natural',
      name: 'Documento Malo',
      document: 'DNI 123',
      phone: '999000000',
      address: 'Direccion documento'
    }),
  /DNI debe tener 8 digitos/
);

assert.throws(
  () =>
    createPerson(state, admin2, {
      type: 'natural',
      name: 'Celular Malo',
      document: 'DNI 70000994',
      phone: '123',
      address: 'Direccion celular'
    }),
  /Celular debe tener 9 digitos/
);

assert.throws(
  () =>
    createPerson(state, admin2, {
      type: 'natural',
      name: 'Correo Malo',
      document: 'DNI 70000993',
      phone: '999000333',
      email: 'correo-malo',
      address: 'Direccion correo'
    }),
  /Correo invalido/
);

assert.throws(
  () =>
    createPerson(state, admin2, {
      type: 'natural',
      name: 'Rol Malo',
      document: 'DNI 70000992',
      phone: '999000332',
      address: 'Direccion rol',
      roles: ['Cliente']
    }),
  /Rol invalido/
);

const associate = createPerson(state, admin2, {
  type: 'empresa',
  name: 'Empresa Backend',
  document: 'RUC 20123456789',
  phone: '999888777',
  email: 'EMPRESA.BACKEND@example.local',
  address: 'Av Empresa',
  roles: ['Asociado']
});
assert.equal(associate.document, 'RUC 20123456789');
assert.equal(associate.email, 'empresa.backend@example.local');
assert.ok(people(state).some((item) => item.id === associate.id));
assert.ok(peopleByRole(state, 'Asociado').some((item) => item.id === associate.id));
assert.ok(peopleByRole(state, 'Prestamista').some((item) => item.id === person.id));
assert.equal(personProfile(state, associate.id).summary.loanCount, 0);

assert.throws(
  () =>
    createAdmin(state, admin2, {
      type: 'natural',
      name: 'Admin Bloqueado',
      document: 'DNI 70000997',
      phone: '999 000 222',
      email: 'bloqueado@example.local',
      address: 'Direccion bloqueada',
      adminLevel: 1
    }),
  /permisos no autorizados/
);

assert.throws(
  () =>
    createAdmin(state, admin3, {
      type: 'natural',
      name: 'Admin Nivel Incorrecto',
      document: 'DNI 70000996',
      phone: '999 000 333',
      email: 'nivel@example.local',
      address: 'Direccion nivel',
      adminLevel: 4
    }),
  /debe ser 1, 2 o 3/
);

const createdAdmin = createAdmin(state, admin3, {
  type: 'natural',
  name: 'Admin Operativo',
  document: 'DNI 70000995',
  phone: '999 000 444',
  email: 'operativo@example.local',
  address: 'Direccion operativo',
  roles: ['Prestamista'],
  adminLevel: 2
});
assert.equal(createdAdmin.admin.adminLevel, 2);
assert.equal(createdAdmin.admin.status, 'activo');
assert.equal(createdAdmin.admin.personId, createdAdmin.person.id);
assert.deepEqual(createdAdmin.person.roles, ['Administrador', 'Prestamista']);
assert.ok(administrators(state).some((admin) => admin.id === createdAdmin.admin.id && admin.person?.document === 'DNI 70000995'));

assert.throws(
  () =>
    createLoan(state, admin2, {
      personId: person.id,
      capitalCents: 15100,
      ratePercent: 5,
      months: 1,
      installments: 1
    }),
  /maximo S\/ 150/
);

const loan = createLoan(state, admin2, {
  personId: person.id,
  capitalCents: 15000,
  ratePercent: 5,
  months: 1,
  installments: 1
});
assert.equal(loan.interestCents, 750);
assert.equal(loan.totalCents, 15750);
assert.equal(loan.quotas.length, 1);
assert.equal(loan.quotas[0].totalCents, 15750);
assert.equal(cashBalanceCents(state), 165000);

const { applications, payment, receipt } = registerPayment(state, admin2, {
  loanId: loan.id,
  amountCents: 15750,
  installmentsClosed: 1
});
assert.equal(payment.amountCents, 15750);
assert.equal(payment.installmentsClosed, 1);
assert.equal(applications.length, 1);
assert.equal(receipt.balanceCents, 0);
assert.equal(state.quotas.find((quota) => quota.loanId === loan.id).status, 'pagada');
assert.equal(cashBalanceCents(state), 180750);

const multiLoan = createLoan(state, admin2, {
  personId: person.id,
  capitalCents: 15000,
  ratePercent: 5,
  months: 3,
  installments: 3,
  loanDate: '2026-07-15'
});
const multiQuotas = state.quotas.filter((quota) => quota.loanId === multiLoan.id).sort((left, right) => left.number - right.number);
assert.equal(multiQuotas.length, 3);
assert.deepEqual(
  multiQuotas.map((quota) => quota.dueDate),
  ['2026-08-15', '2026-09-15', '2026-10-15']
);
assert.equal(multiQuotas.reduce((sum, quota) => sum + quota.totalCents, 0), multiLoan.totalCents);
assert.equal(multiQuotas[0].totalCents, 5250);
assert.equal(cashBalanceCents(state), 165750);

const multiPayment = registerPayment(state, admin2, {
  loanId: multiLoan.id,
  amountCents: 10500,
  paymentDate: '2026-08-15'
});
assert.equal(multiPayment.payment.installmentsClosed, 2);
assert.equal(multiPayment.applications.length, 2);
assert.equal(multiPayment.loan.status, 'activo');
assert.equal(quotaBalanceCents(multiQuotas[0]), 0);
assert.equal(quotaBalanceCents(multiQuotas[1]), 0);
assert.equal(quotaBalanceCents(multiQuotas[2]), 5250);
assert.equal(cashBalanceCents(state), 176250);

const moraState = seedState();
const moraAdmin = moraState.actors.find((actor) => actor.id === 'admin-caja');
const moraBorrower = moraState.people.find((item) => item.id === 'person-demo-company');
const moraLoan = createLoan(moraState, moraAdmin, {
  personId: moraBorrower.id,
  capitalCents: 100000,
  ratePercent: 5,
  months: 1,
  installments: 1,
  loanDate: '2026-01-01'
});
const moraQuota = moraState.quotas.find((quota) => quota.loanId === moraLoan.id);
assert.equal(dailyMoraCents(moraLoan), 100);
refreshQuotaStatuses(moraState, '2026-02-04');
assert.equal(moraQuota.moraCents, 300);
assert.equal(moraQuota.totalCents, 105300);
assert.equal(moraQuota.status, 'vencida');
assert.equal(moraBorrower.creditStatus, 'evaluado');
assert.equal(loanDueBalanceCents(moraState, moraLoan), 105300);

const moraPayment = registerPayment(moraState, moraAdmin, {
  loanId: moraLoan.id,
  amountCents: 105300,
  paymentDate: '2026-02-04'
});
assert.equal(moraPayment.payment.amountCents, 105300);
assert.equal(moraPayment.receipt.moraCents, 300);
assert.equal(moraPayment.receipt.balanceCents, 0);
assert.equal(moraPayment.loan.status, 'pagado');
assert.equal(moraBorrower.creditStatus, 'evaluado');
assert.equal(cashBalanceCents(moraState), 185300);

const income = addCashIncome(state, admin2, { amountCents: 10000, reason: 'Ingreso demo test' });
assert.equal(income.direction, 'entrada');

assert.throws(() => closeCash(state, admin2, { countedCents: 1, range: 'Dia actual' }), /observacion obligatoria/);
const close = closeCash(state, admin2, { countedCents: cashBalanceCents(state), range: 'Dia actual' });
assert.equal(close.differenceCents, 0);

const summary = dashboard(state);
assert.equal(summary.receiptCount, 2);
assert.equal(summary.quotaCount, 4);
assert.ok(state.auditEvents.length >= 5);

const testDir = join('.data', 'test', `backend-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`);
const sqlitePath = join(testDir, 'panderuu.db');
mkdirSync(testDir, { recursive: true });

try {
  const sqliteSeed = loadSqliteState(sqlitePath);
  assert.equal(cashBalanceCents(sqliteSeed), 180000);
  assert.equal(sqliteSeed.people.length, 2);

  const persistedPerson = withSqliteStateTransaction(sqlitePath, (txState) => {
    const actor = txState.actors.find((item) => item.id === 'admin-caja');
    return createPerson(txState, actor, {
      type: 'natural',
      name: 'Persona SQLite',
      document: 'DNI 71000001',
      phone: '999 123 456',
      email: 'sqlite@example.local',
      address: 'Direccion SQLite',
      roles: ['Prestamista']
    });
  });

  const stateAfterPerson = loadSqliteState(sqlitePath);
  assert.ok(stateAfterPerson.people.some((item) => item.id === persistedPerson.id));

  const persistedAdmin = withSqliteStateTransaction(sqlitePath, (txState) => {
    const actor = txState.actors.find((item) => item.id === 'admin-seed');
    return createAdmin(txState, actor, {
      type: 'natural',
      name: 'Admin SQLite',
      document: 'DNI 71000002',
      phone: '999 123 457',
      email: 'admin.sqlite@example.local',
      address: 'Direccion Admin SQLite',
      adminLevel: 1
    });
  });

  const stateAfterAdmin = loadSqliteState(sqlitePath);
  assert.ok(stateAfterAdmin.actors.some((item) => item.id === persistedAdmin.admin.id && item.personId === persistedAdmin.person.id));
  assert.ok(stateAfterAdmin.people.some((item) => item.id === persistedAdmin.person.id && item.roles.includes('Administrador')));

  const balanceBeforeRollback = cashBalanceCents(stateAfterAdmin);
  assert.throws(
    () =>
      withSqliteStateTransaction(
        sqlitePath,
        (txState) => {
          const actor = txState.actors.find((item) => item.id === 'admin-caja');
          addCashIncome(txState, actor, { amountCents: 5000, reason: 'Debe revertirse' });
        },
        { failAfterWrite: true }
      ),
    /Simulated transaction failure/
  );

  const stateAfterRollback = loadSqliteState(sqlitePath);
  assert.equal(cashBalanceCents(stateAfterRollback), balanceBeforeRollback);
  assert.ok(!stateAfterRollback.cashMovements.some((item) => item.description === 'Debe revertirse'));

  const persistedLoan = withSqliteStateTransaction(sqlitePath, (txState) => {
    const actor = txState.actors.find((item) => item.id === 'admin-caja');
    return createLoan(txState, actor, {
      personId: persistedPerson.id,
      capitalCents: 15000,
      ratePercent: 5,
      months: 1,
      installments: 1
    });
  });
  assert.equal(persistedLoan.totalCents, 15750);
  assert.equal(persistedLoan.quotas.length, 1);

  const stateAfterLoan = loadSqliteState(sqlitePath);
  assert.ok(stateAfterLoan.loans.some((item) => item.id === persistedLoan.id));
  assert.ok(stateAfterLoan.quotas.some((item) => item.loanId === persistedLoan.id));
  assert.equal(cashBalanceCents(stateAfterLoan), balanceBeforeRollback - 15000);
} finally {
  rmSync(testDir, { recursive: true, force: true });
}

console.log('[ok] backend domain tests passed');
