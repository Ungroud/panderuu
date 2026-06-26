import { createServer } from 'node:http';
import { URL } from 'node:url';
import {
  PERMISSION_ERROR,
  addCashIncome,
  closeCash,
  createAudit,
  createLoan,
  createPerson,
  dashboard,
  registerPayment
} from './domain.mjs';
import { defaultPath, loadState, saveState } from './storage.mjs';

const port = Number(process.env.PANDERUU_BACKEND_PORT || 5180);
const dbPath = process.env.PANDERUU_DB_JSON || defaultPath;

let state = await loadState(dbPath);

function actorFromRequest(request) {
  const actorId = request.headers['x-actor-id'] || 'admin-seed';
  const actor = state.actors.find((item) => item.id === actorId);
  return actor || { id: 'anonymous', name: 'anonymous', adminLevel: 0 };
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

function route(method, path, handler) {
  return { method, path, handler };
}

const routes = [
  route('GET', '/health', async () => ({ ok: true, service: 'panderuu-backend', storage: dbPath })),
  route('GET', '/dashboard', async () => dashboard(state)),
  route('GET', '/state', async () => state),
  route('POST', '/people', async (request, actor) => createPerson(state, actor, await readJson(request))),
  route('POST', '/loans', async (request, actor) => createLoan(state, actor, await readJson(request))),
  route('POST', '/payments', async (request, actor) => registerPayment(state, actor, await readJson(request))),
  route('POST', '/cash/income', async (request, actor) => addCashIncome(state, actor, await readJson(request))),
  route('POST', '/cash/close', async (request, actor) => closeCash(state, actor, await readJson(request)))
];

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'content-type,x-actor-id'
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

  const actor = actorFromRequest(request);
  try {
    const result = await found.handler(request, actor);
    await saveState(state, dbPath);
    send(response, 200, { ok: true, data: result });
  } catch (error) {
    createAudit(state, actor, error.action || `${request.method} ${url.pathname}`, 'request', url.pathname, 'failed', { message: error.message });
    await saveState(state, dbPath);
    const status = error.message === PERMISSION_ERROR ? 403 : error.code === 'VALIDATION_ERROR' ? 400 : 500;
    send(response, status, { ok: false, error: error.message, code: error.code || 'INTERNAL_ERROR' });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Panderuu backend: http://localhost:${port}`);
  console.log(`Storage: ${dbPath}`);
});

