# Versiones y features

## v0.1 - Documentacion base

Objetivo:

- Formalizar reglas, modelo, flujos, diseno, tecnologia, seguridad y roadmap.

Features:

- MD principal actualizado.
- Carpeta `docs/`.
- Plan de permisos.
- Reglas de caja unica.
- Reglas de prestamos.
- Modelo de datos inicial.
- Diseno de dashboard y boletas.

## v0.2 - Base tecnica

Objetivo:

- Crear app de escritorio.

Features:

- Tauri v2.
- React + TypeScript + Vite.
- SQLite.
- Migraciones iniciales.
- Layout base.
- Sidebar.
- Tema visual.

## v0.3 - Usuarios y permisos

Objetivo:

- Controlar acceso al software.

Features:

- Administrador semilla nivel 3.
- Login local.
- Roles acumulables.
- Permisos por nivel.
- Bloqueo `"permisos no autorizados"`.
- Auditoria de accesos.

## v0.4 - Personas

Objetivo:

- Registrar prestamistas, asociados y administradores.

Features:

- Formularios con validacion.
- DNI, RUC, correo, celular y direccion.
- Perfil de prestamista.
- Perfil de asociado.
- Perfil de administrador.
- Foto opcional.

## v0.5 - Prestamos

Objetivo:

- Crear y administrar prestamos.

Features:

- Reglas de S/ 150 y 5% base.
- Tasas 2%, 5%, 10%.
- Historial crediticio.
- Estados de prestamo.
- Cronograma de cuotas.
- Desembolso desde caja.

## v0.6 - Pagos y cuotas

Objetivo:

- Registrar pagos y controlar vencimientos.

Features:

- Pago de una o varias cuotas.
- Pagos parciales.
- Estados de cuota.
- Prioridad de pagos del dia.
- Actualizacion de caja.
- Boleta desde pago.

## v0.7 - Caja y cierres

Objetivo:

- Controlar caja unica.

Features:

- Movimientos de caja.
- Ingreso justificado.
- Cierre por dia, semana, mes o rango.
- Informe imprimible.
- Diferencias con observacion.

## v0.8 - Reportes y boletas

Objetivo:

- Entregar informacion imprimible y exportable.

Features:

- Vista previa de boleta.
- Impresion.
- Reimpresion con motivo.
- Reportes de prestamos, pagos, caja e intereses.
- Grafico de intereses por mes.

## v0.9 - Seguridad y respaldo

Objetivo:

- Proteger datos y recuperacion.

Features:

- Backup automatico diario.
- Backup manual.
- Restauracion con permiso nivel 3.
- Auditoria consultable.
- Hash de audios y archivos.

## v1.0 - Primera version operativa

Objetivo:

- Sistema listo para uso controlado.

Features:

- Dashboard completo.
- Roles y permisos.
- Prestamos.
- Pagos.
- Caja.
- Boletas.
- Reportes.
- Auditoria.
- Backups.
- Instalador Windows.
