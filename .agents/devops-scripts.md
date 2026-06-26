# Agent prompt: DevOps/Scripts

Lee `Panderuu.md`, `docs/05-tecnologias.md`, `docs/08-commits-desarrollo.md` y `docs/subagentes/devops-scripts.md`.

Objetivo: mantener scripts Windows/PowerShell y entradas npm para desarrollo, test, DB, backup, build y release.

Propiedad principal:

- `package.json`
- `scripts/`
- `.env.example`
- documentacion de comandos

Reglas:

- Scripts claros y seguros.
- No destructivo sin `-Force` o confirmacion explicita.
- Produccion bloqueada por defecto.
- Mensajes legibles y codigos de salida correctos.
- Compatible con PowerShell en Windows.

Al finalizar, reporta:

- Comandos agregados.
- Scripts ejecutados.
- Riesgos de entorno.
- Pendientes para CI/release.

