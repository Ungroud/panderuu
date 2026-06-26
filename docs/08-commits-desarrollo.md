# Commits y desarrollo

## Convencion de commits

Usar formato:

```text
tipo: descripcion corta
```

Tipos:

| Tipo | Uso |
|---|---|
| docs | Documentacion. |
| feat | Nueva funcionalidad. |
| fix | Correccion. |
| refactor | Reestructura sin cambiar comportamiento. |
| test | Pruebas. |
| chore | Tareas de mantenimiento. |
| build | Configuracion de build. |
| security | Seguridad, permisos o auditoria. |

Ejemplos:

```text
docs: actualizar especificacion de prestamos
feat: agregar administrador semilla
feat: crear formulario de prestamista
security: bloquear acciones sin permiso en backend
test: cubrir calculo de cuotas e intereses
```

## Orden recomendado de commits

1. `docs: agregar especificacion actualizada de Panderuu`
2. `docs: documentar reglas de negocio y permisos`
3. `docs: documentar modelo de datos`
4. `docs: documentar flujos de pantalla`
5. `docs: documentar arte y diseno`
6. `docs: documentar tecnologias`
7. `docs: documentar seguridad y auditoria`
8. `docs: documentar roadmap y convencion de commits`

## Registro de desarrollo

| Version | Commit sugerido | Descripcion |
|---|---|---|
| v0.1 | docs | Documentacion base del sistema. |
| v0.2 | feat/build | App Tauri + React + SQLite. |
| v0.3 | feat/security | Usuarios, roles y permisos. |
| v0.4 | feat | Personas, prestamistas y asociados. |
| v0.5 | feat | Prestamos y cronograma. |
| v0.6 | feat | Pagos y cuotas. |
| v0.7 | feat | Caja y cierres. |
| v0.8 | feat | Boletas y reportes. |
| v0.9 | security | Auditoria y backups. |
| v1.0 | build | Instalador y version operativa. |

## Reglas para commits sensibles

- No mezclar cambios de reglas financieras con cambios visuales grandes.
- Cada migracion debe tener prueba o verificacion.
- Cambios de permisos deben incluir casos de bloqueo.
- Cambios de caja deben incluir auditoria.
- Cambios de boleta deben incluir vista previa verificada.
- Cambios de backup deben probar restauracion.

