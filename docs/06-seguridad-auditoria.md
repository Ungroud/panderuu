# Seguridad y auditoria

## Riesgos principales

- Manipulacion de caja.
- Registro falso de pagos.
- Cambio retroactivo de prestamos.
- Usuarios con permisos excesivos.
- Exposicion de DNI, RUC, celular, direccion, audios y reportes.
- Reimpresiones no controladas.
- Backups incompletos o sin proteccion.
- Perdida del equipo local.

## Controles minimos

- Autenticacion obligatoria.
- Usuarios individuales.
- Hash seguro de contrasenas.
- Conteo de intentos fallidos; el bloqueo automatico queda reservado para la siguiente iteracion.
- Sesion con expiracion.
- Permisos verificados en backend.
- Auditoria de acciones exitosas y fallidas.
- Confirmacion para acciones irreversibles.
- Motivo obligatorio en acciones criticas.
- Backups automaticos y manuales.
- Reversas en vez de borrados.

## Estado implementado en backend v1

- Login con usuario y clave.
- Hash de clave con `scrypt`.
- Sesiones persistidas con hash del token, no con token plano.
- Token Bearer para rutas reales.
- Logout con revocacion de sesion.
- Cambio de clave con validacion de clave actual.
- Auditoria de login exitoso, login fallido, logout y cambio de clave.
- Header `x-actor-id` limitado a desarrollo local con `PANDERUU_DEV_AUTH=1`.

## Acciones criticas

Requieren motivo:

- Anular prestamo.
- Reversar pago.
- Ajustar caja.
- Reimprimir boleta.
- Cambiar tasa fuera de base.
- Autorizar prestamo mayor al limite.
- Cambiar permisos.
- Restaurar backup.
- Bloquear o desbloquear usuario.

## Auditoria

Auditar:

- Login y logout.
- Intentos fallidos.
- Usuarios, roles y permisos.
- Personas creadas o editadas.
- Prestamos creados, aprobados, desembolsados, anulados o refinanciados.
- Pagos registrados o reversados.
- Caja: entradas, salidas, ajustes y cierres.
- Boletas: emision, impresion y reimpresion.
- Reportes exportados.
- Backups y restauraciones.
- Audios grabados, reproducidos o eliminados logicamente.

Campos:

- `audit_id`.
- `fecha`.
- `usuario_id`.
- `rol_nivel`.
- `accion`.
- `entidad_tipo`.
- `entidad_id`.
- `antes_json`.
- `despues_json`.
- `motivo`.
- `resultado`.
- `operation_id`.

## Backups

Reglas:

- Backup automatico diario.
- Backup manual solo por rol autorizado.
- Backup antes de restaurar.
- Mantener varias versiones.
- Verificar integridad.
- Incluir base de datos, audios y boletas.
- Registrar backup en auditoria.

## Datos personales

El sistema almacena datos sensibles:

- DNI.
- RUC.
- Celular.
- Correo.
- Direccion.
- Historial crediticio.
- Audios.
- Boletas.

Reglas:

- Mostrar solo lo necesario por pantalla.
- Evitar exportaciones sin permiso.
- Registrar toda exportacion.
- Controlar acceso a audios.
- No compartir cuentas.

## Politica de impresiones

- Cada boleta tiene correlativo unico.
- La impresion queda registrada.
- La reimpresion exige motivo.
- El preview debe coincidir con lo impreso.
- Los reportes de caja tambien se registran al imprimir.

## Vulnerabilidades de proceso

Puntos a controlar:

- Prestamo autorizado y pago registrado por la misma persona sin revision.
- Cambio de tasa sin motivo.
- Prestamo sobre caja insuficiente.
- Pago parcial mal distribuido.
- Mora eliminada sin evidencia.
- Caja cerrada con diferencia sin observacion.
- Restauracion que pisa informacion reciente.
