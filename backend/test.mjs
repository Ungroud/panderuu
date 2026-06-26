import assert from 'node:assert/strict';
import {
  BASE_RATE_PERCENT,
  INITIAL_LOAN_LIMIT_CENTS,
  addCashIncome,
  cashBalanceCents,
  closeCash,
  createLoan,
  createPerson,
  dashboard,
  registerPayment
} from './domain.mjs';
import { seedState } from './storage.mjs';

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
assert.equal(cashBalanceCents(state), 165000);

const { payment, receipt } = registerPayment(state, admin2, {
  loanId: loan.id,
  amountCents: 15750,
  installmentsClosed: 1
});
assert.equal(payment.amountCents, 15750);
assert.equal(receipt.balanceCents, 0);
assert.equal(cashBalanceCents(state), 180750);

const income = addCashIncome(state, admin2, { amountCents: 10000, reason: 'Ingreso demo test' });
assert.equal(income.direction, 'entrada');

assert.throws(() => closeCash(state, admin2, { countedCents: 1, range: 'Dia actual' }), /observacion obligatoria/);
const close = closeCash(state, admin2, { countedCents: cashBalanceCents(state), range: 'Dia actual' });
assert.equal(close.differenceCents, 0);

const summary = dashboard(state);
assert.equal(summary.receiptCount, 1);
assert.ok(state.auditEvents.length >= 5);

console.log('[ok] backend domain tests passed');
