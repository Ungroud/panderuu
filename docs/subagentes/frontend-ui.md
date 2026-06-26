# Subagente Frontend/UI

## Mision

Implementar la interfaz React + TypeScript + Vite de Panderuu, preparada para Tauri v2. La app debe abrir directo en dashboard y usar los datos del backend mediante una capa reemplazable por comandos Tauri.

## Alcance

- Dashboard administrativo.
- Formularios de prestamista, asociado, prestamo y pago.
- Perfiles de prestamista, asociado y administrador.
- Vista de caja.
- Preview imprimible de boletas.
- Tema visual segun `docs/04-arte-diseno.md`.
- Iconos `lucide-react`, no emojis.

## Estructura esperada

```text
src/
  app/
  components/
  features/
    dashboard/
    people/
    admins/
    loans/
    payments/
    cash/
    receipts/
  services/
  styles/
  utils/
```

## Scripts usados

- `npm run bootstrap`
- `npm run dev`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run verify`

## Entregables

- Layout con sidebar fija, topbar y contenido principal.
- `DashboardPage` con caja, prestamos, pagos e intereses.
- `PersonForm`, `LoanForm`, `PaymentForm`.
- `LenderProfile`, `AssociateProfile`, `AdminProfile`.
- `ReceiptPreview` con formatos 58mm, 80mm, A5 y A4.
- `PermissionGuard` para visibilidad de acciones.
- `services/panderuuApi.ts` listo para mocks o Tauri invoke.
- CSS de pantalla e impresion.

## Criterios de aceptacion

- No hay landing page.
- Acciones frecuentes usan iconos de `lucide-react`.
- Formularios validan datos basicos con `zod`.
- Dashboard prioriza cuotas vencidas y pagos del dia.
- Boleta contiene encabezado, persona, prestamo, pago, saldos, estado, observaciones y firmas.
- Acciones no permitidas muestran u ocultan con base en permisos, sin asumir que UI es seguridad final.

