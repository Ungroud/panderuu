import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { DEFAULT_TEMPORARY_PASSWORD, hashPassword } from './auth.mjs';

export const defaultPath = '.data/backend/panderuu.json';

export function seedState() {
  const createdAt = new Date().toISOString();
  return {
    version: 6,
    actors: [
      seedActor('admin-seed', 'Admin Semilla', 3, 'admin.seed', true, createdAt),
      seedActor('admin-caja', 'Caja Nivel 2', 2, 'caja.nivel2', false, createdAt),
      seedActor('admin-reportes', 'Informes Nivel 1', 1, 'reportes.nivel1', false, createdAt)
    ],
    people: [
      {
        id: 'person-demo-new',
        type: 'natural',
        name: 'Cliente Demo Nuevo',
        document: 'DNI 70000001',
        phone: '999111222',
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
        phone: '999333444',
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
    auditEvents: [],
    sessions: []
  };
}

function seedActor(id, name, adminLevel, username, seedAdmin, createdAt) {
  return {
    id,
    name,
    adminLevel,
    seedAdmin,
    personId: null,
    createdBy: seedAdmin ? 'system' : 'admin-seed',
    createdAt,
    status: 'activo',
    username,
    passwordHash: hashPassword(DEFAULT_TEMPORARY_PASSWORD),
    mustChangePassword: true,
    failedLoginCount: 0,
    lastLoginAt: '',
    lockedUntil: ''
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
