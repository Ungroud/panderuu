# Subagentes de desarrollo

## Objetivo

Dividir el desarrollo de Panderuu en areas independientes, con responsables claros, scripts de entrada y criterios de aceptacion. Cada subagente debe trabajar sobre el MD principal y la carpeta `docs/`, sin romper reglas de caja, permisos, auditoria ni datos sensibles.

## Subagentes

| Subagente | Alcance | Entregables principales |
|---|---|---|
| Frontend/UI | React, dashboard, formularios, perfiles, boletas y diseno. | `src/`, componentes, mocks, CSS de pantalla e impresion. |
| Backend/DB | Tauri/Rust, SQLite, permisos, caja, prestamos, pagos y auditoria. | `src-tauri/`, migraciones, servicios, comandos Tauri, pruebas. |
| DevOps/Scripts | Scripts Windows, npm entrypoints, bootstrap, build, DB, backup y release. | `scripts/`, `package.json`, `.env.example`, gates de desarrollo. |
| QA/Seguridad | Matriz de pruebas, permisos, caja, datos personales, backups y release gates. | Tests, criterios de bloqueo, reportes QA y verificadores. |

## Flujo de trabajo por fases

1. `v0.2 Base tecnica`
   - DevOps crea bootstrap, estructura, scripts y status.
   - Backend crea Tauri/Rust, SQLite y migraciones vacias/base.
   - Frontend crea Vite/React y layout base.
   - QA define gate minimo.

2. `v0.3 Usuarios y permisos`
   - Backend implementa admin semilla, roles y permisos.
   - Frontend implementa login, guards y alertas.
   - QA bloquea cualquier permiso sensible solo validado por UI.

3. `v0.4 Personas`
   - Backend implementa personas, roles acumulables y validaciones.
   - Frontend implementa formularios y perfiles.
   - QA prueba duplicados, DNI, RUC, correo, celular y direccion.

4. `v0.5 Prestamos`
   - Backend implementa reglas de S/ 150, tasas 2/5/10, cuotas y caja.
   - Frontend implementa formulario de prestamo y cronograma.
   - QA valida calculos, estados, caja insuficiente y auditoria.

5. `v0.6 Pagos`
   - Backend implementa pagos de una o varias cuotas y detalles contables.
   - Frontend implementa `PaymentForm` y prioridad de pagos.
   - QA valida pagos parciales, caja, cuota y mora.

6. `v0.7 Caja`
   - Backend implementa movimientos y cierre/conteo final.
   - Frontend implementa vista de caja y reporte de cierre.
   - QA valida conciliacion desde movimientos.

7. `v0.8 Boletas y reportes`
   - Backend implementa correlativos, estados e impresiones.
   - Frontend implementa preview imprimible.
   - QA valida reimpresion con motivo y campos minimos.

8. `v0.9 Seguridad y respaldo`
   - Backend implementa backup/restore y auditoria completa.
   - DevOps integra backup y release gate.
   - QA prueba restore real con DB, audios y boletas.

9. `v1.0 Operativa`
   - Todos ejecutan `npm run verify`.
   - DevOps prepara build/release.
   - QA emite verdict final.

## Scripts por area

| Script | Responsable | Uso |
|---|---|---|
| `npm run agents` | DevOps | Ver subagentes y documentos. |
| `npm run bootstrap` | DevOps | Preparar estructura local y herramientas. |
| `npm run status` | DevOps | Ver estado de repo, docs y estructura. |
| `npm run dev` | Frontend/Backend | Arrancar app cuando exista scaffold. |
| `npm run lint` | Todos | Validar docs y codigo disponible. |
| `npm run test` | QA/Backend/Frontend | Ejecutar pruebas disponibles. |
| `npm run check` | Todos | Gate rapido: status, lint y test. |
| `npm run verify` | QA | Gate integral: status, lint, test y migraciones dry-run. |
| `npm run db:migrate` | Backend | Ejecutar migraciones por ambiente. |
| `npm run db:reset` | Backend | Recrear DB dev/test con proteccion. |
| `npm run db:seed` | Backend | Cargar datos demo seguros. |
| `npm run backup` | DevOps/Backend | Crear respaldo local de runtime. |
| `npm run build` | Frontend/DevOps | Compilar app web/Tauri. |
| `npm run release` | DevOps/QA | Gate final y tag opcional. |

## Reglas de coordinacion

- Ningun subagente debe revertir trabajo ajeno.
- Cambios de backend y DB deben mantener migraciones versionadas.
- Cambios de UI no pueden sustituir validaciones backend.
- Cambios de caja, pagos, prestamos o boletas deben agregar auditoria.
- Cambios de permisos deben incluir prueba de permiso denegado.
- Cambios de scripts deben mantener compatibilidad Windows/PowerShell.
- Datos demo no deben usar personas reales.

## Criterio de completitud

Una fase se considera lista cuando:

- Sus entregables existen en el repo.
- `npm run status` no reporta docs faltantes.
- `npm run lint` pasa.
- Las pruebas disponibles pasan.
- QA no tiene hallazgos bloqueantes para el alcance de la fase.

