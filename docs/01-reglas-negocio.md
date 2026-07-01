# Reglas de negocio

## Roles

Las personas pueden acumular roles:

- Administrador.
- Prestamista.
- Asociado.

Una persona que recibe prestamos debe tener rol `Prestamista`. Un administrador tambien puede ser prestamista; en ese caso sus prestamos se registran tanto en su historial de administrador como en su historial de prestamista.

## Administradores

### Administrador semilla

El sistema inicia con un administrador semilla nivel 3, creado en instalacion o primer arranque. Esta cuenta reemplaza la idea de un correo permanente de administrador.

Reglas:

- La cuenta semilla debe ser auditable.
- Debe cambiar credenciales en primer uso.
- Solo nivel 3 puede crear otros administradores.
- Los administradores creados despues deben quedar ligados al administrador que los registro.

Regla implementada en backend v1:

```text
Solo un administrador nivel 3 puede crear administradores.
El nuevo administrador debe quedar registrado como persona con rol Administrador.
El nivel asignado debe ser 1, 2 o 3.
Todo intento de nivel 1 o 2 para crear administradores responde "permisos no autorizados".
```

Un administrador tambien puede tener rol `Prestamista` si se desea habilitarlo para recibir prestamos.

### Autenticacion

Reglas:

- Cada administrador tiene usuario unico y clave propia.
- La cuenta semilla y las cuentas nuevas inician con cambio obligatorio de clave.
- La clave se guarda como hash, nunca en texto plano.
- El login crea una sesion con token Bearer y vencimiento.
- El logout revoca la sesion.
- El cambio de clave requiere clave actual y revoca otras sesiones del mismo administrador.
- Los intentos de login exitosos y fallidos se guardan en auditoria.
- El header `x-actor-id` solo puede usarse en desarrollo local con `PANDERUU_DEV_AUTH=1`.

### Permisos por nivel

| Accion | Nivel 1 | Nivel 2 | Nivel 3 |
|---|---:|---:|---:|
| Ver dashboard | Si | Si | Si |
| Ver prestamistas y asociados | Si | Si | Si |
| Emitir informes | Si | Si | Si |
| Emitir boletas | Si | Si | Si |
| Agregar prestamistas | No | Si | Si |
| Agregar asociados | No | Si | Si |
| Autorizar prestamos | No | Si | Si |
| Registrar pagos | No | Si | Si |
| Ingresar dinero a caja | No | Si | Si |
| Cerrar caja | No | Si | Si |
| Crear administradores | No | No | Si |
| Cambiar permisos | No | No | Si |
| Configurar tasas y reglas | No | No | Si |
| Restaurar backups | No | No | Si |

Intentos no autorizados:

```text
permisos no autorizados
```

El intento fallido debe guardarse en auditoria.

## Prestamistas

Un prestamista es una persona habilitada para solicitar o recibir prestamos.

Estados crediticios:

| Estado | Regla |
|---|---|
| nuevo | Maximo S/ 150 con 5% base. |
| regular | Tiene historial, pero no supera dos prestamos puntuales. |
| buen_historial | Mas de dos prestamos pagados a tiempo y sin mora vigente. |
| evaluado | Tiene mora o riesgo; requiere decision administrativa. |
| bloqueado | No puede recibir prestamos hasta nueva autorizacion. |

Reglas:

- Nuevos prestamistas solo acceden al monto base.
- Si no pagan a tiempo, quedan como `evaluado`.
- Con buen historial pueden acceder a montos mayores segun criterio del administrador.
- Las excepciones deben registrar administrador, motivo y fecha.

## Asociados

Un asociado puede ser persona natural o empresa.

Reglas:

- Debe registrarse por formulario.
- Si es empresa, debe registrar RUC.
- Si es persona natural, debe registrar DNI cuando aplique.
- Debe tener celular y direccion para ser localizable.
- Puede acumular rol Prestamista si recibira prestamos.
- El asociado mantiene historial de registros, prestamos, pagos, boletas y observaciones.

Regla implementada en backend v1:

```text
Persona natural: DNI de 8 digitos.
Empresa: RUC de 11 digitos.
Celular: 9 digitos.
Correo: opcional, pero si existe debe tener formato valido.
Roles permitidos: Administrador, Prestamista, Asociado.
```

## Prestamos

### Regla inicial

Prestamistas nuevos o sin mas de dos prestamos pagados a tiempo:

```text
monto_maximo = S/ 150
tasa_base = 5%
```

La tasa y el monto pueden modificarse solo por administrador autorizado.

### Interes

Tasas fijas disponibles:

- 2%.
- 5%.
- 10%.

Regla base:

```text
interes_generado = capital * tasa_interes_total
total_a_pagar = capital + interes_generado
```

El metodo por dias/plazos se mantiene:

- Hasta 31 dias: tasa seleccionada sobre capital.
- Mayor a 31 dias: tasa sugerida segun meses/cuotas, editable por administrador.

### Cuotas

Las cuotas se calculan segun cantidad de meses y numero de cuotas. El modulo de meses deja de ser independiente; solo sirve para distribuir fechas y cuotas.

Regla implementada en backend v1:

```text
Al crear un prestamo se generan automaticamente N cuotas.
N = numero de cuotas indicado; si no se indica, N = cantidad de meses.
Capital e interes se distribuyen en centimos entre las cuotas sin perder saldo.
La primera cuota vence un mes despues de la fecha del prestamo.
Las siguientes cuotas vencen mes a mes.
```

Si el reparto no divide exacto en centimos, las primeras cuotas reciben el centimo restante hasta cuadrar el total.

Estados:

- pendiente.
- prioritaria.
- parcial.
- pagada.
- vencida.
- anulada.

### Mora

Regla implementada:

```text
mora_diaria = capital_prestado * 0.1%
dias_de_mora = dias completos de 24 horas despues del vencimiento
mora_total = mora_diaria * dias_de_mora
```

Ejemplo:

```text
capital_prestado = S/ 1000
mora_diaria = S/ 1
si pasan 3 dias completos, mora_total = S/ 3
```

La mora se calcula sobre el capital total prestado, no sobre el saldo de la cuota. Cuando una cuota entra en mora, el prestamista queda marcado como `evaluado`.

## Pagos

Reglas:

- El pago se registra por formulario.
- Puede cerrar una o mas cuotas.
- Puede ser parcial.
- Se aplica desde la cuota pendiente mas antigua del prestamo.
- Puede cubrir capital, interes y mora acumulada.
- Actualiza caja.
- Genera movimiento de caja.
- Puede generar boleta.
- No se permiten pagos negativos.
- No se permiten pagos en prestamos anulados.

Prioridad:

- Cuotas vencidas.
- Cuotas con vencimiento del dia.
- Cuotas de la semana.
- Cuotas del mes.

## Caja unica

La caja unica contiene el saldo operativo real.

Entradas:

- Ingreso manual justificado.
- Pagos de capital.
- Intereses cobrados.
- Mora cobrada.
- Ajustes positivos.

Salidas:

- Desembolso de prestamos.
- Ajustes negativos.
- Reversas autorizadas.

Todo movimiento exige:

- Fecha.
- Tipo.
- Monto.
- Responsable.
- Referencia.
- Motivo si es manual o critico.

## Cierre de caja

El cierre es un conteo final, no reparto.

Puede hacerse por:

- Dia.
- Semana.
- Mes actual.
- Mes seleccionado.
- Rango personalizado.

Debe mostrar:

- Saldo inicial.
- Ingresos.
- Salidas.
- Prestamos entregados.
- Pagos recibidos.
- Intereses cobrados.
- Saldo esperado.
- Saldo contado.
- Diferencia.
- Responsable.

## Validaciones

- Nombres sin numeros.
- Correos con formato valido.
- DNI de 8 digitos para persona natural.
- RUC de 11 digitos para empresa.
- Celular normalizado a 9 digitos.
- Direccion requerida para operaciones de prestamo.
- Montos positivos.
- Tasas no negativas.
- Fechas coherentes.
- Cuotas mayores a cero.
- Motivo obligatorio para anulaciones, reversas, ajustes, reimpresiones y restauraciones.
