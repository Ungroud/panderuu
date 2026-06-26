# Subagente DevOps/Scripts

## Mision

Mantener una superficie unica de comandos para desarrollo local Windows. `npm` es la entrada del equipo y PowerShell ejecuta la logica real.

## Alcance

- `package.json`.
- Scripts PowerShell.
- Estado del proyecto.
- Bootstrap local.
- Migraciones.
- Backups.
- Build y release.

## Scripts obligatorios

```text
scripts/agents.ps1
scripts/bootstrap.ps1
scripts/status.ps1
scripts/lint.ps1
scripts/test.ps1
scripts/check.ps1
scripts/verify.ps1
scripts/dev.ps1
scripts/build.ps1
scripts/format.ps1
scripts/db-migrate.ps1
scripts/db-reset.ps1
scripts/db-seed.ps1
scripts/backup.ps1
scripts/release.ps1
scripts/lib/Panderuu.Dev.psm1
```

## Comportamiento esperado

- `bootstrap`: valida herramientas y crea carpetas locales.
- `status`: muestra repo, docs, estructura y ultimo commit.
- `lint`: valida documentacion, ASCII y ausencia de datos personales del MD anterior.
- `test`: ejecuta lint y pruebas disponibles.
- `verify`: gate integral local.
- `db:migrate`: corre migraciones por ambiente.
- `db:reset`: recrea DB dev/test con proteccion.
- `db:seed`: carga datos demo seguros.
- `backup`: comprime datos runtime disponibles.
- `release`: exige gate limpio antes de tag/build.

## Criterios de aceptacion

- Scripts fallan con codigo no cero ante errores reales.
- Produccion no se migra ni resetea sin confirmacion explicita.
- No hay borrados destructivos silenciosos.
- Los scripts funcionan en PowerShell de Windows.
- Los comandos npm cubren el flujo del equipo.

