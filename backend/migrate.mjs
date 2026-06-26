import {
  defaultSqlitePath,
  ensureSeeded,
  loadSqliteState,
  migrateDatabase,
  migrationSummary,
  openDatabase
} from './sqlite-storage.mjs';

const args = process.argv.slice(2);
const dbPath = valueAfter('--db') || process.env.PANDERUU_DB_SQLITE || defaultSqlitePath;
const dryRun = args.includes('--dry-run');

const db = openDatabase(dbPath);
try {
  migrateDatabase(db);
  const seeded = dryRun ? false : ensureSeeded(db);
  const summary = migrationSummary(db);
  const state = loadSqliteState(dbPath);

  console.log(
    JSON.stringify(
      {
        ok: true,
        dbPath,
        dryRun,
        seeded,
        migrations: summary,
        counts: {
          actors: state.actors.length,
          admins: state.actors.filter((actor) => Number(actor.adminLevel) > 0).length,
          people: state.people.length,
          loans: state.loans.length,
          quotas: state.quotas.length,
          payments: state.payments.length,
          paymentApplications: state.paymentApplications.length,
          cashMovements: state.cashMovements.length,
          auditEvents: state.auditEvents.length
        },
        moraGeneratedCents: state.quotas.reduce((sum, quota) => sum + Number(quota.moraCents || 0), 0)
      },
      null,
      2
    )
  );
} finally {
  db.close();
}

function valueAfter(name) {
  const index = args.indexOf(name);
  if (index < 0) return '';
  return args[index + 1] || '';
}
