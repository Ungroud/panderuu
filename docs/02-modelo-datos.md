# Modelo de datos

## Reglas tecnicas

- SQLite sera la base local.
- El dinero se guarda en centimos como enteros.
- Las relaciones usan UUID.
- Los borrados fisicos se evitan; se usan estados y `deleted_at` cuando aplique.
- Todo cambio critico genera auditoria.
- Los saldos se calculan desde movimientos de caja.

## Entidades principales

```text
personas
usuarios
roles
permisos
usuario_roles
rol_permisos
prestamos
cuotas
pagos
pago_detalles
movimientos_caja
cierres_caja
boletas
boleta_impresiones
notas_voz
auditoria_eventos
configuracion_sistema
```

## Estado actual del backend v0

SQLite ya contiene tablas operativas para:

```text
actors
people
loans
loan_installments
payments
payment_applications
cash_movements
cash_closures
receipts
audit_events
schema_migrations
```

El modelo documental completo se mantiene como direccion final; el backend v0 implementa las piezas necesarias para reglas de caja, prestamos, cuotas, pagos y auditoria.

## Personas

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | Identificador. |
| tipo_persona | enum | `natural`, `empresa`. |
| nombres | text | Persona natural. |
| apellidos | text | Persona natural. |
| razon_social | text | Empresa. |
| dni | text | Unico si existe. |
| ruc | text | Unico si existe. |
| celular | text | Requerido para prestamos. |
| correo | text | Validado si existe. |
| direccion | text | Requerida para prestamos. |
| foto_path | text | Opcional. |
| estado | enum | `activo`, `inactivo`, `bloqueado`, `evaluado`. |
| created_by | uuid | Usuario que registro. |
| created_at | datetime | Fecha de registro. |
| updated_at | datetime | Ultima actualizacion. |

## Usuarios

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | Identificador. |
| persona_id | uuid | Relacion con persona. |
| username | text | Unico. |
| password_hash | text | Hash seguro. |
| admin_level | integer | 1, 2 o 3 si es administrador. |
| must_change_password | boolean | Para cuenta semilla o reseteos. |
| estado | enum | `activo`, `bloqueado`, `inactivo`. |
| seed_admin | boolean | Marca cuenta semilla inicial. |
| created_by | uuid | Administrador que creo. |
| created_at | datetime | Registro. |

## Roles y permisos

Roles base:

- `administrador`.
- `prestamista`.
- `asociado`.

Permisos recomendados:

```text
reportes.ver
boletas.emitir
boletas.reimprimir
personas.crear
personas.editar
prestamos.crear
prestamos.autorizar
prestamos.desembolsar
prestamos.anular
pagos.registrar
pagos.reversar
caja.ver
caja.ingresar
caja.cerrar
usuarios.crear
usuarios.editar
roles.editar
configuracion.editar
backups.crear
backups.restaurar
auditoria.ver
```

## Prestamos

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | Identificador. |
| prestamista_id | uuid | Persona que recibe prestamo. |
| autorizado_por | uuid | Administrador nivel 2 o 3. |
| desembolsado_por | uuid | Responsable de caja. |
| capital_centimos | integer | Monto principal. |
| tasa_interes | integer | Puntos base o porcentaje normalizado. |
| interes_centimos | integer | Interes calculado. |
| total_centimos | integer | Capital + interes. |
| numero_cuotas | integer | Mayor que cero. |
| cantidad_meses | integer | Referencia para fechas. |
| fecha_prestamo | date | Fecha de solicitud/registro. |
| fecha_desembolso | date | Fecha de entrega. |
| estado | enum | Ciclo de vida del prestamo. |
| criterio_admin | text | Motivo de excepcion. |
| created_at | datetime | Registro. |

## Cuotas

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | Identificador. |
| prestamo_id | uuid | Relacion. |
| numero | integer | Orden de cuota. |
| fecha_vencimiento | date | Segun cronograma. |
| capital_centimos | integer | Parte capital. |
| interes_centimos | integer | Parte interes. |
| mora_centimos | integer | Mora si aplica. |
| total_centimos | integer | Total de cuota. |
| pagado_centimos | integer | Acumulado pagado. |
| estado | enum | pendiente, prioritaria, parcial, pagada, vencida, anulada. |

En backend v0 esta entidad vive en:

```text
loan_installments
```

Campos actuales:

| Campo | Tipo | Notas |
|---|---|---|
| id | text | Identificador. |
| loan_id | text | Prestamo relacionado. |
| number | integer | Numero de cuota. |
| due_date | text | Fecha `YYYY-MM-DD`. |
| capital_cents | integer | Capital asignado. |
| interest_cents | integer | Interes asignado. |
| mora_cents | integer | Mora, por ahora cero. |
| total_cents | integer | Total de cuota. |
| paid_cents | integer | Pagado acumulado. |
| status | text | Estado de cuota. |
| created_at | text | Fecha de creacion. |

## Pagos y detalles

`pagos` registra la operacion general.

`pago_detalles` registra como se aplica el pago:

- capital.
- interes.
- mora.
- ajuste.

Esto permite que un pago cierre varias cuotas y mantenga clasificacion contable.

En backend v0, la aplicacion de pagos por cuota se guarda en:

```text
payment_applications
```

Cada registro indica pago, prestamo, cuota, monto aplicado y si esa cuota quedo cerrada.

## Movimientos de caja

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | Identificador. |
| fecha | datetime | Fecha del movimiento. |
| direccion | enum | `entrada`, `salida`. |
| tipo | enum | prestamo, pago, interes, mora, ajuste, reversa, ingreso_manual. |
| monto_centimos | integer | Siempre positivo. |
| saldo_resultante_centimos | integer | Saldo luego del movimiento. |
| referencia_tipo | text | prestamo, pago, cierre, ajuste. |
| referencia_id | uuid | Registro relacionado. |
| usuario_id | uuid | Responsable. |
| motivo | text | Obligatorio en movimientos manuales. |

## Boletas

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | Identificador. |
| numero | text | Correlativo unico. |
| tipo | enum | pago, prestamo, cierre, informe. |
| referencia_id | uuid | Pago, prestamo o cierre. |
| emitida_por | uuid | Administrador. |
| fecha_emision | datetime | Fecha. |
| formato | enum | 80mm, 58mm, A5, A4. |
| estado | enum | emitida, impresa, reimpresa, anulada. |
| archivo_path | text | PDF o snapshot si se genera. |

## Notas de voz

Para empenos o mayor evidencia:

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | Identificador. |
| entidad_tipo | text | prestamo, persona, garantia. |
| entidad_id | uuid | Relacion. |
| file_path | text | Archivo local. |
| mime_type | text | Tipo de audio. |
| duration_ms | integer | Duracion. |
| sha256 | text | Integridad. |
| recorded_by | uuid | Usuario. |
| consent_recorded | boolean | Consentimiento. |
| created_at | datetime | Fecha. |
| deleted_at | datetime | Eliminacion logica. |

## Auditoria

Cada evento debe guardar:

- Usuario.
- Rol y nivel al momento de la accion.
- Fecha.
- Accion.
- Entidad.
- ID de entidad.
- Valores antes y despues cuando aplique.
- Motivo.
- Resultado: exitoso o fallido.
- `operation_id` para evitar duplicados.
