# Tecnologias

## Stack recomendado

| Capa | Tecnologia | Motivo |
|---|---|---|
| Escritorio | Tauri v2 | Aplicacion ligera, instalable y local. |
| Frontend | React + TypeScript | UI mantenible y tipada. |
| Build frontend | Vite | Desarrollo rapido. |
| Backend local | Rust | Reglas sensibles de caja, permisos y prestamos. |
| Base de datos | SQLite | Archivo local, offline y portable. |
| Migraciones | SQL versionado con `sqlx` | Evolucion segura del esquema. |
| Formularios | `react-hook-form` | Formularios ergonomicos. |
| Validacion | `zod` | Validacion tipada. |
| Tablas | `@tanstack/react-table` | Tablas densas y flexibles. |
| Graficos | `recharts` | Barras de intereses y metricas. |
| Iconos | `lucide-react` | Iconos SVG consistentes. |
| Exportacion | CSV, Excel, PDF/print | Reportes administrativos. |

## Arquitectura

```text
React UI
  dashboard
  formularios
  tablas
  preview de boleta
  grabacion de audio
        |
Tauri IPC
        |
Rust services
  auth
  roles
  personas
  prestamos
  pagos
  caja
  reportes
  auditoria
  backup
        |
SQLite + archivos locales
  panderuu.db
  audio/
  backups/
  receipts/
```

## Regla de responsabilidad

React:

- Muestra informacion.
- Valida de forma temprana.
- Presenta calculos previos.
- Renderiza vista previa.

Rust:

- Verifica permisos.
- Valida reglas definitivas.
- Calcula saldos definitivos.
- Ejecuta transacciones.
- Escribe auditoria.
- Controla caja y prestamos.

SQLite:

- Guarda datos.
- Enforce constraints.
- Permite reportes historicos.

## Dinero

Todos los montos se guardan como enteros en centimos.

```text
S/ 1.00 = 100
S/ 150.00 = 15000
S/ 7.50 = 750
```

Ventajas:

- Evita errores de decimales.
- Mejora consistencia de cuotas.
- Facilita auditoria.

## Impresion

Implementacion recomendada:

- Componente `ReceiptPreview`.
- CSS `@media print`.
- Formatos: 58mm, 80mm, A5 y A4.
- Boton `Printer` que llama impresion del sistema.
- Registro de impresion y reimpresion.

Riesgo:

- Las impresoras termicas dependen del driver y margenes reales.
- Se debe hacer un spike temprano con la impresora fisica.

## Audio de empeno

Implementacion:

- Captura con `MediaRecorder`.
- Guardar archivo en carpeta local `audio/`.
- Guardar metadata en SQLite.
- Registrar hash `sha256`.
- Incluir audios en backup.

No guardar audios grandes como blobs dentro de SQLite.

## Backups

Backup debe incluir:

- `panderuu.db`.
- Carpeta `audio/`.
- Boletas generadas si se guardan como archivos.
- Configuracion.

Tipos:

- Automatico diario.
- Manual autorizado.
- Backup antes de restaurar.

## Pruebas

- Unitarias Rust para intereses, cuotas, pagos, caja y permisos.
- Integracion con SQLite para transacciones y constraints.
- UI para formularios y dashboard.
- E2E para crear prestamo, registrar pago e imprimir boleta.
- Prueba manual de impresora real.
- Prueba de backup y restauracion.

