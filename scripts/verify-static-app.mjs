import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const requiredFiles = ['src/index.html', 'src/app.js', 'src/styles.css'];
const requiredText = [
  'Control general de caja y prestamos',
  'permisos no autorizados',
  'Agregar prestamista',
  'Agregar asociado',
  'Crear prestamo',
  'Registrar pago',
  'Vista previa de boleta',
  'Boleta de pago',
  'S/ 150'
];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    console.error(`[fail] Missing ${file}`);
    process.exit(1);
  }
}

const app = await readFile('src/app.js', 'utf8');
const html = await readFile('src/index.html', 'utf8');
const css = await readFile('src/styles.css', 'utf8');
const combined = `${html}\n${app}\n${css}`;

for (const text of requiredText) {
  if (!combined.includes(text)) {
    console.error(`[fail] Missing required text: ${text}`);
    process.exit(1);
  }
}

if (/Joseline|Jordan|Roger|Paolo|Daniela|Gianela|Andrea/.test(combined)) {
  console.error('[fail] Found personal names from the old document.');
  process.exit(1);
}

const syntax = spawnSync(process.execPath, ['--check', 'src/app.js'], { encoding: 'utf8' });
if (syntax.status !== 0) {
  console.error(syntax.stderr || syntax.stdout);
  process.exit(syntax.status || 1);
}

console.log('[ok] Static app verified');
