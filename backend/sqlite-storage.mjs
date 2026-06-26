import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { nowIso } from './domain.mjs';
import { seedState } from './storage.mjs';

export const defaultSqlitePath = '.data/backend/panderuu.db';

export const migrations = [
  {
    version: 1,
    name: '001_backend_core',
    sql: `
      CREATE TABLE IF NOT EXISTS actors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        admin_level INTEGER NOT NULL,
        seed_admin INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS people (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        document TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL,
        email TEXT NOT NULL DEFAULT '',
        address TEXT NOT NULL,
        roles_json TEXT NOT NULL,
        credit_status TEXT NOT NULL,
        loans_count INTEGER NOT NULL DEFAULT 0,
        punctual_loans INTEGER NOT NULL DEFAULT 0,
        registered_by TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS loans (
        id TEXT PRIMARY KEY,
        person_id TEXT NOT NULL,
        person_name TEXT NOT NULL,
        capital_cents INTEGER NOT NULL,
        rate_percent INTEGER NOT NULL,
        interest_cents INTEGER NOT NULL,
        total_cents INTEGER NOT NULL,
        paid_cents INTEGER NOT NULL,
        months INTEGER NOT NULL,
        installments INTEGER NOT NULL,
        status TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        loan_id TEXT NOT NULL,
        person_id TEXT NOT NULL,
        person_name TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        installments_closed INTEGER NOT NULL,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cash_movements (
        id TEXT PRIMARY KEY,
        at TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        direction TEXT NOT NULL,
        reference_type TEXT NOT NULL,
        reference_id TEXT,
        actor_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cash_closures (
        id TEXT PRIMARY KEY,
        at TEXT NOT NULL,
        range_label TEXT NOT NULL,
        expected_cents INTEGER NOT NULL,
        counted_cents INTEGER NOT NULL,
        difference_cents INTEGER NOT NULL,
        reason TEXT NOT NULL,
        actor_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS receipts (
        id TEXT PRIMARY KEY,
        number TEXT NOT NULL UNIQUE,
        loan_id TEXT NOT NULL,
        payment_id TEXT NOT NULL,
        person_name TEXT NOT NULL,
        capital_cents INTEGER NOT NULL,
        rate_percent INTEGER NOT NULL,
        interest_cents INTEGER NOT NULL,
        total_cents INTEGER NOT NULL,
        paid_cents INTEGER NOT NULL,
        balance_cents INTEGER NOT NULL,
        status TEXT NOT NULL,
        issued_by TEXT NOT NULL,
        issued_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        at TEXT NOT NULL,
        actor_id TEXT NOT NULL,
        actor_name TEXT NOT NULL,
        admin_level INTEGER NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        result TEXT NOT NULL,
        details_json TEXT NOT NULL
      );
    `
  },
  {
    version: 2,
    name: '002_loan_installments',
    sql: `
      CREATE TABLE IF NOT EXISTS loan_installments (
        id TEXT PRIMARY KEY,
        loan_id TEXT NOT NULL,
        number INTEGER NOT NULL,
        due_date TEXT NOT NULL,
        capital_cents INTEGER NOT NULL,
        interest_cents INTEGER NOT NULL,
        mora_cents INTEGER NOT NULL DEFAULT 0,
        total_cents INTEGER NOT NULL,
        paid_cents INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS payment_applications (
        id TEXT PRIMARY KEY,
        payment_id TEXT NOT NULL,
        loan_id TEXT NOT NULL,
        quota_id TEXT,
        quota_number INTEGER NOT NULL,
        amount_cents INTEGER NOT NULL,
        closed_quota INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
    `
  },
  {
    version: 3,
    name: '003_receipt_mora',
    sql: `
      ALTER TABLE receipts ADD COLUMN mora_cents INTEGER NOT NULL DEFAULT 0;
    `
  },
  {
    version: 4,
    name: '004_admin_metadata',
    sql: `
      ALTER TABLE actors ADD COLUMN person_id TEXT;
      ALTER TABLE actors ADD COLUMN created_by TEXT NOT NULL DEFAULT 'system';
      ALTER TABLE actors ADD COLUMN created_at TEXT NOT NULL DEFAULT '';
      ALTER TABLE actors ADD COLUMN status TEXT NOT NULL DEFAULT 'activo';
    `
  },
  {
    version: 5,
    name: '005_normalize_people_contacts',
    sql: `
      UPDATE people
      SET phone = replace(replace(replace(phone, ' ', ''), '-', ''), '.', '');

      UPDATE people
      SET email = lower(trim(email))
      WHERE email IS NOT NULL;
    `
  }
];

export function openDatabase(path = defaultSqlitePath) {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }

  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA journal_mode = WAL');
  return db;
}

export function migrateDatabase(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = new Set(db.prepare('SELECT version FROM schema_migrations').all().map((row) => Number(row.version)));
  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;
    db.exec('BEGIN IMMEDIATE');
    try {
      db.exec(migration.sql);
      db.prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)').run(
        migration.version,
        migration.name,
        nowIso()
      );
      db.exec('COMMIT');
    } catch (error) {
      rollbackQuietly(db);
      throw error;
    }
  }
}

export function ensureSeeded(db) {
  const count = db.prepare('SELECT COUNT(*) AS total FROM actors').get().total;
  if (Number(count) > 0) return false;

  db.exec('BEGIN IMMEDIATE');
  try {
    writeStateToDb(db, seedState());
    db.exec('COMMIT');
    return true;
  } catch (error) {
    rollbackQuietly(db);
    throw error;
  }
}

export function loadSqliteState(path = defaultSqlitePath) {
  const db = openDatabase(path);
  try {
    migrateDatabase(db);
    ensureSeeded(db);
    return readStateFromDb(db);
  } finally {
    db.close();
  }
}

export function saveSqliteState(state, path = defaultSqlitePath) {
  const db = openDatabase(path);
  try {
    migrateDatabase(db);
    db.exec('BEGIN IMMEDIATE');
    try {
      writeStateToDb(db, state);
      db.exec('COMMIT');
    } catch (error) {
      rollbackQuietly(db);
      throw error;
    }
  } finally {
    db.close();
  }
}

export function withSqliteStateTransaction(path = defaultSqlitePath, mutator, options = {}) {
  const db = openDatabase(path);
  try {
    migrateDatabase(db);
    ensureSeeded(db);
    db.exec('BEGIN IMMEDIATE');
    try {
      const state = readStateFromDb(db);
      const result = mutator(state);
      writeStateToDb(db, state);
      if (options.failAfterWrite) {
        throw new Error('Simulated transaction failure');
      }
      db.exec('COMMIT');
      return result;
    } catch (error) {
      rollbackQuietly(db);
      throw error;
    }
  } finally {
    db.close();
  }
}

export function migrationSummary(db) {
  return db.prepare('SELECT version, name, applied_at AS appliedAt FROM schema_migrations ORDER BY version').all();
}

export function readStateFromDb(db) {
  return {
    version: 5,
    actors: db
      .prepare(
        `SELECT id, name, admin_level AS adminLevel, seed_admin AS seedAdmin,
          person_id AS personId, created_by AS createdBy, created_at AS createdAt, status
        FROM actors ORDER BY rowid`
      )
      .all()
      .map((actor) => ({
        ...actor,
        adminLevel: Number(actor.adminLevel),
        seedAdmin: Boolean(actor.seedAdmin),
        personId: actor.personId || null,
        createdBy: actor.createdBy || 'system',
        createdAt: actor.createdAt || '',
        status: actor.status || 'activo'
      })),
    people: db
      .prepare(
        `SELECT id, type, name, document, phone, email, address, roles_json AS rolesJson,
          credit_status AS creditStatus, loans_count AS loansCount, punctual_loans AS punctualLoans,
          registered_by AS registeredBy, created_at AS createdAt
        FROM people ORDER BY created_at DESC, rowid DESC`
      )
      .all()
      .map((person) => ({
        id: person.id,
        type: person.type,
        name: person.name,
        document: person.document,
        phone: person.phone,
        email: person.email,
        address: person.address,
        roles: parseJson(person.rolesJson, []),
        creditStatus: person.creditStatus,
        loansCount: Number(person.loansCount),
        punctualLoans: Number(person.punctualLoans),
        registeredBy: person.registeredBy,
        createdAt: person.createdAt
      })),
    loans: db
      .prepare(
        `SELECT id, person_id AS personId, person_name AS personName, capital_cents AS capitalCents,
          rate_percent AS ratePercent, interest_cents AS interestCents, total_cents AS totalCents,
          paid_cents AS paidCents, months, installments, status, created_by AS createdBy, created_at AS createdAt
        FROM loans ORDER BY created_at DESC, rowid DESC`
      )
      .all()
      .map(toLoan),
    quotas: db
      .prepare(
        `SELECT id, loan_id AS loanId, number, due_date AS dueDate, capital_cents AS capitalCents,
          interest_cents AS interestCents, mora_cents AS moraCents, total_cents AS totalCents,
          paid_cents AS paidCents, status, created_at AS createdAt
        FROM loan_installments ORDER BY due_date ASC, number ASC`
      )
      .all()
      .map(toQuota),
    payments: db
      .prepare(
        `SELECT id, loan_id AS loanId, person_id AS personId, person_name AS personName,
          amount_cents AS amountCents, installments_closed AS installmentsClosed,
          created_by AS createdBy, created_at AS createdAt
        FROM payments ORDER BY created_at DESC, rowid DESC`
      )
      .all()
      .map(toPayment),
    paymentApplications: db
      .prepare(
        `SELECT id, payment_id AS paymentId, loan_id AS loanId, quota_id AS quotaId,
          quota_number AS quotaNumber, amount_cents AS amountCents,
          closed_quota AS closedQuota, created_at AS createdAt
        FROM payment_applications ORDER BY created_at DESC, rowid DESC`
      )
      .all()
      .map(toPaymentApplication),
    cashMovements: db
      .prepare(
        `SELECT id, at, type, description, amount_cents AS amountCents, direction,
          reference_type AS referenceType, reference_id AS referenceId, actor_id AS actorId
        FROM cash_movements ORDER BY at DESC, rowid DESC`
      )
      .all()
      .map(toCashMovement),
    cashClosures: db
      .prepare(
        `SELECT id, at, range_label AS range, expected_cents AS expectedCents,
          counted_cents AS countedCents, difference_cents AS differenceCents, reason, actor_id AS actorId
        FROM cash_closures ORDER BY at DESC, rowid DESC`
      )
      .all()
      .map(toCashClosure),
    receipts: db
      .prepare(
        `SELECT id, number, loan_id AS loanId, payment_id AS paymentId, person_name AS personName,
          capital_cents AS capitalCents, rate_percent AS ratePercent, interest_cents AS interestCents,
          mora_cents AS moraCents, total_cents AS totalCents, paid_cents AS paidCents, balance_cents AS balanceCents,
          status, issued_by AS issuedBy, issued_at AS issuedAt
        FROM receipts ORDER BY issued_at DESC, rowid DESC`
      )
      .all()
      .map(toReceipt),
    auditEvents: db
      .prepare(
        `SELECT id, at, actor_id AS actorId, actor_name AS actorName, admin_level AS adminLevel,
          action, entity_type AS entityType, entity_id AS entityId, result, details_json AS detailsJson
        FROM audit_events ORDER BY at DESC, rowid DESC`
      )
      .all()
      .map((event) => ({
        id: event.id,
        at: event.at,
        actorId: event.actorId,
        actorName: event.actorName,
        adminLevel: Number(event.adminLevel),
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        result: event.result,
        details: parseJson(event.detailsJson, {})
      }))
  };
}

export function writeStateToDb(db, state) {
  db.exec(`
    DELETE FROM audit_events;
    DELETE FROM receipts;
    DELETE FROM cash_closures;
    DELETE FROM cash_movements;
    DELETE FROM payment_applications;
    DELETE FROM payments;
    DELETE FROM loan_installments;
    DELETE FROM loans;
    DELETE FROM people;
    DELETE FROM actors;
  `);

  const insertActor = db.prepare('INSERT INTO actors (id, name, admin_level, seed_admin, person_id, created_by, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (const actor of state.actors) {
    insertActor.run(
      actor.id,
      actor.name,
      Number(actor.adminLevel),
      actor.seedAdmin ? 1 : 0,
      actor.personId || null,
      actor.createdBy || 'system',
      actor.createdAt || '',
      actor.status || 'activo'
    );
  }

  const insertPerson = db.prepare(`
    INSERT INTO people (
      id, type, name, document, phone, email, address, roles_json, credit_status,
      loans_count, punctual_loans, registered_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const person of state.people) {
    insertPerson.run(
      person.id,
      person.type,
      person.name,
      person.document,
      person.phone,
      person.email || '',
      person.address,
      JSON.stringify(person.roles || []),
      person.creditStatus,
      Number(person.loansCount || 0),
      Number(person.punctualLoans || 0),
      person.registeredBy,
      person.createdAt
    );
  }

  const insertLoan = db.prepare(`
    INSERT INTO loans (
      id, person_id, person_name, capital_cents, rate_percent, interest_cents, total_cents,
      paid_cents, months, installments, status, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const loan of state.loans) {
    insertLoan.run(
      loan.id,
      loan.personId,
      loan.personName,
      Number(loan.capitalCents),
      Number(loan.ratePercent),
      Number(loan.interestCents),
      Number(loan.totalCents),
      Number(loan.paidCents),
      Number(loan.months),
      Number(loan.installments),
      loan.status,
      loan.createdBy,
      loan.createdAt
    );
  }

  const insertQuota = db.prepare(`
    INSERT INTO loan_installments (
      id, loan_id, number, due_date, capital_cents, interest_cents, mora_cents,
      total_cents, paid_cents, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const quota of state.quotas || []) {
    insertQuota.run(
      quota.id,
      quota.loanId,
      Number(quota.number),
      quota.dueDate,
      Number(quota.capitalCents),
      Number(quota.interestCents),
      Number(quota.moraCents || 0),
      Number(quota.totalCents),
      Number(quota.paidCents),
      quota.status,
      quota.createdAt
    );
  }

  const insertPayment = db.prepare(`
    INSERT INTO payments (
      id, loan_id, person_id, person_name, amount_cents, installments_closed, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const payment of state.payments) {
    insertPayment.run(
      payment.id,
      payment.loanId,
      payment.personId,
      payment.personName,
      Number(payment.amountCents),
      Number(payment.installmentsClosed),
      payment.createdBy,
      payment.createdAt
    );
  }

  const insertPaymentApplication = db.prepare(`
    INSERT INTO payment_applications (
      id, payment_id, loan_id, quota_id, quota_number, amount_cents, closed_quota, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const application of state.paymentApplications || []) {
    insertPaymentApplication.run(
      application.id,
      application.paymentId,
      application.loanId,
      application.quotaId || null,
      Number(application.quotaNumber),
      Number(application.amountCents),
      application.closedQuota ? 1 : 0,
      application.createdAt
    );
  }

  const insertCashMovement = db.prepare(`
    INSERT INTO cash_movements (
      id, at, type, description, amount_cents, direction, reference_type, reference_id, actor_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const movement of state.cashMovements) {
    insertCashMovement.run(
      movement.id,
      movement.at,
      movement.type,
      movement.description,
      Number(movement.amountCents),
      movement.direction,
      movement.referenceType,
      movement.referenceId || null,
      movement.actorId
    );
  }

  const insertCashClosure = db.prepare(`
    INSERT INTO cash_closures (
      id, at, range_label, expected_cents, counted_cents, difference_cents, reason, actor_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const close of state.cashClosures) {
    insertCashClosure.run(
      close.id,
      close.at,
      close.range,
      Number(close.expectedCents),
      Number(close.countedCents),
      Number(close.differenceCents),
      close.reason,
      close.actorId
    );
  }

  const insertReceipt = db.prepare(`
    INSERT INTO receipts (
      id, number, loan_id, payment_id, person_name, capital_cents, rate_percent, interest_cents,
      mora_cents, total_cents, paid_cents, balance_cents, status, issued_by, issued_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const receipt of state.receipts) {
    insertReceipt.run(
      receipt.id,
      receipt.number,
      receipt.loanId,
      receipt.paymentId,
      receipt.personName,
      Number(receipt.capitalCents),
      Number(receipt.ratePercent),
      Number(receipt.interestCents),
      Number(receipt.moraCents || 0),
      Number(receipt.totalCents),
      Number(receipt.paidCents),
      Number(receipt.balanceCents),
      receipt.status,
      receipt.issuedBy,
      receipt.issuedAt
    );
  }

  const insertAudit = db.prepare(`
    INSERT INTO audit_events (
      id, at, actor_id, actor_name, admin_level, action, entity_type, entity_id, result, details_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const event of state.auditEvents) {
    insertAudit.run(
      event.id,
      event.at,
      event.actorId,
      event.actorName,
      Number(event.adminLevel),
      event.action,
      event.entityType,
      event.entityId,
      event.result,
      JSON.stringify(event.details || {})
    );
  }
}

function rollbackQuietly(db) {
  try {
    db.exec('ROLLBACK');
  } catch {
    // Ignore rollback errors when SQLite already closed or no transaction is active.
  }
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toLoan(loan) {
  return {
    id: loan.id,
    personId: loan.personId,
    personName: loan.personName,
    capitalCents: Number(loan.capitalCents),
    ratePercent: Number(loan.ratePercent),
    interestCents: Number(loan.interestCents),
    totalCents: Number(loan.totalCents),
    paidCents: Number(loan.paidCents),
    months: Number(loan.months),
    installments: Number(loan.installments),
    status: loan.status,
    createdBy: loan.createdBy,
    createdAt: loan.createdAt
  };
}

function toPayment(payment) {
  return {
    id: payment.id,
    loanId: payment.loanId,
    personId: payment.personId,
    personName: payment.personName,
    amountCents: Number(payment.amountCents),
    installmentsClosed: Number(payment.installmentsClosed),
    createdBy: payment.createdBy,
    createdAt: payment.createdAt
  };
}

function toQuota(quota) {
  return {
    id: quota.id,
    loanId: quota.loanId,
    number: Number(quota.number),
    dueDate: quota.dueDate,
    capitalCents: Number(quota.capitalCents),
    interestCents: Number(quota.interestCents),
    moraCents: Number(quota.moraCents),
    totalCents: Number(quota.totalCents),
    paidCents: Number(quota.paidCents),
    status: quota.status,
    createdAt: quota.createdAt
  };
}

function toPaymentApplication(application) {
  return {
    id: application.id,
    paymentId: application.paymentId,
    loanId: application.loanId,
    quotaId: application.quotaId,
    quotaNumber: Number(application.quotaNumber),
    amountCents: Number(application.amountCents),
    closedQuota: Boolean(application.closedQuota),
    createdAt: application.createdAt
  };
}

function toCashMovement(movement) {
  return {
    id: movement.id,
    at: movement.at,
    type: movement.type,
    description: movement.description,
    amountCents: Number(movement.amountCents),
    direction: movement.direction,
    referenceType: movement.referenceType,
    referenceId: movement.referenceId,
    actorId: movement.actorId
  };
}

function toCashClosure(close) {
  return {
    id: close.id,
    at: close.at,
    range: close.range,
    expectedCents: Number(close.expectedCents),
    countedCents: Number(close.countedCents),
    differenceCents: Number(close.differenceCents),
    reason: close.reason,
    actorId: close.actorId
  };
}

function toReceipt(receipt) {
  return {
    id: receipt.id,
    number: receipt.number,
    loanId: receipt.loanId,
    paymentId: receipt.paymentId,
    personName: receipt.personName,
    capitalCents: Number(receipt.capitalCents),
    ratePercent: Number(receipt.ratePercent),
    interestCents: Number(receipt.interestCents),
    moraCents: Number(receipt.moraCents),
    totalCents: Number(receipt.totalCents),
    paidCents: Number(receipt.paidCents),
    balanceCents: Number(receipt.balanceCents),
    status: receipt.status,
    issuedBy: receipt.issuedBy,
    issuedAt: receipt.issuedAt
  };
}
