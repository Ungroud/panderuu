# Backend real v1

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

Regla aplicada para autenticacion:

```text
Las claves no se guardan en texto plano. Cada clave se almacena como hash scrypt; las sesiones se guardan como hash SHA-256 del token; las rutas reales usan Authorization: Bearer <token>. El header x-actor-id queda solo para desarrollo local cuando PANDERUU_DEV_AUTH=1.
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

Administradores:

```text
Solo nivel 3 puede crear administradores.
El administrador creado queda vinculado a una persona con rol Administrador.
El nivel permitido es 1, 2 o 3.
El administrador puede incluir rol Prestamista si tambien podra recibir prestamos.
```

Personas:

```text
Nombre obligatorio sin numeros.
Persona natural usa DNI de 8 digitos.
Empresa usa RUC de 11 digitos.
Celular obligatorio de 9 digitos.
Direccion obligatoria.
Correo opcional, pero si existe debe tener formato valido.
Documento o correo no pueden repetirse.
Para recibir prestamos debe tener rol Prestamista.
Roles permitidos: Administrador, Prestamista, Asociado.
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

Cuotas:

```text
Cada prestamo genera cuotas automaticamente.
La cantidad de cuotas es la indicada en el prestamo o, si no existe, la cantidad de meses.
Capital e interes se distribuyen en centimos sin perder saldo.
Los pagos se aplican desde la cuota mas antigua pendiente.
Un pago puede cerrar una o varias cuotas.
Los estados de cuota se refrescan segun fecha actual: pendiente, prioritaria, parcial, pagada, vencida o anulada.
```

Mora:

```text
La mora diaria es 0.1% del capital prestado.
S/ 1000 de capital generan S/ 1 de mora por dia completo atrasado.
La mora se cuenta por dias completos de 24 horas despues del vencimiento.
Cuando una cuota tiene mora, el prestamista queda como evaluado.
Los pagos pueden cubrir capital, interes y mora acumulada.
```

Auditoria:

```text
Las acciones exitosas y fallidas se registran en auditEvents.
Se registra actor, nivel, accion, entidad, resultado y detalles.
```

Autenticacion:

```text
El login crea una sesion persistida con vencimiento.
El token real solo se entrega al iniciar sesion y no se guarda en la base.
El cierre de sesion revoca la sesion.
El cambio de clave exige clave actual y revoca otras sesiones del mismo actor.
Las claves temporales deben cambiarse antes de operar en produccion.
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
| POST | `/auth/login` | Inicia sesion y devuelve token Bearer. |
| GET | `/auth/me` | Devuelve el administrador autenticado. |
| POST | `/auth/change-password` | Cambia clave del administrador autenticado. |
| POST | `/auth/logout` | Revoca la sesion actual. |
| GET | `/dashboard` | Devuelve resumen de caja, prestamos, pagos y boletas. |
| GET | `/admins` | Devuelve administradores y persona vinculada cuando existe. |
| GET | `/people` | Devuelve todas las personas registradas. |
| GET | `/people/profile?id=...` | Devuelve perfil con prestamos, cuotas, pagos y boletas. |
| GET | `/borrowers` | Devuelve personas con rol Prestamista. |
| GET | `/associates` | Devuelve personas con rol Asociado. |
| GET | `/state` | Devuelve el estado completo para depuracion local. |
| GET | `/quotas` | Devuelve cuotas con estados actualizados por fecha. |
| POST | `/admins` | Crea administradores; requiere nivel 3. |
| POST | `/people` | Crea prestamistas/asociados. |
| POST | `/loans` | Crea prestamos y descuenta caja. |
| POST | `/payments` | Registra pagos, genera caja y boleta. |
| POST | `/cash/income` | Ingresa dinero justificado a caja. |
| POST | `/cash/close` | Registra cierre/conteo de caja. |

## Usuarios semilla

El backend inicia con actores de prueba y clave temporal local:

| Id | Usuario | Nivel | Uso |
|---|---|---:|---|
| `admin-seed` | `admin.seed` | 3 | Administrador semilla. |
| `admin-caja` | `caja.nivel2` | 2 | Operacion de caja y prestamos. |
| `admin-reportes` | `reportes.nivel1` | 1 | Usuario para probar bloqueos de permisos. |

Clave temporal de desarrollo:

```text
Panderuu123!
```

Ejemplo de login:

```powershell
Invoke-RestMethod -Method POST http://localhost:5180/auth/login -ContentType 'application/json' -Body '{"username":"admin.seed","password":"Panderuu123!"}'
```

Para llamar la API real se usa el token:

```text
Authorization: Bearer <token>
```

En desarrollo local, el script `npm run backend:dev` activa `PANDERUU_DEV_AUTH=1`. Con ese modo se puede usar el header de prueba:

```text
x-actor-id: admin-caja
```

Si no se manda header ni token en modo desarrollo, el backend usa:

```text
admin-seed
```

Este comportamiento no debe usarse para produccion.

## Pendiente antes de avanzar

Regla ya aprobada y aplicada:

```text
Toda operacion financiera real debera escribirse en SQLite dentro de una transaccion atomica. Si una parte falla, no se guarda ningun cambio parcial.
```

Falta aprobar la instalacion/configuracion de Rust y Tauri cuando se quiera convertir esto en software de escritorio definitivo.
