# Backend real v0

## Objetivo

Construir Panderuu desde lo basico: primero reglas de negocio reales en backend, luego almacenamiento definitivo, interfaz conectada, impresiones y escritorio.

Esta version usa Node.js sin dependencias externas y guarda datos en SQLite:

```text
.data/backend/panderuu.db
```

Esto permite probar reglas, permisos, caja, prestamos y pagos antes de instalar Rust o Tauri.

## Regla de implementacion actual

Regla aprobada para almacenamiento:

```text
El almacenamiento definitivo se hara en SQLite con migraciones versionadas; toda escritura financiera debe ocurrir en una transaccion atomica que incluya la entidad principal, el movimiento de caja y la auditoria.
```

Implementacion actual:

```text
El backend usa node:sqlite, migraciones internas y transacciones BEGIN IMMEDIATE / COMMIT / ROLLBACK.
```

## Reglas codificadas

Permisos:

```text
Nivel 1: puede consultar y emitir reportes/boletas cuando exista el modulo.
Nivel 2: puede crear personas, autorizar prestamos, registrar pagos, ingresar dinero a caja y cerrar caja.
Nivel 3: hereda nivel 2 y queda reservado para administradores, configuracion y control total.
```

Si un usuario intenta una accion superior a su nivel:

```text
permisos no autorizados
```

Personas:

```text
Nombre obligatorio sin numeros.
Documento obligatorio.
Celular obligatorio.
Direccion obligatoria.
Correo opcional, pero si existe debe contener @.
Documento o correo no pueden repetirse.
Para recibir prestamos debe tener rol Prestamista.
```

Caja:

```text
La caja es unica.
El saldo se calcula por movimientos de entrada y salida.
No se guarda dinero con decimales; todo monto se guarda como entero en centimos.
Todo ingreso manual requiere justificacion.
Todo cierre con diferencia requiere observacion.
```

Prestamos:

```text
Solo administrador nivel 2 o superior puede crear prestamos.
El prestamista nuevo o sin mas de dos prestamos puntuales solo puede recibir S/ 150.
La tasa permitida debe ser 2%, 5% o 10%.
La tasa base documentada es 5%.
No se puede desembolsar si la caja no tiene saldo suficiente.
El desembolso genera salida de caja y auditoria.
```

Pagos:

```text
Solo administrador nivel 2 o superior puede registrar pagos.
El pago debe ser positivo.
No se puede pagar un prestamo anulado.
El pago genera entrada de caja.
El pago genera boleta interna con correlativo.
Si el pago completa el total, el prestamo queda pagado.
```

Auditoria:

```text
Las acciones exitosas y fallidas se registran en auditEvents.
Se registra actor, nivel, accion, entidad, resultado y detalles.
```

## API local

Servidor:

```text
http://localhost:5180
```

Comandos:

```text
npm run backend:dev
npm run backend:test
npm run db:migrate
```

Endpoints:

| Metodo | Ruta | Uso |
|---|---|---|
| GET | `/health` | Verifica que el backend este vivo. |
| GET | `/dashboard` | Devuelve resumen de caja, prestamos, pagos y boletas. |
| GET | `/state` | Devuelve el estado completo para depuracion local. |
| POST | `/people` | Crea prestamistas/asociados. |
| POST | `/loans` | Crea prestamos y descuenta caja. |
| POST | `/payments` | Registra pagos, genera caja y boleta. |
| POST | `/cash/income` | Ingresa dinero justificado a caja. |
| POST | `/cash/close` | Registra cierre/conteo de caja. |

## Usuarios semilla

El backend inicia con actores de prueba:

| Id | Nivel | Uso |
|---|---:|---|
| `admin-seed` | 3 | Administrador semilla. |
| `admin-caja` | 2 | Operacion de caja y prestamos. |
| `admin-reportes` | 1 | Usuario para probar bloqueos de permisos. |

Para llamar la API se puede usar el header:

```text
x-actor-id: admin-caja
```

Si no se manda header, el backend usa:

```text
admin-seed
```

## Pendiente antes de avanzar

Regla ya aprobada y aplicada:

```text
Toda operacion financiera real debera escribirse en SQLite dentro de una transaccion atomica. Si una parte falla, no se guarda ningun cambio parcial.
```

Falta aprobar la instalacion/configuracion de Rust y Tauri cuando se quiera convertir esto en software de escritorio definitivo.
