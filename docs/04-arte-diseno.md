# Arte y diseno

## Direccion visual

Panderuu debe sentirse como una herramienta administrativa tranquila, clara y confiable. La interfaz debe ser comoda para uso diario, con informacion densa pero ordenada.

No debe tener landing page. La primera vista es el dashboard.

## Layout

Estructura:

```text
Sidebar izquierda
Header superior compacto
Contenido principal
Panel lateral de detalle
Modales o drawers para formularios
```

La referencia visual es un dashboard con sidebar, tarjetas superiores, actividad reciente, graficos y tabla inferior. Panderuu debe adaptar esa idea a prestamos, caja y pagos.

## Paleta

| Uso | Color |
|---|---|
| Fondo general | `#F6F8FA` |
| Superficie | `#FFFFFF` |
| Borde | `#E5E7EB` |
| Texto principal | `#1F2933` |
| Texto secundario | `#6B7280` |
| Verde suave | `#DFF5E7` |
| Verde acento | `#2E9D62` |
| Rojo suave | `#FCE4E4` |
| Rojo acento | `#D64545` |
| Azul suave | `#E3F0FF` |
| Azul acento | `#2F80ED` |
| Ambar aviso | `#FEF3C7` |

Uso:

- Verde: caja positiva, pagos completados, acciones correctas.
- Rojo: mora, vencido, bloqueo, error.
- Azul: reportes, informacion, estados activos.
- Ambar: advertencias y evaluacion.

## Iconos

Usar `lucide-react`. No usar emojis del sistema.

Mapa:

| Funcion | Icono |
|---|---|
| Dashboard | `LayoutDashboard` |
| Prestamistas | `Users` |
| Agregar persona | `UserPlus` |
| Prestamos | `HandCoins` |
| Caja | `Wallet` |
| Pagos | `ReceiptText` |
| Boleta | `FileText` |
| Imprimir | `Printer` |
| Interes | `Percent` |
| Graficos | `BarChart3` |
| Seguridad | `ShieldCheck` |
| Alerta | `TriangleAlert` |
| Correcto | `CircleCheck` |
| Pendiente | `Clock` |
| Configuracion | `Settings` |

## Componentes

- `AppSidebar`.
- `TopBar`.
- `MetricCard`.
- `DataTable`.
- `StatusBadge`.
- `MoneyValue`.
- `LoanForm`.
- `PaymentForm`.
- `ReceiptPreview`.
- `CashMovementTable`.
- `CashCloseReport`.
- `PermissionGuard`.
- `ConfirmDialog`.
- `PrintButton`.

## Dashboard

Tarjetas superiores:

- Caja actual.
- Prestamos activos.
- Pagos hoy.
- Interes del mes.

Bloques secundarios:

- Grafico de barras: interes ganado por mes.
- Actividad reciente.
- Prestamistas en evaluacion.
- Pagos de hoy, semana y mes.

Tabla inferior:

| Persona | Prestamo | Interes | Interes generado | Periodo | Proxima fecha | Total | Estado | Accion |
|---|---:|---:|---:|---:|---|---:|---|---|

## Boleta impresa

La boleta debe ser clara, horizontal y con bordes simples, inspirada en la tabla de referencia.

Encabezado:

- Panderuu.
- Boleta de pago.
- Numero correlativo.
- Fecha.
- Administrador emisor.

Tabla principal:

| Nombre y Apellidos | Prestamo | Interes | Interes Generado | Periodo | Fecha | Total |
|---|---:|---:|---:|---:|---|---:|

Detalle:

- Cuotas pagadas.
- Monto recibido.
- Saldo anterior.
- Saldo nuevo.
- Estado.
- Observaciones.

Pie:

- Firma administrador.
- Firma prestamista/asociado.
- Texto de comprobante generado por Panderuu.

La vista previa debe mostrarse como hoja blanca centrada con controles:

- Imprimir.
- Descargar.
- Cambiar formato.
- Cerrar.

## Accesibilidad

- Botones de solo icono con `aria-label`.
- Iconos siempre acompanados de tooltip.
- Estados con color, texto e icono.
- Navegacion por teclado.
- Modales con foco controlado.
- Tablas con encabezado fijo.

