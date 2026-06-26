# Subagente Backend/DB

## Mision

Implementar la verdad local de Panderuu en Rust/Tauri + SQLite: permisos, caja unica, prestamos, pagos, boletas, auditoria y backups. React nunca debe escribir SQL directo.

## Alcance

- Proyecto Tauri v2.
- SQLite con migraciones versionadas.
- Servicios Rust por dominio.
- Comandos Tauri tipados.
- Pruebas unitarias e integracion SQLite.

## Servicios esperados

```text
auth_service
permission_service
person_service
loan_service
payment_service
cash_service
receipt_service
audit_service
backup_service
config_service
```

## Migraciones esperadas

```text
src-tauri/migrations/
  0001_core_schema.sql
  0002_financial_schema.sql
  0003_cash_schema.sql
  0004_receipts_audio.sql
  0005_audit_backup_config.sql
  0006_seed_roles_permissions.sql
```

## Scripts usados

- `npm run db:migrate`
- `npm run db:reset`
- `npm run db:seed`
- `npm run test`
- `npm run verify`
- `npm run backup`

## Reglas obligatorias

- Admin semilla nivel 3 auditable.
- Roles acumulables.
- Bloqueo backend con `permisos no autorizados`.
- Caja unica calculada desde movimientos.
- Dinero como enteros en centimos.
- Prestamista nuevo: maximo `15000` centimos y tasa base 5%.
- Tasas permitidas: 2%, 5%, 10%.
- No borrado fisico de prestamos, pagos, caja ni boletas.
- Acciones criticas con motivo.
- Auditoria para acciones exitosas y fallidas.

## Criterios de aceptacion

- Migraciones corren en dev y test.
- Pruebas cubren permisos, prestamos, pagos, caja, boletas y backups.
- No existe SQL sensible expuesto al frontend.
- Cada transaccion financiera escribe movimiento de caja y auditoria.
- Backup incluye DB, audios, boletas y configuracion.

