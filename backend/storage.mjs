import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export const defaultPath = '.data/backend/panderuu.json';

export function seedState() {
  return {
    version: 4,
    actors: [
      { id: 'admin-seed', name: 'Admin Semilla', adminLevel: 3, seedAdmin: true, personId: null, createdBy: 'system', createdAt: new Date().toISOString(), status: 'activo' },
      { id: 'admin-caja', name: 'Caja Nivel 2', adminLevel: 2, personId: null, createdBy: 'admin-seed', createdAt: new Date().toISOString(), status: 'activo' },
      { id: 'admin-reportes', name: 'Informes Nivel 1', adminLevel: 1, personId: null, createdBy: 'admin-seed', createdAt: new Date().toISOString(), status: 'activo' }
    ],
    people: [
      {
        id: 'person-demo-new',
        type: 'natural',
        name: 'Cliente Demo Nuevo',
        document: 'DNI 70000001',
        phone: '999 111 222',
        email: 'cliente.nuevo@example.local',
        address: 'Direccion demo 101',
        roles: ['Prestamista'],
        creditStatus: 'nuevo',
        loansCount: 0,
        punctualLoans: 0,
        registeredBy: 'Admin Semilla',
        createdAt: new Date().toISOString()
      },
      {
        id: 'person-demo-company',
        type: 'empresa',
        name: 'Empresa Demo Asociada',
        document: 'RUC 20000000001',
        phone: '999 333 444',
        email: 'empresa@example.local',
        address: 'Av. Demo 245',
        roles: ['Asociado', 'Prestamista'],
        creditStatus: 'buen_historial',
        loansCount: 3,
        punctualLoans: 3,
        registeredBy: 'Caja Nivel 2',
        createdAt: new Date().toISOString()
      }
    ],
    loans: [],
    quotas: [],
    payments: [],
    paymentApplications: [],
    cashMovements: [
      {
        id: 'cash-seed',
        at: new Date().toISOString(),
        type: 'ingreso',
        description: 'Ingreso inicial demo de caja',
        amountCents: 180000,
        direction: 'entrada',
        referenceType: 'seed',
        referenceId: null,
        actorId: 'admin-seed'
      }
    ],
    cashClosures: [],
    receipts: [],
    auditEvents: []
  };
}

export async function loadState(path = defaultPath) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const state = seedState();
    await saveState(state, path);
    return state;
  }
}

export async function saveState(state, path = defaultPath) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(state, null, 2), 'utf8');
}
