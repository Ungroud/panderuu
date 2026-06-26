# Panderuu - Especificacion actualizada

## 1. Objetivo

Panderuu sera un software de escritorio local para gestion de prestamos, caja unica, pagos, cuotas, perfiles, boletas impresas, roles, permisos y auditoria.

El sistema deja de usar el modelo anterior de junta con aportes mensuales y participantes iniciales. Los datos personales importados del documento anterior no forman parte de esta especificacion. El almacenamiento historico se mantiene como referencia tecnica, pero se adapta a una plantilla escalable de personas, usuarios, roles, prestamos, pagos, caja, boletas y auditoria.

## 2. Principios operativos

- La caja unica es el saldo real de operacion.
- Los intereses, capital, mora, ajustes y pagos se clasifican contablemente, pero no viven en cajas separadas.
- Todo cambio de dinero, deuda, caja, usuario, permiso, impresion o dato sensible debe generar auditoria.
- No se borran fisicamente personas, prestamos, pagos, movimientos ni boletas; se usan anulaciones, reversas o estados inactivos con motivo.
- Los saldos se calculan desde movimientos y no desde totales editables manualmente.
- El frontend puede mostrar calculos previos, pero el backend debe validar y guardar la verdad contable.
- El sistema debe funcionar offline en Windows como aplicacion de escritorio.

## 3. Roles y permisos

### 3.1 Roles acumulables

Una persona puede tener uno o mas roles:

| Rol | Uso |
|---|---|
| Administrador | Usuario interno con acceso al software segun nivel de permiso. |
| Prestamista | Persona habilitada para solicitar o recibir prestamos. |
| Asociado | Persona natural o empresa registrada con datos localizables y RUC cuando aplique. |

Regla de negocio:

- Para recibir un prestamo, la persona debe tener rol `Prestamista`.
- Un administrador tambien puede ser prestamista. Si solicita un prestamo, el sistema registra su rol administrativo y tambien su participacion como prestamista.
- Los asociados pueden ser personas naturales o empresas. Si tambien solicitan prestamos, deben recibir el rol acumulado de prestamista.

### 3.2 Administrador semilla

No existira un correo permanente de administrador.

El primer acceso se resuelve con un administrador semilla de nivel 3:

- Se crea durante la instalacion o primer arranque.
- Debe quedar marcado como cuenta inicial auditable.
- Debe cambiar credenciales en el primer uso.
- Despues de creado, solo administradores nivel 3 pueden crear otros administradores.

### 3.3 Niveles de administrador

| Nivel | Permisos |
|---|---|
| Nivel 1 | Ver dashboard, consultar perfiles, pedir informes y emitir boletas de pago. |
| Nivel 2 | Todo nivel 1, agregar prestamistas y asociados, autorizar prestamos, registrar pagos, ingresar dinero a caja, justificar movimientos y cerrar caja. |
| Nivel 3 | Todo nivel 2, administrar caja principal, configurar reglas, tasas, permisos, usuarios, administradores, backups y parametros generales. |

Si un administrador nivel 1 o 2 intenta ejecutar una accion superior, el sistema debe mostrar la alerta:

```text
permisos no autorizados
```

La UI debe ocultar acciones no permitidas, pero el backend tambien debe bloquear cada comando sensible.

## 4. Personas y perfiles

### 4.1 Datos localizables

Toda persona registrada debe tener datos suficientes para contacto y trazabilidad.

Campos base:

| Campo | Tipo | Requerido | Notas |
|---|---:|---:|---|
| id | uuid | Si | Identificador interno. |
| tipo_persona | enum | Si | `natural`, `empresa`. |
| nombres | string | Condicional | Requerido para persona natural. |
| apellidos | string | Condicional | Requerido para persona natural. |
| razon_social | string | Condicional | Requerido para empresa. |
| dni | string | Condicional | Requerido para persona natural si aplica. |
| ruc | string | Condicional | Requerido para empresa o asociado con RUC. |
| celular | string | Si | Normalizado y validado. |
| correo | string | No | Validado si se registra. |
| direccion | string | Si | Direccion localizable. |
| foto_path | string | No | Foto opcional del perfil. |
| estado | enum | Si | `activo`, `inactivo`, `bloqueado`, `evaluado`. |
| observaciones | text | No | Notas administrativas. |

Debe existir al menos un dato localizable fuerte: celular, correo, direccion, DNI o RUC. Para operar prestamos se recomienda exigir celular y direccion.

### 4.2 Perfil de prestamista

El perfil debe mostrar:

- Datos registrados.
- Roles acumulados.
- Estado crediticio.
- Cantidad de prestamos.
- Prestamos activos, pagados, vencidos y anulados.
- Historial de pagos.
- Cuotas pendientes.
- Boletas emitidas.
- Audios de empeno asociados, si existen.
- Administrador responsable o ultimo administrador que interactuo.

Reglas:

- Personas nuevas solo pueden tener hasta 2 prestamos activos o historicos iniciales bajo limite base, salvo autorizacion de administrador nivel 2 o 3.
- Si desea mayor monto dejando objeto en empeno, el sistema debe almacenar grabacion de voz y datos del objeto.
- La grabacion no aprueba automaticamente el prestamo; solo queda como evidencia para decision administrativa.

### 4.3 Perfil de administrador

El perfil de administrador debe mostrar:

- Datos del usuario.
- Nivel de permiso.
- Historial de personas agregadas.
- Prestamistas y asociados administrados.
- Prestamos que autorizo o registro.
- Pagos que registro.
- Ganancias por intereses diarias, semanales y mensuales segun filtros.
- Prestamos propios si tambien tiene rol prestamista.
- Foto opcional.

## 5. Reglas de prestamos

### 5.1 Ciclo de vida

Estados de prestamo:

| Estado | Significado |
|---|---|
| borrador | Registro incompleto o pendiente de validacion. |
| aprobado | Autorizado por administrador competente. |
| desembolsado | Dinero entregado y descontado de caja. |
| activo | Tiene cuotas pendientes. |
| vencido | Tiene una o mas cuotas vencidas. |
| pagado | Todas las cuotas estan pagadas. |
| evaluado | Requiere decision del administrador por mora o riesgo. |
| refinanciado | Fue reemplazado o reprogramado formalmente. |
| anulado | Cancelado con motivo y sin borrado fisico. |

### 5.2 Limites por historial

| Tipo de prestamista | Regla base |
|---|---|
| Nuevo | Maximo S/ 150, tasa base 5%, modificable por administrador. |
| Sin mas de 2 prestamos pagados a tiempo | Maximo S/ 150, tasa base 5%. |
| Con mora | Estado `evaluado`; monto, tasa y autorizacion quedan a criterio del administrador. |
| Buen historial crediticio | Puede acceder a montos mayores a S/ 150 con tasa base 5%, modificable por administrador. |

Buen historial crediticio significa:

- Mas de dos prestamos pagados a tiempo.
- Sin mora vigente.
- Sin anulaciones criticas recientes.
- Sin observaciones de riesgo bloqueante.

### 5.3 Intereses

Tasas fijas disponibles:

| Tasa | Uso |
|---:|---|
| 2% | Tasa baja autorizada. |
| 5% | Tasa base del programa. |
| 10% | Tasa alta autorizada. |

El administrador puede modificar la tasa aplicada al prestamo cuando tenga permiso para autorizarlo.

Se mantiene el metodo del MD anterior:

- Para prestamos hasta 31 dias, se aplica una tasa configurada sobre el capital.
- Para prestamos mayores a 31 dias, la tasa puede sugerirse segun meses o cuotas, pero el administrador puede editarla.
- El sistema debe mostrar capital, tasa, interes generado, total a pagar y cuotas antes de confirmar.

Formula base:

```text
interes_generado = capital * tasa_interes_total
total_a_pagar = capital + interes_generado
monto_cuota = total_a_pagar / numero_cuotas
```

Ejemplo:

```text
capital = S/ 150
tasa = 5%
interes_generado = S/ 7.50
total_a_pagar = S/ 157.50
```

### 5.4 Cuotas por meses

El sistema de meses ya no es un modulo separado. Los meses solo sirven para calcular o distribuir cuotas.

Campos importantes:

- Fecha de prestamo.
- Cantidad de meses.
- Numero de cuotas.
- Fecha de vencimiento por cuota.
- Capital por cuota.
- Interes por cuota.
- Total por cuota.
- Estado de cuota.

Estados de cuota:

| Estado | Significado |
|---|---|
| pendiente | Aun no se paga. |
| prioritaria | Vence hoy o esta vencida. |
| parcial | Tiene pago incompleto. |
| pagada | Fue pagada completamente. |
| vencida | Paso la fecha de vencimiento. |
| anulada | Quedo anulada por reversa o anulacion formal. |

Las cuotas deben actualizarse automaticamente segun la fecha del prestamo y el calendario configurado.

## 6. Pagos

Los pagos no se agregan como aportes. Se registran como pagos de cuotas de prestamos.

Reglas:

- Los pagos del dia deben aparecer en prioridad en dashboard.
- Las cuotas vencidas y las que vencen hoy se muestran primero.
- Un pago puede cerrar 1, 2 o mas cuotas en una sola operacion.
- Un pago parcial deja la cuota en estado `parcial`.
- El pago debe comunicarse con caja y crear movimiento.
- El capital e interes se clasifican internamente aunque entren a la misma caja.
- No se permiten pagos negativos.
- No se permiten pagos sobre prestamos anulados.
- Todo pago genera boleta o permite solicitar boleta.

Campos de pago:

| Campo | Tipo | Requerido |
|---|---:|---:|
| id | uuid | Si |
| prestamo_id | uuid | Si |
| prestamista_id | uuid | Si |
| recibido_por_admin_id | uuid | Si |
| fecha_pago | datetime | Si |
| monto_total_centimos | integer | Si |
| capital_centimos | integer | Si |
| interes_centimos | integer | Si |
| mora_centimos | integer | Si |
| estado | enum | Si |
| observacion | text | No |

## 7. Caja unica

La caja representa el dinero disponible real.

Entradas:

- Ingresos manuales justificados.
- Capital cobrado de pagos.
- Intereses cobrados.
- Mora cobrada.
- Ajustes positivos autorizados.

Salidas:

- Prestamos desembolsados.
- Ajustes negativos autorizados.
- Reversas autorizadas.

Formula informativa:

```text
saldo_caja =
  ingresos_justificados
  + pagos_recibidos
  + intereses_cobrados
  + mora_cobrada
  - prestamos_desembolsados
  + ajustes
  - reversas
```

Reglas:

- Para agregar dinero a caja se exige monto y justificacion.
- Todo prestamo desembolsado descuenta caja.
- Todo pago registrado aumenta caja.
- No se debe permitir desembolso si la caja no tiene saldo suficiente, salvo autorizacion explicita de administrador nivel 3.
- Los administradores con permiso de caja pueden hacer conteo final diario o por rango.

## 8. Cierre de caja como conteo final

No existe cierre de caja como reparto final.

El cierre ahora es un informe de conteo:

- Dia actual.
- Semana.
- Mes actual.
- Mes seleccionado por administrador.
- Rango personalizado.

Debe mostrar:

- Saldo inicial.
- Ingresos de caja.
- Prestamos desembolsados.
- Pagos recibidos.
- Intereses cobrados.
- Mora cobrada.
- Ajustes.
- Saldo esperado.
- Saldo contado.
- Diferencia.
- Administrador responsable.
- Observaciones.

Solo administradores con permiso de caja pueden cerrar caja.

## 9. Boletas e impresion

El sistema debe conectarse con una impresora mediante la capacidad de impresion del sistema operativo.

Requisitos:

- Vista previa antes de imprimir.
- Formatos configurables: 80mm, 58mm, A5 y A4.
- Estilo tipo boleta de pagos, horizontal y legible.
- Boton rapido con icono de libreria externa para solicitar informe impreso.
- Registro de cada impresion y reimpresion.
- Reimpresion solo con motivo.

Contenido minimo de boleta:

| Seccion | Campos |
|---|---|
| Encabezado | Panderuu, numero de boleta, fecha de emision, administrador emisor. |
| Persona | Nombre o razon social, DNI/RUC, celular. |
| Prestamo | Capital, tasa, interes generado, periodo/cuotas, fecha de prestamo. |
| Pago | Monto recibido, cuotas pagadas, saldo anterior, saldo nuevo, estado. |
| Firmas | Firma administrador, firma prestamista/asociado, observaciones. |

Columnas de tabla tipo referencia:

| Nombre y Apellidos | Prestamo | Interes | Interes Generado | Periodo | Fecha | Total |
|---|---:|---:|---:|---:|---|---:|

## 10. Dashboard

El dashboard principal es la primera pantalla.

Debe mostrar:

- Saldo de caja.
- Prestamos activos.
- Prestamistas.
- Asociados.
- Administradores.
- Pagos esperados hoy.
- Pagos esperados esta semana.
- Pagos esperados este mes.
- Interes ganado hoy, semana y mes.
- Grafico de barras de intereses por mes.
- Prestamos en mora.
- Cuotas prioritarias.
- Botones para agregar prestamista, agregar asociado, crear prestamo, registrar pago e imprimir informe.

Todos los administradores pueden visualizar prestamistas y asociados; las acciones dependen de su nivel.

## 11. Validaciones

Validaciones generales:

- Correos con formato valido.
- DNI con longitud y formato esperado.
- RUC con longitud y formato esperado.
- Celular normalizado.
- Nombres sin numeros.
- Montos mayores a cero.
- Tasas no negativas.
- Fechas coherentes.
- Cuotas mayores a cero.
- Motivo obligatorio en ajustes, anulaciones, reversas, reimpresiones y restauraciones.
- Duplicados por DNI, RUC y correo deben bloquearse o advertirse segun el caso.

Validaciones de permisos:

- Nivel 1 no puede agregar personas ni autorizar prestamos.
- Nivel 2 no puede crear administradores ni modificar permisos.
- Nivel 3 controla todo el software.
- Cualquier intento no autorizado debe registrar evento fallido en auditoria.

## 12. Modelo de almacenamiento

El modelo recomendado usa SQLite con migraciones versionadas.

Entidades principales:

- personas
- usuarios
- roles
- permisos
- usuario_roles
- rol_permisos
- prestamos
- cuotas
- pagos
- pago_detalles
- movimientos_caja
- cierres_caja
- boletas
- boleta_impresiones
- notas_voz
- auditoria_eventos
- configuracion_sistema

El dinero debe almacenarse como enteros en centimos.

Ejemplo:

```text
S/ 150.00 = 15000
S/ 7.50 = 750
```

## 13. Tecnologia recomendada

Stack:

- Tauri v2 para aplicacion de escritorio.
- React + TypeScript + Vite para interfaz.
- Rust para reglas de negocio locales.
- SQLite con migraciones para almacenamiento.
- `zod` y `react-hook-form` para validaciones.
- `@tanstack/react-table` para tablas.
- `recharts` para graficos.
- `lucide-react` para iconos.
- CSS de impresion para boletas y reportes.

Arquitectura:

```text
React UI
  dashboard, formularios, tablas, preview de boleta
        |
Tauri invoke
        |
Rust services
  auth, roles, personas, prestamos, pagos, caja, reportes, auditoria
        |
SQLite + archivos locales
  panderuu.db, audio/, backups/
```

## 14. Diseno

El diseno debe ser amable, claro y constante para administradores.

Principios:

- Sin landing page; abrir directamente en dashboard.
- Sidebar izquierda fija.
- Tarjetas compactas.
- Tablas densas y legibles.
- Colores suaves y no forzosos.
- Iconos de libreria externa, no emojis.
- Botones de icono con tooltip para acciones frecuentes.

Paleta sugerida:

| Uso | Color |
|---|---|
| Fondo | `#F6F8FA` |
| Superficie | `#FFFFFF` |
| Texto principal | `#1F2933` |
| Texto secundario | `#6B7280` |
| Verde tenue | `#DFF5E7` |
| Verde acento | `#2E9D62` |
| Rojo tenue | `#FCE4E4` |
| Rojo acento | `#D64545` |
| Azul tenue | `#E3F0FF` |
| Azul acento | `#2F80ED` |
| Bordes | `#E5E7EB` |

Iconos recomendados de `lucide-react`:

- `LayoutDashboard`
- `Users`
- `UserPlus`
- `HandCoins`
- `Banknote`
- `Wallet`
- `ReceiptText`
- `Printer`
- `FileText`
- `Percent`
- `BarChart3`
- `ShieldCheck`
- `TriangleAlert`
- `CircleCheck`
- `Clock`
- `Settings`

## 15. Seguridad y auditoria

Controles minimos:

- Autenticacion obligatoria.
- Usuarios individuales, sin cuentas compartidas.
- Hash seguro de contrasenas.
- Bloqueo por intentos fallidos.
- Sesion con expiracion.
- Backups diarios y manuales autorizados.
- Auditoria append-only desde la interfaz.
- Acciones criticas con motivo obligatorio.
- Reversas formales en vez de ediciones silenciosas.
- Backup debe incluir base de datos, boletas generadas y audios.

Auditar:

- Inicio y cierre de sesion.
- Cambios de usuarios, roles y permisos.
- Creacion o edicion de personas.
- Creacion, autorizacion, desembolso, anulacion y refinanciacion de prestamos.
- Pagos, reversas y anulaciones.
- Movimientos y cierres de caja.
- Impresiones y reimpresiones.
- Backups y restauraciones.
- Grabacion, reproduccion o eliminacion logica de audios.

## 16. Documentacion formal

La carpeta `docs/` debe contener:

- `00-informe-general.md`
- `01-reglas-negocio.md`
- `02-modelo-datos.md`
- `03-flujos-pantalla.md`
- `04-arte-diseno.md`
- `05-tecnologias.md`
- `06-seguridad-auditoria.md`
- `07-versiones-feats.md`
- `08-commits-desarrollo.md`

## 17. Criterios de aceptacion

- No aparecen personas ni datos personales iniciales del MD anterior.
- El sistema queda descrito como gestion de prestamos, no como junta con aportes.
- Los roles son acumulables.
- Existe administrador semilla nivel 3.
- La caja es unica.
- Las tasas disponibles son 2%, 5% y 10%.
- El limite inicial de prestamo es S/ 150 con 5% base.
- Los pagos actualizan cuotas y caja.
- El dashboard prioriza pagos del dia y vencidos.
- Las boletas tienen preview e impresion registrada.
- El modelo contempla auditoria, backup, validaciones y permisos por backend.

