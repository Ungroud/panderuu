import assert from 'node:assert/strict';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import {
  BASE_RATE_PERCENT,
  INITIAL_LOAN_LIMIT_CENTS,
  addCashIncome,
  cashBalanceCents,
  closeCash,
  createLoan,
  createPerson,
  dashboard,
  quotaBalanceCents,
  registerPayment
} from './domain.mjs';
import { seedState } from './storage.mjs';
import { loadSqliteState, withSqliteStateTransaction } from './sqlite-storage.mjs';

const state = seedState();
const admin1 = state.actors.find((actor) => actor.adminLevel === 1);
const admin2 = state.actors.find((actor) => actor.adminLevel === 2);

assert.equal(BASE_RATE_PERCENT, 5);
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
  loanDate: '2026-01-15'
});
const multiQuotas = state.quotas.filter((quota) => quota.loanId === multiLoan.id).sort((left, right) => left.number - right.number);
assert.equal(multiQuotas.length, 3);
assert.deepEqual(
  multiQuotas.map((quota) => quota.dueDate),
  ['2026-02-15', '2026-03-15', '2026-04-15']
);
assert.equal(multiQuotas.reduce((sum, quota) => sum + quota.totalCents, 0), multiLoan.totalCents);
assert.equal(multiQuotas[0].totalCents, 5250);
assert.equal(cashBalanceCents(state), 165750);

const multiPayment = registerPayment(state, admin2, {
  loanId: multiLoan.id,
  amountCents: 10500
});
assert.equal(multiPayment.payment.installmentsClosed, 2);
assert.equal(multiPayment.applications.length, 2);
assert.equal(multiPayment.loan.status, 'activo');
assert.equal(quotaBalanceCents(multiQuotas[0]), 0);
assert.equal(quotaBalanceCents(multiQuotas[1]), 0);
assert.equal(quotaBalanceCents(multiQuotas[2]), 5250);
assert.equal(cashBalanceCents(state), 176250);

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

  const balanceBeforeRollback = cashBalanceCents(stateAfterPerson);
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
