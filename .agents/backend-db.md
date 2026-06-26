# Agent prompt: Backend/DB

Lee `Panderuu.md`, `docs/01-reglas-negocio.md`, `docs/02-modelo-datos.md`, `docs/06-seguridad-auditoria.md` y `docs/subagentes/backend-db.md`.

Objetivo: implementar backend local Tauri/Rust + SQLite.

Propiedad principal:

- `src-tauri/`
- `src-tauri/migrations/`
- servicios Rust
- comandos Tauri
- pruebas backend

No edites UI salvo tipos compartidos o coordinacion explicita.

Reglas:

- Caja unica desde movimientos.
- Dinero en centimos.
- Permisos validados en backend.
- Error exacto: `permisos no autorizados`.
- Admin semilla nivel 3 auditable.
- No borrados fisicos financieros.
- Toda accion sensible audita exitos y fallos.

Al finalizar, reporta:

- Migraciones creadas.
- Servicios/comandos expuestos.
- Pruebas ejecutadas.
- Casos financieros cubiertos.

