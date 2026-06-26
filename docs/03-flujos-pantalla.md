# Flujos de pantalla

## Navegacion principal

La aplicacion inicia en el dashboard. La navegacion usa sidebar fija con estas secciones:

- Dashboard.
- Prestamistas.
- Asociados.
- Prestamos.
- Pagos.
- Caja.
- Boletas.
- Reportes.
- Administradores.
- Configuracion.

## Dashboard

Contenido:

- Saldo de caja.
- Total prestado activo.
- Pagos esperados hoy.
- Pagos esperados esta semana.
- Pagos esperados este mes.
- Interes ganado hoy.
- Interes ganado esta semana.
- Interes ganado este mes.
- Grafico de barras de intereses por mes.
- Prestamos vencidos.
- Prestamistas en evaluacion.
- Actividad reciente.

Acciones rapidas:

- Agregar prestamista.
- Agregar asociado.
- Crear prestamo.
- Registrar pago.
- Imprimir informe.

La tabla principal prioriza:

1. Cuotas vencidas.
2. Cuotas que vencen hoy.
3. Prestamos en evaluacion.
4. Pagos de la semana.

## Agregar prestamista

Flujo:

1. Administrador nivel 2 o 3 abre formulario.
2. Ingresa datos de persona.
3. El sistema valida DNI, celular, correo y direccion.
4. El sistema revisa duplicados.
5. El administrador confirma.
6. Se crea persona con rol `Prestamista`.
7. Se registra auditoria.

## Agregar asociado

Flujo:

1. Administrador nivel 2 o 3 abre formulario.
2. Selecciona persona natural o empresa.
3. Para empresa, ingresa RUC y razon social.
4. Para persona natural, ingresa DNI, nombres y apellidos.
5. Completa celular, direccion y correo opcional.
6. El sistema valida duplicados.
7. Se crea asociado.
8. Se registra historial del administrador que lo agrego.

## Crear prestamo

Flujo:

1. Administrador nivel 2 o 3 selecciona prestamista.
2. El sistema muestra historial y estado crediticio.
3. Si es nuevo o no tiene mas de dos prestamos puntuales, sugiere S/ 150 y 5%.
4. Si tiene mora, muestra estado `evaluado`.
5. El administrador define capital, tasa, meses y cuotas.
6. El sistema calcula interes, total y cronograma.
7. El sistema muestra impacto en caja.
8. El administrador autoriza.
9. Al desembolsar, se descuenta caja.
10. Se crean prestamo, cuotas, movimiento de caja y auditoria.

## Registrar pago

Flujo:

1. Administrador nivel 2 o 3 abre prestamo o listado de pagos pendientes.
2. Selecciona una o varias cuotas.
3. Ingresa monto recibido.
4. El sistema distribuye capital, interes y mora segun cuotas seleccionadas.
5. El sistema valida que no exista pago negativo ni exceso sin regla.
6. Se actualiza estado de cuotas.
7. Se genera movimiento de caja.
8. Se ofrece emitir boleta.
9. El dashboard se actualiza.

## Perfil de prestamista

Debe mostrar:

- Datos personales.
- Roles.
- Estado crediticio.
- Prestamos activos.
- Prestamos pagados.
- Cuotas pendientes.
- Mora.
- Boletas.
- Audios de empeno.
- Observaciones.

Acciones segun permisos:

- Crear prestamo.
- Registrar pago.
- Emitir boleta.
- Agregar nota.
- Subir foto.
- Grabar audio para empeno.

## Perfil de administrador

Debe mostrar:

- Datos y foto.
- Nivel de permiso.
- Prestamistas y asociados registrados.
- Prestamos autorizados.
- Pagos registrados.
- Ganancias por intereses con filtros diario, semanal y mensual.
- Prestamos propios si tiene rol prestamista.

## Caja

Vista:

- Saldo actual.
- Ingresos.
- Salidas.
- Movimientos filtrables.
- Boton ingresar dinero.
- Boton cierre/conteo final.

Ingreso a caja:

1. Administrador autorizado ingresa monto.
2. Escribe justificacion.
3. Confirma.
4. Se registra movimiento y auditoria.

## Cierre de caja

Flujo:

1. Administrador nivel 2 o 3 selecciona rango.
2. El sistema calcula ingresos, salidas, intereses y prestamos.
3. El administrador ingresa saldo contado.
4. El sistema muestra diferencia.
5. Si existe diferencia, exige observacion.
6. Se confirma cierre.
7. Se genera informe imprimible.

## Boleta

Flujo:

1. Administrador solicita boleta desde pago, prestamo o dashboard.
2. El sistema genera vista previa.
3. El administrador revisa.
4. Presiona imprimir.
5. Se registra impresion.
6. Si reimprime, exige motivo.

## Reportes

Reportes principales:

- Caja por dia, semana, mes o rango.
- Prestamos activos.
- Prestamos vencidos.
- Prestamistas en evaluacion.
- Intereses ganados por mes.
- Pagos del dia.
- Administradores y acciones.
- Auditoria.

