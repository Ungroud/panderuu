const API_BASE = 'http://localhost:5180';
const DEV_USERNAME = 'admin.seed';
const DEV_PASSWORD = 'Panderuu123!';
const today = new Date().toISOString().slice(0, 10);

const admins = [
  { name: 'Admin Semilla', level: 3 },
  { name: 'Caja Nivel 2', level: 2 },
  { name: 'Informes Nivel 1', level: 1 }
];

let people = [
  {
    id: 'p-001',
    type: 'natural',
    name: 'Cliente Demo Nuevo',
    document: 'DNI 70000001',
    phone: '999 111 222',
    email: 'cliente.nuevo@example.local',
    address: 'Direccion demo 101',
    roles: ['Prestamista'],
    credit: 'nuevo',
    loansCount: 1,
    punctualLoans: 0,
    registeredBy: 'Admin Semilla'
  },
  {
    id: 'p-002',
    type: 'empresa',
    name: 'Empresa Demo Asociada',
    document: 'RUC 20000000001',
    phone: '999 333 444',
    email: 'empresa@example.local',
    address: 'Av. Demo 245',
    roles: ['Asociado', 'Prestamista'],
    credit: 'buen historial',
    loansCount: 4,
    punctualLoans: 4,
    registeredBy: 'Caja Nivel 2'
  },
  {
    id: 'p-003',
    type: 'natural',
    name: 'Administrador Prestamista Demo',
    document: 'DNI 70000003',
    phone: '999 555 666',
    email: 'admin.prestamista@example.local',
    address: 'Calle Control 77',
    roles: ['Administrador', 'Prestamista'],
    credit: 'regular',
    loansCount: 2,
    punctualLoans: 2,
    registeredBy: 'Admin Semilla'
  },
  {
    id: 'p-004',
    type: 'natural',
    name: 'Cliente En Evaluacion',
    document: 'DNI 70000004',
    phone: '999 777 888',
    email: 'evaluacion@example.local',
    address: 'Pasaje Riesgo 12',
    roles: ['Prestamista'],
    credit: 'evaluado',
    loansCount: 2,
    punctualLoans: 1,
    registeredBy: 'Caja Nivel 2'
  }
];

let loans = [
  {
    id: 'L-0001',
    lenderId: 'p-001',
    person: 'Cliente Demo Nuevo',
    capital: 150,
    rate: 5,
    interest: 7.5,
    total: 157.5,
    months: 1,
    installments: 1,
    paid: 0,
    nextDue: today,
    status: 'activo',
    admin: 'Caja Nivel 2'
  },
  {
    id: 'L-0002',
    lenderId: 'p-002',
    person: 'Empresa Demo Asociada',
    capital: 600,
    rate: 5,
    interest: 30,
    total: 630,
    months: 3,
    installments: 3,
    paid: 210,
    nextDue: '2026-06-28',
    status: 'activo',
    admin: 'Admin Semilla'
  },
  {
    id: 'L-0003',
    lenderId: 'p-004',
    person: 'Cliente En Evaluacion',
    capital: 150,
    rate: 10,
    interest: 15,
    total: 165,
    months: 1,
    installments: 2,
    paid: 40,
    nextDue: '2026-06-20',
    status: 'vencido',
    admin: 'Caja Nivel 2'
  }
];

let payments = [
  { id: 'pay-1', person: 'Cliente En Evaluacion', loanId: 'L-0003', amount: 82.5, due: '2026-06-20', status: 'vencida', installments: 1 },
  { id: 'pay-2', person: 'Cliente Demo Nuevo', loanId: 'L-0001', amount: 157.5, due: today, status: 'prioritaria', installments: 1 },
  { id: 'pay-3', person: 'Empresa Demo Asociada', loanId: 'L-0002', amount: 210, due: '2026-06-28', status: 'pendiente', installments: 1 }
];

let cashMovements = [
  { id: 'cash-1', date: today, type: 'ingreso', description: 'Ingreso inicial justificado de caja', amount: 1800, direction: 'entrada' },
  { id: 'cash-2', date: today, type: 'prestamo', description: 'Desembolso L-0001', amount: 150, direction: 'salida' },
  { id: 'cash-3', date: '2026-06-25', type: 'pago', description: 'Pago parcial L-0002', amount: 210, direction: 'entrada' },
  { id: 'cash-4', date: '2026-06-24', type: 'prestamo', description: 'Desembolso L-0002', amount: 600, direction: 'salida' }
];

const interestByMonth = [
  { month: 'Mar', value: 38 },
  { month: 'Abr', value: 55 },
  { month: 'May', value: 64 },
  { month: 'Jun', value: 52 }
];

const state = {
  adminLevel: 3,
  activeView: 'dashboard',
  selectedPersonId: 'p-001',
  panel: null,
  backendOnline: false,
  backendMessage: 'Modo demo local',
  authToken: '',
  currentActor: null,
  mustChangePassword: false,
  authChecked: false,
  demoMode: false,
  loginError: '',
  targetLoanId: '',
  targetPaymentId: '',
  receipt: {
    number: 'BOL-2026-0001',
    person: 'Cliente Demo Nuevo',
    document: 'DNI 70000001',
    loanAmount: 150,
    rate: 5,
    interest: 7.5,
    period: 1,
    date: today,
    total: 157.5,
    paid: 0,
    balance: 157.5,
    status: 'Pendiente',
    admin: 'Caja Nivel 2'
  }
};

let receipts = [state.receipt];
let cashClosures = [];
let registeredPayments = [];

function saveApp() {
  try {
    localStorage.setItem(
      'panderuu-demo-state',
      JSON.stringify({
        people,
        loans,
        payments,
        cashMovements,
        receipts,
        cashClosures,
        registeredPayments,
        state: {
          adminLevel: state.adminLevel,
          activeView: state.activeView,
          selectedPersonId: state.selectedPersonId,
          backendOnline: state.backendOnline,
          backendMessage: state.backendMessage,
          authToken: state.authToken,
          currentActor: state.currentActor,
          mustChangePassword: state.mustChangePassword,
          authChecked: state.authChecked,
          demoMode: state.demoMode,
          loginError: state.loginError,
          receipt: state.receipt
        }
      })
    );
  } catch (error) {
    console.warn('No se pudo guardar estado local', error);
  }
}

function loadApp() {
  try {
    const raw = localStorage.getItem('panderuu-demo-state');
    if (!raw) return;
    const stored = JSON.parse(raw);
    people = stored.people || people;
    loans = stored.loans || loans;
    payments = stored.payments || payments;
    cashMovements = stored.cashMovements || cashMovements;
    receipts = stored.receipts || receipts;
    cashClosures = stored.cashClosures || cashClosures;
    registeredPayments = stored.registeredPayments || registeredPayments;
    Object.assign(state, stored.state || {});
  } catch (error) {
    console.warn('No se pudo cargar estado local', error);
  }
}

function resetDemo() {
  localStorage.removeItem('panderuu-demo-state');
  localStorage.removeItem('panderuu-auth-token');
  location.reload();
}

function centsToSoles(cents) {
  return Number(cents || 0) / 100;
}

function solesToCents(value) {
  return Math.round(Number(value || 0) * 100);
}

async function api(path, options = {}) {
  const headers = {
    'content-type': 'application/json',
    ...(options.headers || {})
  };
  if (state.authToken) headers.authorization = `Bearer ${state.authToken}`;
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || `Error HTTP ${response.status}`);
  }
  return payload.data;
}

async function ensureBackendSession() {
  state.authToken = state.authToken || localStorage.getItem('panderuu-auth-token') || '';
  if (!state.authToken) {
    throw new Error('Inicia sesion para usar el backend real');
  }

  try {
    const current = await api('/auth/me');
    state.currentActor = current.actor;
    state.adminLevel = Number(current.actor.adminLevel || state.adminLevel);
    state.mustChangePassword = Boolean(current.actor.mustChangePassword);
    return current.actor;
  } catch {
    state.authToken = '';
    state.currentActor = null;
    state.mustChangePassword = false;
    localStorage.removeItem('panderuu-auth-token');
    throw new Error('Sesion expirada');
  }
}

async function loginWithCredentials(username, password) {
  const login = await api('/auth/login', {
    method: 'POST',
    body: { username, password }
  });
  state.authToken = login.token;
  state.currentActor = login.actor;
  state.adminLevel = Number(login.actor.adminLevel || state.adminLevel);
  state.mustChangePassword = Boolean(login.mustChangePassword);
  state.demoMode = false;
  state.authChecked = true;
  state.loginError = '';
  localStorage.setItem('panderuu-auth-token', state.authToken);
}

async function syncFromBackend() {
  try {
    if (state.demoMode) return;
    await ensureBackendSession();
    if (state.mustChangePassword) {
      state.backendOnline = true;
      state.backendMessage = 'Cambio de clave requerido';
      saveApp();
      render();
      return;
    }
    const backend = await api('/state');
    applyBackendState(backend);
    state.backendOnline = true;
    state.backendMessage = `Backend v${backend.version}`;
    saveApp();
    render();
  } catch (error) {
    state.backendOnline = false;
    state.backendMessage = `Demo local: ${error.message}`;
    render();
  }
}

async function initializeAuth() {
  if (state.demoMode) {
    state.authChecked = true;
    render();
    return;
  }
  state.authToken = localStorage.getItem('panderuu-auth-token') || state.authToken || '';
  if (!state.authToken) {
    state.authChecked = true;
    render();
    return;
  }
  await syncFromBackend();
  state.authChecked = true;
  render();
}

async function logout() {
  try {
    if (state.authToken) await api('/auth/logout', { method: 'POST', body: {} });
  } catch {
    // If logout fails, clear the local session anyway.
  }
  state.authToken = '';
  state.currentActor = null;
  state.mustChangePassword = false;
  state.backendOnline = false;
  state.backendMessage = 'Sesion cerrada';
  localStorage.removeItem('panderuu-auth-token');
  saveApp();
  render();
}

function applyBackendState(backend) {
  people = (backend.people || []).map((person) => ({
    id: person.id,
    type: person.type,
    name: person.name,
    document: person.document,
    phone: person.phone,
    email: person.email,
    address: person.address,
    roles: person.roles || [],
    credit: String(person.creditStatus || 'nuevo').replace('_', ' '),
    loansCount: Number(person.loansCount || 0),
    punctualLoans: Number(person.punctualLoans || 0),
    registeredBy: person.registeredBy || 'Sistema'
  }));

  const quotasByLoan = new Map();
  for (const quota of backend.quotas || []) {
    if (!quotasByLoan.has(quota.loanId)) quotasByLoan.set(quota.loanId, []);
    quotasByLoan.get(quota.loanId).push(quota);
  }

  loans = (backend.loans || []).map((loan) => {
    const loanQuotas = (quotasByLoan.get(loan.id) || []).filter((quota) => quota.status !== 'pagada' && quota.status !== 'anulada');
    const nextQuota = loanQuotas.sort((left, right) => left.number - right.number)[0];
    return {
      id: loan.id,
      lenderId: loan.personId,
      person: loan.personName,
      capital: centsToSoles(loan.capitalCents),
      rate: loan.ratePercent,
      interest: centsToSoles(loan.interestCents),
      total: centsToSoles(loan.totalCents),
      paid: centsToSoles(loan.paidCents),
      months: loan.months,
      installments: loan.installments,
      nextDue: nextQuota?.dueDate || '-',
      status: loan.status,
      admin: loan.createdBy
    };
  });

  payments = (backend.quotas || [])
    .filter((quota) => quota.status !== 'pagada' && quota.status !== 'anulada')
    .map((quota) => {
      const loan = (backend.loans || []).find((item) => item.id === quota.loanId);
      return {
        id: quota.id,
        person: loan?.personName || 'Sin persona',
        loanId: quota.loanId,
        amount: centsToSoles(Number(quota.totalCents || 0) - Number(quota.paidCents || 0)),
        due: quota.dueDate,
        status: quota.status,
        installments: quota.number
      };
    });

  registeredPayments = (backend.payments || []).map((payment) => ({
    id: payment.id,
    loanId: payment.loanId,
    person: payment.personName,
    amount: centsToSoles(payment.amountCents),
    capital: centsToSoles(payment.capitalCents),
    interest: centsToSoles(payment.interestCents),
    mora: centsToSoles(payment.moraCents),
    installmentsClosed: payment.installmentsClosed,
    status: payment.status || 'activo',
    createdAt: String(payment.createdAt || '').slice(0, 10),
    reversedAt: String(payment.reversedAt || '').slice(0, 10),
    reversalReason: payment.reversalReason || ''
  }));

  cashMovements = (backend.cashMovements || []).map((movement) => ({
    id: movement.id,
    date: String(movement.at || '').slice(0, 10),
    type: movement.type,
    description: movement.description,
    amount: centsToSoles(movement.amountCents),
    direction: movement.direction
  }));

  receipts = (backend.receipts || []).map((receipt) => ({
    id: receipt.id,
    number: receipt.number,
    person: receipt.personName,
    document: people.find((person) => person.name === receipt.personName)?.document || '',
    loanAmount: centsToSoles(receipt.capitalCents),
    rate: receipt.ratePercent,
    interest: centsToSoles(receipt.interestCents),
    mora: centsToSoles(receipt.moraCents),
    period: receipt.installmentsClosed,
    date: String(receipt.issuedAt || '').slice(0, 10),
    total: centsToSoles(receipt.totalCents),
    paid: centsToSoles(receipt.paidCents),
    balance: centsToSoles(receipt.balanceCents),
    status: receipt.status,
    admin: receipt.issuedBy
  }));

  cashClosures = (backend.cashClosures || []).map((close) => ({
    id: close.id,
    date: String(close.at || '').slice(0, 10),
    range: close.range,
    expected: centsToSoles(close.expectedCents),
    counted: centsToSoles(close.countedCents),
    difference: centsToSoles(close.differenceCents),
    reason: close.reason
  }));

  if (!people.some((person) => person.id === state.selectedPersonId)) {
    state.selectedPersonId = people[0]?.id || '';
  }
  if (receipts[0]) state.receipt = receipts[0];
}

const icons = {
  dashboard: '<svg viewBox="0 0 24 24"><path d="M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z"/></svg>',
  users: '<svg viewBox="0 0 24 24"><path d="M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3ZM8 11c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3Zm0 2c-2.7 0-5 1.3-5 3v2h10v-2c0-1.7-2.3-3-5-3Zm8 0c-.4 0-.8 0-1.2.1 1.3.8 2.2 1.8 2.2 2.9v2h4v-2c0-1.7-2.3-3-5-3Z"/></svg>',
  wallet: '<svg viewBox="0 0 24 24"><path d="M4 6h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2h14v2H4Zm13 7a1.5 1.5 0 1 0 0 3h4v-3h-4Z"/></svg>',
  loan: '<svg viewBox="0 0 24 24"><path d="M12 2 2 7l10 5 10-5-10-5Zm-7 9v6l7 4 7-4v-6l-7 4-7-4Z"/></svg>',
  receipt: '<svg viewBox="0 0 24 24"><path d="M6 2h12v20l-2-1-2 1-2-1-2 1-2-1-2 1V2Zm3 5h6V5H9v2Zm0 4h6V9H9v2Zm0 4h4v-2H9v2Z"/></svg>',
  printer: '<svg viewBox="0 0 24 24"><path d="M6 3h12v5H6V3Zm-2 7h16a2 2 0 0 1 2 2v6h-4v3H6v-3H2v-6a2 2 0 0 1 2-2Zm4 6v3h8v-5H8v2Z"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z"/></svg>',
  alert: '<svg viewBox="0 0 24 24"><path d="M12 2 1 21h22L12 2Zm1 15h-2v2h2v-2Zm0-8h-2v6h2V9Z"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm-1 14-3-3 1.4-1.4 1.6 1.6 3.8-3.8L16.2 11 11 16Z"/></svg>',
  chart: '<svg viewBox="0 0 24 24"><path d="M4 20V4h2v14h14v2H4Zm4-4h2V9H8v7Zm4 0h2V6h-2v10Zm4 0h2v-5h-2v5Z"/></svg>'
};

function money(value) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
}

function loanBalance(loan) {
  return Math.max(loan.total - loan.paid, 0);
}

function can(action) {
  const required = { report: 1, people: 2, loan: 2, cash: 2, admin: 3 };
  return state.adminLevel >= required[action];
}

function requirePermission(action, panel) {
  if (!can(action)) {
    toast('permisos no autorizados');
    return;
  }
  state.panel = panel;
  render();
}

function toast(message) {
  const node = document.createElement('div');
  node.className = 'permission-toast';
  node.innerHTML = `${icons.shield}<span>${message}</span>`;
  document.body.append(node);
  setTimeout(() => node.remove(), 2400);
}

function totals() {
  const cash = cashMovements.reduce((sum, movement) => (movement.direction === 'entrada' ? sum + movement.amount : sum - movement.amount), 0);
  const active = loans.reduce((sum, loan) => sum + loanBalance(loan), 0);
  const interest = loans.reduce((sum, loan) => sum + loan.interest, 0);
  const priority = payments.filter((payment) => payment.status === 'vencida' || payment.status === 'prioritaria').length;
  return { cash, active, interest, priority };
}

function viewTitle() {
  const titles = {
    dashboard: ['Dashboard', 'Control general de caja y prestamos'],
    prestamistas: ['Prestamistas', 'Registro, perfil e historial crediticio'],
    asociados: ['Asociados', 'Personas naturales y empresas registradas'],
    prestamos: ['Prestamos', 'Cartera, saldos, intereses y estados'],
    pagos: ['Pagos', 'Cuotas prioritarias y pagos registrados'],
    caja: ['Caja', 'Movimientos, ingresos y cierre de caja'],
    boletas: ['Boletas', 'Vista previa, correlativos e impresiones'],
    reportes: ['Reportes', 'Indicadores de intereses, pagos y caja']
  };
  return titles[state.activeView] || titles.dashboard;
}

function loadingShell() {
  return `<main class="auth-shell"><section class="auth-panel"><div class="brand auth-brand"><div class="brand-mark">P</div><div><strong>Panderuu</strong><span>Inicializando</span></div></div><div class="calc-box">Verificando sesion local.</div></section></main>`;
}

function loginShell() {
  return `<main class="auth-shell">
    <section class="auth-panel">
      <div class="brand auth-brand"><div class="brand-mark">P</div><div><strong>Panderuu</strong><span>Acceso administrativo</span></div></div>
      <form class="form-stack" id="loginForm">
        <label>Usuario<input name="username" value="${DEV_USERNAME}" autocomplete="username"></label>
        <label>Clave<input name="password" type="password" value="${DEV_PASSWORD}" autocomplete="current-password"></label>
        ${state.loginError ? `<p class="form-error">${state.loginError}</p>` : '<p class="form-error" hidden></p>'}
        <button class="primary-button" type="submit">${icons.shield} Iniciar sesion</button>
        <button class="small-button" id="demoMode" type="button">Usar demo local</button>
      </form>
    </section>
  </main>`;
}

function changePasswordShell() {
  return `<main class="auth-shell">
    <section class="auth-panel">
      <div class="brand auth-brand"><div class="brand-mark">P</div><div><strong>Cambio de clave</strong><span>${state.currentActor?.username || 'Administrador'}</span></div></div>
      <form class="form-stack" id="changePasswordForm">
        <label>Clave actual<input name="currentPassword" type="password" autocomplete="current-password"></label>
        <label>Nueva clave<input name="newPassword" type="password" autocomplete="new-password"></label>
        <label>Confirmar clave<input name="confirmPassword" type="password" autocomplete="new-password"></label>
        <p class="form-error" hidden></p>
        <button class="primary-button" type="submit">${icons.shield} Actualizar clave</button>
        <button class="small-button" id="logoutButton" type="button">Cerrar sesion</button>
      </form>
    </section>
  </main>`;
}

function render() {
  const app = document.querySelector('#app');
  if (!state.authChecked) {
    app.innerHTML = loadingShell();
    return;
  }
  if (!state.authToken && !state.demoMode) {
    app.innerHTML = loginShell();
    bindAuthEvents();
    return;
  }
  if (state.mustChangePassword && !state.demoMode) {
    app.innerHTML = changePasswordShell();
    bindAuthEvents();
    return;
  }

  const t = totals();
  const selectedPerson = people.find((person) => person.id === state.selectedPersonId) || people[0];
  const selectedLoans = selectedPerson ? loans.filter((loan) => loan.lenderId === selectedPerson.id) : [];
  const [section, title] = viewTitle();

  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">P</div>
          <div><strong>Panderuu</strong><span>Gestion local</span></div>
        </div>
        <nav>
          ${navButton('Dashboard', 'dashboard', 'dashboard')}
          ${navButton('Prestamistas', 'users', 'prestamistas')}
          ${navButton('Asociados', 'users', 'asociados')}
          ${navButton('Prestamos', 'loan', 'prestamos')}
          ${navButton('Pagos', 'receipt', 'pagos')}
          ${navButton('Caja', 'wallet', 'caja')}
          ${navButton('Boletas', 'printer', 'boletas')}
          ${navButton('Reportes', 'chart', 'reportes')}
        </nav>
      </aside>

      <main class="workspace">
        <header class="topbar">
          <div>
            <p class="eyebrow">${section}</p>
            <h1>${title}</h1>
          </div>
          <div class="topbar-actions">
            <span class="backend-status ${state.backendOnline ? 'online' : 'offline'}">${state.backendMessage}</span>
            <label class="search-box">${icons.dashboard}<input placeholder="Buscar persona, prestamo o boleta"></label>
            <label class="admin-level">${icons.shield}
              <select id="adminLevel" ${state.backendOnline ? 'disabled' : ''}>
                ${admins.map((admin) => `<option value="${admin.level}" ${admin.level === state.adminLevel ? 'selected' : ''}>Admin nivel ${admin.level}</option>`).join('')}
              </select>
            </label>
            ${state.currentActor ? `<span class="session-chip">${state.currentActor.username}</span><button class="small-button" id="logoutButton" type="button">Salir</button>` : ''}
            <button class="small-button" id="resetDemo" type="button">Reiniciar demo</button>
          </div>
        </header>

        <section class="metric-grid">
          ${metric('Caja actual', money(t.cash), 'Saldo desde movimientos', 'wallet', 'green')}
          ${metric('Prestamos activos', money(t.active), `${loans.length} registros`, 'loan', 'blue')}
          ${metric('Pagos prioritarios', String(t.priority), 'Vencidos o de hoy', 'alert', 'red')}
          ${metric('Interes del mes', money(t.interest), 'Clasificado en caja unica', 'chart', 'amber')}
        </section>

        <section class="quick-actions">
          ${actionButton('Agregar prestamista', 'plus', 'prestamista')}
          ${actionButton('Agregar asociado', 'users', 'asociado')}
          ${actionButton('Crear prestamo', 'loan', 'prestamo')}
          ${actionButton('Registrar pago', 'receipt', 'pago')}
          ${actionButton('Ingresar caja', 'wallet', 'ingresoCaja')}
          ${actionButton('Cerrar caja', 'chart', 'cierreCaja')}
          ${actionButton('Informe impreso', 'printer', 'boleta')}
        </section>

        ${renderActiveView(selectedPerson, selectedLoans)}
      </main>
    </div>
    ${state.panel ? drawer(state.panel) : ''}
  `;

  bindEvents();
}

function navButton(label, icon, view) {
  return `<button class="nav-item ${state.activeView === view ? 'active' : ''}" type="button" data-view="${view}">${icons[icon]}<span>${label}</span></button>`;
}

function metric(label, value, meta, icon, tone) {
  return `<article class="metric-card ${tone}"><div class="metric-icon">${icons[icon]}</div><div><span>${label}</span><strong>${value}</strong><small>${meta}</small></div></article>`;
}

function actionButton(label, icon, action) {
  return `<button class="action-button" type="button" data-action="${action}">${icons[icon]}<span>${label}</span></button>`;
}

function renderActiveView(selectedPerson, selectedLoans) {
  if (state.activeView === 'prestamistas') return peopleSection('Prestamistas', (person) => person.roles.includes('Prestamista'));
  if (state.activeView === 'asociados') return peopleSection('Asociados', (person) => person.roles.includes('Asociado'));
  if (state.activeView === 'prestamos') return loansSection();
  if (state.activeView === 'pagos') return paymentsSection();
  if (state.activeView === 'caja') return cashSection();
  if (state.activeView === 'boletas') return receiptsSection();
  if (state.activeView === 'reportes') return reportsSection();
  return dashboardSection(selectedPerson, selectedLoans);
}

function dashboardSection(selectedPerson, selectedLoans) {
  return `
    <section class="dashboard-grid">
      <div class="panel large-panel">
        <div class="panel-header"><div><p class="eyebrow">Prioridad</p><h2>Pagos de hoy, vencidos y evaluados</h2></div>${icons.alert}</div>
        ${priorityTable()}
      </div>
      <div class="panel">
        <div class="panel-header"><div><p class="eyebrow">Intereses</p><h2>Ganancia mensual</h2></div>${icons.chart}</div>
        ${barChart()}
      </div>
    </section>
    <section class="lower-grid">
      <div class="panel">
        <div class="panel-header"><div><p class="eyebrow">Personas</p><h2>Prestamistas y asociados</h2></div>${icons.users}</div>
        ${peopleList()}
      </div>
      <div class="panel profile-panel">
        ${profile(selectedPerson, selectedLoans)}
      </div>
      <div class="panel">
        <div class="panel-header"><div><p class="eyebrow">Caja</p><h2>Ultimos movimientos</h2></div>${icons.wallet}</div>
        ${cashList()}
      </div>
    </section>`;
}

function peopleSection(title, predicate) {
  const filtered = people.filter(predicate);
  return `<section class="single-grid">
    <div class="panel">
      <div class="panel-header"><div><p class="eyebrow">${title}</p><h2>${filtered.length} registros activos</h2></div>${icons.users}</div>
      <div class="table-wrap"><table>
        <thead><tr><th>Nombre</th><th>Documento</th><th>Celular</th><th>Roles</th><th>Estado</th><th>Registrado por</th></tr></thead>
        <tbody>${filtered
          .map(
            (person) => `<tr data-person="${person.id}"><td>${person.name}</td><td>${person.document}</td><td>${person.phone}</td><td>${person.roles.join(' / ')}</td><td>${badge(person.credit)}</td><td>${person.registeredBy}</td></tr>`
          )
          .join('')}</tbody>
      </table></div>
    </div>
  </section>`;
}

function loansSection() {
  return `<section class="single-grid">
    <div class="panel">
      <div class="panel-header"><div><p class="eyebrow">Cartera</p><h2>Prestamos y saldos</h2></div>${icons.loan}</div>
      <div class="table-wrap"><table>
        <thead><tr><th>ID</th><th>Prestamista</th><th>Capital</th><th>Interes</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Proximo</th><th>Estado</th><th>Accion</th></tr></thead>
        <tbody>${loans
          .map(
            (loan) => `<tr><td>${loan.id}</td><td>${loan.person}</td><td>${money(loan.capital)}</td><td>${loan.rate}% / ${money(loan.interest)}</td><td>${money(loan.total)}</td><td>${money(loan.paid)}</td><td>${money(loanBalance(loan))}</td><td>${loan.nextDue}</td><td>${badge(loan.status)}</td><td>${loan.status === 'anulado' ? '-' : `<button class="small-button danger-button" data-void-loan="${loan.id}" type="button">Anular</button>`}</td></tr>`
          )
          .join('')}</tbody>
      </table></div>
    </div>
  </section>`;
}

function paymentsSection() {
  return `<section class="single-grid">
    <div class="panel">
      <div class="panel-header"><div><p class="eyebrow">Cuotas</p><h2>Pagos pendientes y registrados</h2></div>${icons.receipt}</div>
      ${priorityTable()}
    </div>
    <div class="panel">
      <div class="panel-header"><div><p class="eyebrow">Historial</p><h2>Pagos registrados</h2></div>${icons.receipt}</div>
      ${registeredPaymentsTable()}
    </div>
  </section>`;
}

function cashSection() {
  return `<section class="dashboard-grid">
    <div class="panel large-panel">
      <div class="panel-header"><div><p class="eyebrow">Caja unica</p><h2>Libro de movimientos</h2></div>${icons.wallet}</div>
      <div class="table-wrap"><table>
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Descripcion</th><th>Direccion</th><th>Monto</th></tr></thead>
        <tbody>${cashMovements
          .map(
            (movement) => `<tr><td>${movement.date}</td><td>${movement.type}</td><td>${movement.description}</td><td>${movement.direction}</td><td class="${movement.direction === 'entrada' ? 'money-in' : 'money-out'}">${money(movement.amount)}</td></tr>`
          )
          .join('')}</tbody>
      </table></div>
    </div>
    <div class="panel">
      <div class="panel-header"><div><p class="eyebrow">Cierres</p><h2>Conteos finales</h2></div>${icons.chart}</div>
      ${cashClosures.length === 0 ? '<p class="empty">Sin cierres registrados.</p>' : cashClosures.map((item) => `<div class="loan-item"><div><strong>${item.range}</strong><small>Esperado ${money(item.expected)} / contado ${money(item.counted)}</small></div>${badge(item.difference === 0 ? 'pagado' : 'evaluado')}</div>`).join('')}
    </div>
  </section>`;
}

function receiptsSection() {
  return `<section class="single-grid">
    <div class="panel">
      <div class="panel-header"><div><p class="eyebrow">Boletas</p><h2>${receipts.length} comprobantes generados</h2></div>${icons.printer}</div>
      <div class="table-wrap"><table>
        <thead><tr><th>Numero</th><th>Persona</th><th>Fecha</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Estado</th><th>Accion</th></tr></thead>
        <tbody>${receipts
          .map(
            (receipt, index) => `<tr><td>${receipt.number}</td><td>${receipt.person}</td><td>${receipt.date}</td><td>${money(receipt.total)}</td><td>${money(receipt.paid)}</td><td>${money(receipt.balance)}</td><td>${receipt.status}</td><td><button class="small-button" data-receipt="${index}" type="button">Ver</button></td></tr>`
          )
          .join('')}</tbody>
      </table></div>
    </div>
  </section>`;
}

function reportsSection() {
  const t = totals();
  return `<section class="dashboard-grid">
    <div class="panel">
      <div class="panel-header"><div><p class="eyebrow">Resumen</p><h2>Informe operativo</h2></div>${icons.chart}</div>
      <div class="report-grid">
        <span><strong>${money(t.cash)}</strong>Caja actual</span>
        <span><strong>${money(t.active)}</strong>Saldo prestado</span>
        <span><strong>${money(t.interest)}</strong>Interes generado</span>
        <span><strong>${payments.length}</strong>Cuotas registradas</span>
        <span><strong>${people.filter((p) => p.roles.includes('Prestamista')).length}</strong>Prestamistas</span>
        <span><strong>${people.filter((p) => p.roles.includes('Asociado')).length}</strong>Asociados</span>
      </div>
    </div>
    <div class="panel">
      <div class="panel-header"><div><p class="eyebrow">Intereses</p><h2>Grafico mensual</h2></div>${icons.chart}</div>
      ${barChart()}
    </div>
  </section>`;
}

function priorityTable() {
  const weight = { vencida: 0, prioritaria: 1, parcial: 2, pendiente: 3, pagada: 4 };
  return `<div class="table-wrap"><table>
    <thead><tr><th>Persona</th><th>Prestamo</th><th>Vence</th><th>Monto</th><th>Cuotas</th><th>Estado</th><th>Accion</th></tr></thead>
    <tbody>
      ${payments
        .slice()
        .sort((a, b) => weight[a.status] - weight[b.status])
        .map(
          (payment) => `<tr>
            <td>${payment.person}</td><td>${payment.loanId}</td><td>${payment.due}</td><td>${money(payment.amount)}</td><td>${payment.installments}</td>
            <td>${badge(payment.status)}</td><td><button class="small-button" data-action="pago" type="button">Registrar</button></td>
          </tr>`
        )
        .join('')}
    </tbody></table></div>`;
}

function registeredPaymentsTable() {
  if (registeredPayments.length === 0) return '<p class="empty">Sin pagos registrados.</p>';
  return `<div class="table-wrap"><table>
    <thead><tr><th>Fecha</th><th>Persona</th><th>Prestamo</th><th>Monto</th><th>Capital</th><th>Interes</th><th>Mora</th><th>Estado</th><th>Accion</th></tr></thead>
    <tbody>${registeredPayments
      .map(
        (payment) => `<tr>
          <td>${payment.createdAt}</td><td>${payment.person}</td><td>${payment.loanId}</td><td>${money(payment.amount)}</td><td>${money(payment.capital)}</td><td>${money(payment.interest)}</td><td>${money(payment.mora)}</td><td>${badge(payment.status)}</td>
          <td>${payment.status === 'reversado' ? '-' : `<button class="small-button danger-button" data-reverse-payment="${payment.id}" type="button">Reversar</button>`}</td>
        </tr>`
      )
      .join('')}</tbody>
  </table></div>`;
}

function barChart() {
  const max = Math.max(...interestByMonth.map((item) => item.value));
  return `<div class="bar-chart">
    ${interestByMonth
      .map(
        (item) => `<div class="bar-item">
          <div class="bar-track"><span style="height:${(item.value / max) * 100}%"></span></div>
          <strong>${item.month}</strong>
          <small>${money(item.value)}</small>
        </div>`
      )
      .join('')}
  </div>`;
}

function peopleList() {
  return `<div class="people-list">
    ${people
      .map(
        (person) => `<button class="person-row ${person.id === state.selectedPersonId ? 'active' : ''}" type="button" data-person="${person.id}">
          <span class="avatar">${person.name.slice(0, 1)}</span>
          <span><strong>${person.name}</strong><small>${person.roles.join(' / ')}</small></span>
          ${badge(person.credit)}
        </button>`
      )
      .join('')}
  </div>`;
}

function profile(person, personLoans) {
  return `<div class="panel-header"><div><p class="eyebrow">Perfil</p><h2>${person.name}</h2></div>${icons.users}</div>
    <div class="profile-card">
      <div class="profile-avatar">${person.name.slice(0, 1)}</div>
      <div><p>${person.document}</p><p>${person.phone}</p><p>${person.email}</p><p>${person.address}</p></div>
    </div>
    <div class="profile-stats">
      <span><strong>${person.loansCount}</strong>Prestamos</span>
      <span><strong>${person.punctualLoans}</strong>Puntuales</span>
      <span><strong>${personLoans.length}</strong>Activos</span>
    </div>
    <div class="loan-stack">
      ${
        personLoans.length === 0
          ? '<p class="empty">Sin prestamos activos.</p>'
          : personLoans.map((loan) => `<div class="loan-item"><div><strong>${loan.id}</strong><small>Saldo ${money(loanBalance(loan))}</small></div>${badge(loan.status)}</div>`).join('')
      }
    </div>`;
}

function cashList() {
  return `<div class="cash-list">
    ${cashMovements
      .slice(0, 6)
      .map(
        (movement) => `<div class="cash-row">
          <div class="cash-dot ${movement.direction === 'entrada' ? 'in' : 'out'}">${movement.direction === 'entrada' ? '+' : '-'}</div>
          <div><strong>${movement.description}</strong><small>${movement.date}</small></div>
          <span class="${movement.direction === 'entrada' ? 'money-in' : 'money-out'}">${money(movement.amount)}</span>
        </div>`
      )
      .join('')}
  </div>`;
}

function badge(status) {
  return `<span class="status-badge ${status.replace(' ', '-')}">${status}</span>`;
}

function drawer(panel) {
  const title = {
    prestamista: 'Agregar prestamista',
    asociado: 'Agregar asociado',
    prestamo: 'Crear prestamo',
    pago: 'Registrar pago',
    ingresoCaja: 'Ingresar dinero a caja',
    cierreCaja: 'Cerrar caja',
    boleta: 'Vista previa de boleta',
    reversarPago: 'Reversar pago',
    anularPrestamo: 'Anular prestamo'
  }[panel];
  const body = {
    prestamista: personForm('prestamista'),
    asociado: personForm('asociado'),
    prestamo: loanForm(),
    pago: paymentForm(),
    ingresoCaja: cashIncomeForm(),
    cierreCaja: cashCloseForm(),
    boleta: receiptPreview(),
    reversarPago: reversePaymentForm(),
    anularPrestamo: voidLoanForm()
  }[panel];
  return `<div class="drawer-backdrop"><aside class="drawer"><div class="drawer-header"><h2>${title}</h2><button class="icon-button" id="closeDrawer" type="button">x</button></div>${body}</aside></div>`;
}

function personForm(kind) {
  return `<form class="form-stack" id="personForm" data-kind="${kind}">
    <label>Tipo<select name="type"><option value="natural">Persona natural</option><option value="empresa" ${kind === 'asociado' ? 'selected' : ''}>Empresa</option></select></label>
    <label>Nombre o razon social<input name="name" placeholder="Sin numeros"></label>
    <label>DNI o RUC<input name="document" placeholder="Documento demo"></label>
    <label>Celular<input name="phone" placeholder="999 000 000"></label>
    <label>Correo<input name="email" placeholder="correo@example.local"></label>
    <label>Direccion<input name="address" placeholder="Direccion localizable"></label>
    <p class="form-error" hidden></p>
    <button class="primary-button" type="submit">${icons.plus} Registrar ${kind}</button>
  </form>`;
}

function loanForm() {
  return `<form class="form-stack" id="loanForm">
    <label>Prestamista<select name="lender">${people.filter((p) => p.roles.includes('Prestamista')).map((person) => `<option value="${person.id}">${person.name}</option>`).join('')}</select></label>
    <div class="rule-box">${icons.alert}<span>Regla base: nuevos o sin mas de dos prestamos puntuales solo S/ 150 con 5%.</span></div>
    <label>Capital<input name="capital" type="number" value="150" min="1"></label>
    <label>Interes<select name="rate"><option value="2">2%</option><option value="5" selected>5%</option><option value="10">10%</option></select></label>
    <div class="form-grid"><label>Meses<input name="months" type="number" value="1" min="1"></label><label>Cuotas<input name="installments" type="number" value="1" min="1"></label></div>
    <div class="calc-box" id="loanCalc">Interes generado: ${money(7.5)} | Total: ${money(157.5)}</div>
    <p class="form-error" hidden></p>
    <button class="primary-button" type="submit">${icons.loan} Crear prestamo</button>
  </form>`;
}

function paymentForm() {
  return `<form class="form-stack" id="paymentForm">
    <label>Prestamo<select name="loan">${loans.filter((loan) => loan.status !== 'pagado' && loan.status !== 'anulado').map((loan) => `<option value="${loan.id}">${loan.id} - ${loan.person}</option>`).join('')}</select></label>
    <label>Monto recibido<input name="amount" type="number" value="157.5" min="1"></label>
    <label>Cuotas a cerrar<input name="installments" type="number" value="1" min="1"></label>
    <div class="calc-box">El pago aumenta caja unica y genera boleta. En backend se separara capital, interes y mora.</div>
    <p class="form-error" hidden></p>
    <button class="primary-button" type="submit">${icons.receipt} Registrar pago y generar boleta</button>
  </form>`;
}

function cashIncomeForm() {
  return `<form class="form-stack" id="cashIncomeForm">
    <label>Monto<input name="amount" type="number" value="100" min="1"></label>
    <label>Justificacion<input name="reason" placeholder="Motivo obligatorio"></label>
    <p class="form-error" hidden></p>
    <button class="primary-button" type="submit">${icons.wallet} Ingresar a caja</button>
  </form>`;
}

function cashCloseForm() {
  const expected = totals().cash;
  return `<form class="form-stack" id="cashCloseForm">
    <div class="calc-box"><span>Saldo esperado: ${money(expected)}</span><span>Prestamos: ${loans.length}</span><span>Intereses del mes: ${money(totals().interest)}</span></div>
    <label>Rango<select name="range"><option>Dia actual</option><option>Semana actual</option><option>Mes actual</option><option>Rango seleccionado</option></select></label>
    <label>Saldo contado<input name="counted" type="number" value="${expected}" min="0"></label>
    <label>Observacion<input name="reason" placeholder="Obligatorio si existe diferencia"></label>
    <p class="form-error" hidden></p>
    <button class="primary-button" type="submit">${icons.chart} Generar cierre</button>
  </form>`;
}

function reversePaymentForm() {
  const payment = registeredPayments.find((item) => item.id === state.targetPaymentId);
  return `<form class="form-stack" id="reversePaymentForm">
    <div class="calc-box"><span>Pago: ${payment?.id || '-'}</span><span>Monto: ${money(payment?.amount || 0)}</span><span>Prestamo: ${payment?.loanId || '-'}</span></div>
    <label>Motivo<input name="reason" placeholder="Motivo obligatorio de reversa"></label>
    <p class="form-error" hidden></p>
    <button class="primary-button danger-primary" type="submit">${icons.alert} Reversar pago</button>
  </form>`;
}

function voidLoanForm() {
  const loan = loans.find((item) => item.id === state.targetLoanId);
  return `<form class="form-stack" id="voidLoanForm">
    <div class="calc-box"><span>Prestamo: ${loan?.id || '-'}</span><span>Prestamista: ${loan?.person || '-'}</span><span>Capital: ${money(loan?.capital || 0)}</span></div>
    <label>Motivo<input name="reason" placeholder="Motivo obligatorio de anulacion"></label>
    <p class="form-error" hidden></p>
    <button class="primary-button danger-primary" type="submit">${icons.alert} Anular prestamo</button>
  </form>`;
}

function receiptPreview() {
  const receipt = state.receipt;
  return `<div class="receipt-area">
    <div class="receipt-toolbar"><select><option>80mm</option><option>58mm</option><option>A5</option><option>A4</option></select><button class="primary-button" id="printReceipt" type="button">${icons.printer} Imprimir</button></div>
    <article class="receipt-paper">
      <header><div><strong>Panderuu</strong><span>Boleta de pago</span></div><div><strong>${receipt.number}</strong><span>${receipt.date}</span></div></header>
      <section class="receipt-meta"><p><strong>Persona:</strong> ${receipt.person}</p><p><strong>Documento:</strong> ${receipt.document}</p><p><strong>Administrador:</strong> ${receipt.admin}</p></section>
      <table class="receipt-table"><thead><tr><th>Nombre y Apellidos</th><th>Prestamo</th><th>Interes</th><th>Interes Generado</th><th>Periodo</th><th>Fecha</th><th>Total</th></tr></thead>
      <tbody><tr><td>${receipt.person}</td><td>${money(receipt.loanAmount)}</td><td>${receipt.rate}%</td><td>${money(receipt.interest)}</td><td>${receipt.period}</td><td>${receipt.date}</td><td>${money(receipt.total)}</td></tr></tbody></table>
      <footer><div><span>Pagado</span><strong>${money(receipt.paid)}</strong></div><div><span>Saldo</span><strong>${money(receipt.balance)}</strong></div><div><span>Estado</span><strong>${receipt.status}</strong></div></footer>
      <div class="signature-grid"><span>Firma administrador</span><span>Firma prestamista/asociado</span></div>
    </article>
  </div>`;
}

function bindEvents() {
  document.querySelector('#adminLevel')?.addEventListener('change', (event) => {
    state.adminLevel = Number(event.target.value);
    saveApp();
    render();
  });

  document.querySelector('#resetDemo')?.addEventListener('click', resetDemo);
  document.querySelector('#logoutButton')?.addEventListener('click', logout);

  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeView = button.getAttribute('data-view');
      saveApp();
      render();
    });
  });

  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.getAttribute('data-action');
      const permission =
        action === 'boleta' ? 'report' : action === 'prestamista' || action === 'asociado' ? 'people' : action === 'ingresoCaja' || action === 'cierreCaja' ? 'cash' : 'loan';
      requirePermission(permission, action);
    });
  });

  document.querySelectorAll('[data-person]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedPersonId = button.getAttribute('data-person');
      saveApp();
      render();
    });
  });

  document.querySelectorAll('[data-receipt]').forEach((button) => {
    button.addEventListener('click', () => {
      state.receipt = receipts[Number(button.getAttribute('data-receipt'))] || state.receipt;
      state.panel = 'boleta';
      saveApp();
      render();
    });
  });

  document.querySelectorAll('[data-reverse-payment]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!can('loan')) return toast('permisos no autorizados');
      state.targetPaymentId = button.getAttribute('data-reverse-payment');
      state.panel = 'reversarPago';
      render();
    });
  });

  document.querySelectorAll('[data-void-loan]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!can('loan')) return toast('permisos no autorizados');
      state.targetLoanId = button.getAttribute('data-void-loan');
      state.panel = 'anularPrestamo';
      render();
    });
  });

  document.querySelector('#closeDrawer')?.addEventListener('click', () => {
    state.panel = null;
    saveApp();
    render();
  });

  document.querySelector('#printReceipt')?.addEventListener('click', printCurrentReceipt);
  document.querySelector('#personForm')?.addEventListener('submit', submitPerson);
  document.querySelector('#loanForm')?.addEventListener('input', updateLoanCalc);
  document.querySelector('#loanForm')?.addEventListener('submit', submitLoan);
  document.querySelector('#paymentForm')?.addEventListener('submit', submitPayment);
  document.querySelector('#cashIncomeForm')?.addEventListener('submit', submitCashIncome);
  document.querySelector('#cashCloseForm')?.addEventListener('submit', submitCashClose);
  document.querySelector('#reversePaymentForm')?.addEventListener('submit', submitReversePayment);
  document.querySelector('#voidLoanForm')?.addEventListener('submit', submitVoidLoan);
}

function bindAuthEvents() {
  document.querySelector('#loginForm')?.addEventListener('submit', submitLogin);
  document.querySelector('#changePasswordForm')?.addEventListener('submit', submitChangePassword);
  document.querySelector('#demoMode')?.addEventListener('click', () => {
    state.demoMode = true;
    state.backendOnline = false;
    state.backendMessage = 'Modo demo local';
    state.authChecked = true;
    state.loginError = '';
    saveApp();
    render();
  });
  document.querySelector('#logoutButton')?.addEventListener('click', logout);
}

async function submitLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const error = form.querySelector('.form-error');
  try {
    await loginWithCredentials(data.username, data.password);
    if (state.mustChangePassword) {
      state.backendOnline = true;
      state.backendMessage = 'Cambio de clave requerido';
      saveApp();
      render();
      return;
    }
    await syncFromBackend();
  } catch (loginError) {
    state.loginError = loginError.message;
    showError(error, loginError.message);
    saveApp();
  }
}

async function submitChangePassword(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const error = form.querySelector('.form-error');
  if (data.newPassword !== data.confirmPassword) return showError(error, 'La nueva clave no coincide.');
  try {
    const changed = await api('/auth/change-password', {
      method: 'POST',
      body: {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      }
    });
    state.currentActor = changed.actor;
    state.mustChangePassword = false;
    await syncFromBackend();
  } catch (changeError) {
    showError(error, changeError.message);
  }
}

async function submitPerson(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const error = form.querySelector('.form-error');
  if (!data.name || /\d/.test(data.name)) return showError(error, 'El nombre es obligatorio y no debe contener numeros.');
  if (!data.document || !data.phone || !data.address) return showError(error, 'Documento, celular y direccion son obligatorios.');
  if (data.email && !String(data.email).includes('@')) return showError(error, 'Correo invalido.');

  const kind = form.getAttribute('data-kind');
  if (state.backendOnline) {
    try {
      await api('/people', {
        method: 'POST',
        body: {
          type: data.type,
          name: data.name,
          document: data.document,
          phone: data.phone,
          email: data.email,
          address: data.address,
          roles: kind === 'prestamista' ? ['Prestamista'] : ['Asociado']
        }
      });
      state.panel = null;
      await syncFromBackend();
      return;
    } catch (backendError) {
      return showError(error, backendError.message);
    }
  }

  const person = {
    id: `p-${Date.now()}`,
    type: data.type,
    name: data.name,
    document: data.document,
    phone: data.phone,
    email: data.email || 'sin-correo@example.local',
    address: data.address,
    roles: kind === 'prestamista' ? ['Prestamista'] : ['Asociado'],
    credit: 'nuevo',
    loansCount: 0,
    punctualLoans: 0,
    registeredBy: admins.find((admin) => admin.level === state.adminLevel).name
  };
  people.unshift(person);
  state.selectedPersonId = person.id;
  state.panel = null;
  saveApp();
  render();
}

function updateLoanCalc() {
  const form = document.querySelector('#loanForm');
  if (!form) return;
  const capital = Number(form.elements.capital.value || 0);
  const rate = Number(form.elements.rate.value || 0);
  const installments = Math.max(Number(form.elements.installments.value || 1), 1);
  const interest = capital * (rate / 100);
  form.querySelector('#loanCalc').textContent = `Interes generado: ${money(interest)} | Total: ${money(capital + interest)} | Cuota: ${money((capital + interest) / installments)}`;
}

async function submitLoan(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const lender = people.find((person) => person.id === data.lender);
  const capital = Number(data.capital);
  const rate = Number(data.rate);
  const months = Number(data.months);
  const installments = Number(data.installments);
  const error = form.querySelector('.form-error');
  if (!lender || capital <= 0 || months <= 0 || installments <= 0) return showError(error, 'Capital, meses y cuotas deben ser mayores a cero.');
  if ((lender.credit === 'nuevo' || lender.punctualLoans < 2) && capital > 150) return showError(error, 'Prestamista nuevo: maximo S/ 150 salvo autorizacion administrativa.');

  if (state.backendOnline) {
    try {
      await api('/loans', {
        method: 'POST',
        body: {
          personId: lender.id,
          capitalCents: solesToCents(capital),
          ratePercent: rate,
          months,
          installments
        }
      });
      state.panel = null;
      await syncFromBackend();
      return;
    } catch (backendError) {
      return showError(error, backendError.message);
    }
  }

  const interest = Number((capital * (rate / 100)).toFixed(2));
  const total = capital + interest;
  const id = `L-${String(loans.length + 1).padStart(4, '0')}`;
  loans.unshift({ id, lenderId: lender.id, person: lender.name, capital, rate, interest, total, months, installments, paid: 0, nextDue: today, status: lender.credit === 'evaluado' ? 'evaluado' : 'activo', admin: admins.find((admin) => admin.level === state.adminLevel).name });
  payments.unshift({ id: `pay-${Date.now()}`, person: lender.name, loanId: id, amount: total / installments, due: today, status: 'prioritaria', installments });
  cashMovements.unshift({ id: `cash-${Date.now()}`, date: today, type: 'prestamo', description: `Desembolso ${id}`, amount: capital, direction: 'salida' });
  state.receipt = { number: `BOL-2026-${String(loans.length + 1).padStart(4, '0')}`, person: lender.name, document: lender.document, loanAmount: capital, rate, interest, period: months, date: today, total, paid: 0, balance: total, status: 'Pendiente', admin: admins.find((admin) => admin.level === state.adminLevel).name };
  receipts.unshift(state.receipt);
  state.panel = null;
  saveApp();
  render();
}

async function submitPayment(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const loan = loans.find((item) => item.id === data.loan);
  const amount = Number(data.amount);
  const error = form.querySelector('.form-error');
  if (!loan || amount <= 0) return showError(error, 'Selecciona un prestamo y registra monto positivo.');

  if (state.backendOnline) {
    try {
      const result = await api('/payments', {
        method: 'POST',
        body: {
          loanId: loan.id,
          amountCents: solesToCents(amount)
        }
      });
      state.panel = result.receipt ? 'boleta' : null;
      await syncFromBackend();
      const createdReceipt = receipts.find((receipt) => receipt.id === result.receipt?.id);
      if (createdReceipt) state.receipt = createdReceipt;
      render();
      return;
    } catch (backendError) {
      return showError(error, backendError.message);
    }
  }

  loan.paid = Math.min(loan.total, loan.paid + amount);
  loan.status = loan.paid >= loan.total ? 'pagado' : loan.status;
  cashMovements.unshift({ id: `cash-${Date.now()}`, date: today, type: 'pago', description: `Pago ${loan.id}`, amount, direction: 'entrada' });
  state.receipt = { number: `BOL-2026-${String(Date.now()).slice(-4)}`, person: loan.person, document: people.find((person) => person.id === loan.lenderId)?.document || 'Sin documento', loanAmount: loan.capital, rate: loan.rate, interest: loan.interest, period: loan.months, date: today, total: loan.total, paid: loan.paid, balance: loanBalance(loan), status: loan.status === 'pagado' ? 'Pagado' : 'Parcial', admin: admins.find((admin) => admin.level === state.adminLevel).name };
  receipts.unshift(state.receipt);
  state.panel = 'boleta';
  saveApp();
  render();
}

async function submitCashIncome(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const amount = Number(data.amount);
  const error = form.querySelector('.form-error');
  if (amount <= 0 || !String(data.reason || '').trim()) return showError(error, 'Monto positivo y justificacion son obligatorios.');

  if (state.backendOnline) {
    try {
      await api('/cash/income', {
        method: 'POST',
        body: { amountCents: solesToCents(amount), reason: data.reason }
      });
      state.panel = null;
      state.activeView = 'caja';
      await syncFromBackend();
      return;
    } catch (backendError) {
      return showError(error, backendError.message);
    }
  }

  cashMovements.unshift({ id: `cash-${Date.now()}`, date: today, type: 'ingreso', description: data.reason, amount, direction: 'entrada' });
  state.panel = null;
  state.activeView = 'caja';
  saveApp();
  render();
}

async function submitCashClose(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const expected = totals().cash;
  const counted = Number(data.counted);
  const difference = Number((counted - expected).toFixed(2));
  const error = form.querySelector('.form-error');
  if (difference !== 0 && !String(data.reason || '').trim()) return showError(error, 'La diferencia requiere observacion obligatoria.');

  if (state.backendOnline) {
    try {
      await api('/cash/close', {
        method: 'POST',
        body: {
          countedCents: solesToCents(counted),
          range: data.range,
          reason: data.reason
        }
      });
      state.panel = null;
      state.activeView = 'caja';
      await syncFromBackend();
      return;
    } catch (backendError) {
      return showError(error, backendError.message);
    }
  }

  cashClosures.unshift({ id: `close-${Date.now()}`, date: today, range: data.range, expected, counted, difference, reason: data.reason || 'Sin diferencia' });
  state.panel = null;
  state.activeView = 'caja';
  saveApp();
  render();
}

async function submitReversePayment(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const error = form.querySelector('.form-error');
  if (!String(data.reason || '').trim()) return showError(error, 'El motivo es obligatorio.');
  if (!state.backendOnline) return showError(error, 'Disponible solo con backend real.');
  try {
    await api('/payments/reverse', {
      method: 'POST',
      body: {
        paymentId: state.targetPaymentId,
        reason: data.reason
      }
    });
    state.panel = null;
    state.targetPaymentId = '';
    state.activeView = 'pagos';
    await syncFromBackend();
  } catch (backendError) {
    showError(error, backendError.message);
  }
}

async function submitVoidLoan(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const error = form.querySelector('.form-error');
  if (!String(data.reason || '').trim()) return showError(error, 'El motivo es obligatorio.');
  if (!state.backendOnline) return showError(error, 'Disponible solo con backend real.');
  try {
    await api('/loans/void', {
      method: 'POST',
      body: {
        loanId: state.targetLoanId,
        reason: data.reason
      }
    });
    state.panel = null;
    state.targetLoanId = '';
    state.activeView = 'prestamos';
    await syncFromBackend();
  } catch (backendError) {
    showError(error, backendError.message);
  }
}

function showError(error, message) {
  error.hidden = false;
  error.textContent = message;
}

async function printCurrentReceipt() {
  if (state.backendOnline && state.receipt?.id) {
    try {
      await api('/receipts/print', {
        method: 'POST',
        body: { receiptId: state.receipt.id, reason: 'Impresion solicitada desde dashboard' }
      });
      toast('Boleta registrada para impresion');
    } catch (error) {
      toast(error.message);
      return;
    }
  }
  window.print();
}

loadApp();
render();
initializeAuth();
