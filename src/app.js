const today = '2026-06-26';

const admins = [
  { name: 'Admin Semilla', level: 3 },
  { name: 'Caja Nivel 2', level: 2 },
  { name: 'Informes Nivel 1', level: 1 }
];

const people = [
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

const loans = [
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

const payments = [
  { id: 'pay-1', person: 'Cliente En Evaluacion', loanId: 'L-0003', amount: 82.5, due: '2026-06-20', status: 'vencida', installments: 1 },
  { id: 'pay-2', person: 'Cliente Demo Nuevo', loanId: 'L-0001', amount: 157.5, due: today, status: 'prioritaria', installments: 1 },
  { id: 'pay-3', person: 'Empresa Demo Asociada', loanId: 'L-0002', amount: 210, due: '2026-06-28', status: 'pendiente', installments: 1 }
];

const cashMovements = [
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
  selectedPersonId: 'p-001',
  panel: null,
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

function render() {
  const t = totals();
  const selectedPerson = people.find((person) => person.id === state.selectedPersonId) || people[0];
  const selectedLoans = loans.filter((loan) => loan.lenderId === selectedPerson.id);
  const app = document.querySelector('#app');

  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">P</div>
          <div><strong>Panderuu</strong><span>Gestion local</span></div>
        </div>
        <nav>
          ${navButton('Dashboard', 'dashboard', true)}
          ${navButton('Prestamistas', 'users')}
          ${navButton('Asociados', 'users')}
          ${navButton('Prestamos', 'loan')}
          ${navButton('Pagos', 'receipt')}
          ${navButton('Caja', 'wallet')}
          ${navButton('Boletas', 'printer')}
          ${navButton('Reportes', 'chart')}
        </nav>
      </aside>

      <main class="workspace">
        <header class="topbar">
          <div>
            <p class="eyebrow">Dashboard</p>
            <h1>Control general de caja y prestamos</h1>
          </div>
          <div class="topbar-actions">
            <label class="search-box">${icons.dashboard}<input placeholder="Buscar persona, prestamo o boleta"></label>
            <label class="admin-level">${icons.shield}
              <select id="adminLevel">
                ${admins.map((admin) => `<option value="${admin.level}" ${admin.level === state.adminLevel ? 'selected' : ''}>Admin nivel ${admin.level}</option>`).join('')}
              </select>
            </label>
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
          ${actionButton('Informe impreso', 'printer', 'boleta')}
        </section>

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
        </section>
      </main>
    </div>
    ${state.panel ? drawer(state.panel) : ''}
  `;

  bindEvents();
}

function navButton(label, icon, active = false) {
  return `<button class="nav-item ${active ? 'active' : ''}" type="button">${icons[icon]}<span>${label}</span></button>`;
}

function metric(label, value, meta, icon, tone) {
  return `<article class="metric-card ${tone}"><div class="metric-icon">${icons[icon]}</div><div><span>${label}</span><strong>${value}</strong><small>${meta}</small></div></article>`;
}

function actionButton(label, icon, action) {
  return `<button class="action-button" type="button" data-action="${action}">${icons[icon]}<span>${label}</span></button>`;
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
  const title = { prestamista: 'Agregar prestamista', asociado: 'Agregar asociado', prestamo: 'Crear prestamo', pago: 'Registrar pago', boleta: 'Vista previa de boleta' }[panel];
  const body = { prestamista: personForm('prestamista'), asociado: personForm('asociado'), prestamo: loanForm(), pago: paymentForm(), boleta: receiptPreview() }[panel];
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
    <label>Prestamo<select name="loan">${loans.filter((loan) => loan.status !== 'pagado').map((loan) => `<option value="${loan.id}">${loan.id} - ${loan.person}</option>`).join('')}</select></label>
    <label>Monto recibido<input name="amount" type="number" value="157.5" min="1"></label>
    <label>Cuotas a cerrar<input name="installments" type="number" value="1" min="1"></label>
    <div class="calc-box">El pago aumenta caja unica y genera boleta. En backend se separara capital, interes y mora.</div>
    <p class="form-error" hidden></p>
    <button class="primary-button" type="submit">${icons.receipt} Registrar pago y generar boleta</button>
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
    render();
  });

  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.getAttribute('data-action');
      const permission = action === 'boleta' ? 'report' : action === 'prestamista' || action === 'asociado' ? 'people' : 'loan';
      requirePermission(permission, action);
    });
  });

  document.querySelectorAll('[data-person]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedPersonId = button.getAttribute('data-person');
      render();
    });
  });

  document.querySelector('#closeDrawer')?.addEventListener('click', () => {
    state.panel = null;
    render();
  });

  document.querySelector('#printReceipt')?.addEventListener('click', () => window.print());
  document.querySelector('#personForm')?.addEventListener('submit', submitPerson);
  document.querySelector('#loanForm')?.addEventListener('input', updateLoanCalc);
  document.querySelector('#loanForm')?.addEventListener('submit', submitLoan);
  document.querySelector('#paymentForm')?.addEventListener('submit', submitPayment);
}

function submitPerson(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const error = form.querySelector('.form-error');
  if (!data.name || /\d/.test(data.name)) return showError(error, 'El nombre es obligatorio y no debe contener numeros.');
  if (!data.document || !data.phone || !data.address) return showError(error, 'Documento, celular y direccion son obligatorios.');
  if (data.email && !String(data.email).includes('@')) return showError(error, 'Correo invalido.');

  const kind = form.getAttribute('data-kind');
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

function submitLoan(event) {
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

  const interest = Number((capital * (rate / 100)).toFixed(2));
  const total = capital + interest;
  const id = `L-${String(loans.length + 1).padStart(4, '0')}`;
  loans.unshift({ id, lenderId: lender.id, person: lender.name, capital, rate, interest, total, months, installments, paid: 0, nextDue: today, status: lender.credit === 'evaluado' ? 'evaluado' : 'activo', admin: admins.find((admin) => admin.level === state.adminLevel).name });
  payments.unshift({ id: `pay-${Date.now()}`, person: lender.name, loanId: id, amount: total / installments, due: today, status: 'prioritaria', installments });
  cashMovements.unshift({ id: `cash-${Date.now()}`, date: today, type: 'prestamo', description: `Desembolso ${id}`, amount: capital, direction: 'salida' });
  state.receipt = { number: `BOL-2026-${String(loans.length + 1).padStart(4, '0')}`, person: lender.name, document: lender.document, loanAmount: capital, rate, interest, period: months, date: today, total, paid: 0, balance: total, status: 'Pendiente', admin: admins.find((admin) => admin.level === state.adminLevel).name };
  state.panel = null;
  render();
}

function submitPayment(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const loan = loans.find((item) => item.id === data.loan);
  const amount = Number(data.amount);
  const error = form.querySelector('.form-error');
  if (!loan || amount <= 0) return showError(error, 'Selecciona un prestamo y registra monto positivo.');

  loan.paid = Math.min(loan.total, loan.paid + amount);
  loan.status = loan.paid >= loan.total ? 'pagado' : loan.status;
  cashMovements.unshift({ id: `cash-${Date.now()}`, date: today, type: 'pago', description: `Pago ${loan.id}`, amount, direction: 'entrada' });
  state.receipt = { number: `BOL-2026-${String(Date.now()).slice(-4)}`, person: loan.person, document: people.find((person) => person.id === loan.lenderId)?.document || 'Sin documento', loanAmount: loan.capital, rate: loan.rate, interest: loan.interest, period: loan.months, date: today, total: loan.total, paid: loan.paid, balance: loanBalance(loan), status: loan.status === 'pagado' ? 'Pagado' : 'Parcial', admin: admins.find((admin) => admin.level === state.adminLevel).name };
  state.panel = 'boleta';
  render();
}

function showError(error, message) {
  error.hidden = false;
  error.textContent = message;
}

render();

