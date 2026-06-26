# Informe general de Panderuu

## Resumen ejecutivo

Panderuu sera una aplicacion de escritorio para administrar prestamos, pagos, cuotas, caja unica, perfiles de personas, boletas impresas, reportes y auditoria. El modelo anterior de junta con aportes mensuales queda reemplazado por un sistema financiero local y escalable.

La prioridad es que los administradores puedan controlar prestamistas, asociados, prestamos, caja, pagos del dia, intereses generados y reportes impresos desde un dashboard claro.

## Documentos

| Documento | Contenido |
|---|---|
| `01-reglas-negocio.md` | Roles, permisos, prestamos, intereses, pagos, caja y validaciones. |
| `02-modelo-datos.md` | Entidades, campos, relaciones, estados y auditoria. |
| `03-flujos-pantalla.md` | Dashboard, formularios, perfiles, prestamos, pagos, caja, boletas y reportes. |
| `04-arte-diseno.md` | Paleta, layout, iconos, componentes y boleta visual. |
| `05-tecnologias.md` | Stack tecnico, librerias y arquitectura. |
| `06-seguridad-auditoria.md` | Controles, riesgos, permisos, backups y datos sensibles. |
| `07-versiones-feats.md` | Roadmap de versiones y funcionalidades. |
| `08-commits-desarrollo.md` | Convencion de commits y registro de desarrollo. |
| `09-subagentes-desarrollo.md` | Division de subagentes, scripts y fases de implementacion. |
| `10-backend-real.md` | Backend local v0, reglas codificadas, API y puntos pendientes de aprobacion. |

## Cambios clave

- Se eliminan aportes mensuales como eje del sistema.
- Se eliminan personas iniciales y datos relacionados del documento anterior.
- Se documenta caja unica.
- Se agregan roles acumulables: Administrador, Prestamista y Asociado.
- Se definen niveles de administrador 1, 2 y 3.
- Se define administrador semilla nivel 3.
- Se agregan prestamos con reglas de historial, mora y evaluacion.
- Se agregan pagos de cuotas, cierre de multiples cuotas y prioridad de pagos del dia.
- Se agregan boletas impresas con vista previa.
- Se agregan auditoria, backups y validaciones.
- Se agrega backend local v0 con reglas de negocio probadas y almacenamiento persistente JSON para arrancar desde lo basico.

## Supuestos aprobados

- Prestamista significa persona habilitada para solicitar o recibir prestamos.
- Asociado puede ser persona natural o empresa con RUC y datos localizables.
- No habra correo permanente root.
- Caja unica sera el saldo real.
- Los intereses se clasifican para reportes, pero no se separan en otra caja.

## Estado del repositorio

El workspace local se usa como base documental del proyecto. Cuando se autorice el flujo de versionado remoto, el destino sera:

```text
https://github.com/Ungroud/panderuu.git
```
