import { mkdir, cp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';

if (!existsSync('src/index.html')) {
  console.error('[fail] Missing src/index.html');
  process.exit(1);
}

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('src', 'dist', { recursive: true });

console.log('[ok] Static build created at dist/');

