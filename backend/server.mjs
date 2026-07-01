import { createServer } from 'node:http';
import { URL } from 'node:url';
import {
  PERMISSION_ERROR,
  addCashIncome,
  administrators,
  authenticateSession,
  changePassword,
  closeCash,
  createAudit,
  createAdmin,
  createLoan,
  createPerson,
  dashboard,
  login,
  logoutSession,
  people,
  peopleByRole,
  personProfile,
  publicActor,
  refreshQuotaStatuses,
  registerPayment,
  safeDebugState
} from './domain.mjs';
import { defaultSqlitePath, loadSqliteState, withSqliteStateTransaction } from './sqlite-storage.mjs';

const port = Number(process.env.PANDERUU_BACKEND_PORT || 5180);
const dbPath = process.env.PANDERUU_DB_SQLITE || defaultSqlitePath;
const devActorHeaderEnabled = process.env.PANDERUU_DEV_AUTH === '1';

function authenticateRequest(state, request) {
  const authorization = request.headers.authorization || '';
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (token) return authenticateSession(state, token);

  if (devActorHeaderEnabled) {
    const actorId = request.headers['x-actor-id'] || 'admin-seed';
    const actor = state.actors.find((item) => item.id === actorId);
    if (actor) return { actor, session: null, mode: 'dev-header' };
  }

  const error = new Error('Autenticacion requerida');
  error.code = 'AUTH_REQUIRED';
  throw error;
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function send(response, status, payload) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' });
  response.end(JSON.stringify(payload, null, 2));
}

function route(method, path, handler, options = {}) {
  return { method, path, handler, auth: options.auth !== false };
}

const routes = [
  route('GET', '/health', ({ state }) => ({ ok: true, service: 'panderuu-backend', storage: dbPath, engine: 'sqlite', version: state.version }), {
    auth: false
  }),
  route('POST', '/auth/login', ({ state, payload }) => login(state, payload), { auth: false }),
  route('POST', '/auth/logout', ({ state, actor, session }) => logoutSession(state, actor, session)),
  route('POST', '/auth/change-password', ({ state, actor, session, payload }) => changePassword(state, actor, session, payload)),
  route('GET', '/auth/me', ({ actor }) => ({ actor: publicActor(actor) })),
  route('GET', '/dashboard', ({ state }) => dashboard(state)),
  route('GET', '/admins', ({ state }) => administrators(state)),
  route('GET', '/people', ({ state }) => people(state)),
  route('GET', '/people/profile', ({ state, url }) => personProfile(state, url.searchParams.get('id'))),
  route('GET', '/borrowers', ({ state }) => peopleByRole(state, 'Prestamista')),
  route('GET', '/associates', ({ state }) => peopleByRole(state, 'Asociado')),
  route('GET', '/state', ({ state }) => {
    refreshQuotaStatuses(state);
    return safeDebugState(state);
  }),
  route('GET', '/quotas', ({ state }) => refreshQuotaStatuses(state)),
  route('POST', '/admins', ({ state, actor, payload }) => createAdmin(state, actor, payload)),
  route('POST', '/people', ({ state, actor, payload }) => createPerson(state, actor, payload)),
  route('POST', '/loans', ({ state, actor, payload }) => createLoan(state, actor, payload)),
  route('POST', '/payments', ({ state, actor, payload }) => registerPayment(state, actor, payload)),
  route('POST', '/cash/income', ({ state, actor, payload }) => addCashIncome(state, actor, payload)),
  route('POST', '/cash/close', ({ state, actor, payload }) => closeCash(state, actor, payload))
];

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'content-type,authorization,x-actor-id'
    });
    response.end();
    return;
  }

  const url = new URL(request.url || '/', `http://${request.headers.host}`);
  const found = routes.find((item) => item.method === request.method && item.path === url.pathname);
  if (!found) {
    send(response, 404, { error: 'Ruta no encontrada' });
    return;
  }

  try {
    const result =
      request.method === 'GET'
        ? await handleReadRoute(found, request, url)
        : await handleWriteRoute(found, request);
    send(response, 200, { ok: true, data: result });
  } catch (error) {
    recordFailedRequest(request, url.pathname, error);
    const status =
      error.message === PERMISSION_ERROR
        ? 403
        : error.code === 'VALIDATION_ERROR'
          ? 400
          : ['AUTH_REQUIRED', 'AUTH_FAILED', 'AUTH_EXPIRED'].includes(error.code)
            ? 401
            : error.code === 'AUTH_BLOCKED'
              ? 403
              : 500;
    send(response, status, { ok: false, error: error.message, code: error.code || 'INTERNAL_ERROR' });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Panderuu backend: http://localhost:${port}`);
  console.log(`SQLite: ${dbPath}`);
});

async function handleReadRoute(found, request, url) {
  const state = loadSqliteState(dbPath);
  const auth = found.auth ? authenticateRequest(state, request) : { actor: null, session: null };
  return found.handler({ request, actor: auth.actor, session: auth.session, state, payload: null, url });
}

async function handleWriteRoute(found, request) {
  const payload = await readJson(request);
  return withSqliteStateTransaction(dbPath, (state) => {
    const auth = found.auth ? authenticateRequest(state, request) : { actor: null, session: null };
    return found.handler({ request, actor: auth.actor, session: auth.session, state, payload });
  });
}

function recordFailedRequest(request, pathname, error) {
  if (error.audited) return;
  try {
    withSqliteStateTransaction(dbPath, (state) => {
      const actor = actorOrAnonymous(state, request);
      createAudit(state, actor, error.action || `${request.method} ${pathname}`, 'request', pathname, 'failed', {
        message: error.message
      });
    });
  } catch (auditError) {
    console.error('No se pudo registrar auditoria fallida:', auditError.message);
  }
}

function actorOrAnonymous(state, request) {
  try {
    return authenticateRequest(state, request).actor;
  } catch {
    return { id: 'anonymous', name: 'anonymous', adminLevel: 0 };
  }
}
