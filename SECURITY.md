# Política de seguridad

## Versiones con soporte

Solo la última versión menor de la serie mayor vigente recibe correcciones de seguridad.

| Versión | Soporte |
|---|---|
| 1.x (última) | ✅ |
| < 1.0 | ❌ |

Consulta el [CHANGELOG](./CHANGELOG.md) y las [releases](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/releases) para conocer la versión actual.

## Cómo reportar una vulnerabilidad

**No abras un issue público** para vulnerabilidades de seguridad.

Usa el reporte privado de GitHub:

1. Ve a la pestaña **Security** del repositorio.
2. Pulsa **Report a vulnerability** (o entra directamente a [Security Advisories](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/security/advisories/new)).
3. Describe el problema con el mayor detalle posible.

Incluye, si es posible:

- Descripción del problema e impacto potencial.
- Pasos para reproducirlo (petición HTTP, payload, configuración).
- Versión afectada y versión de Node.js / PostgreSQL.
- Una posible mitigación o parche, si ya lo tienes.

## Qué esperar

Es un proyecto mantenido por voluntarios, por lo que los plazos son orientativos (mejor esfuerzo):

- **Acuse de recibo:** en un plazo de 5 días hábiles.
- **Evaluación inicial:** en un plazo de 10 días hábiles, indicando si se confirma y su severidad.
- **Corrección:** se publicará un parche y una nota en el CHANGELOG; se te acreditará si lo deseas.

Te pedimos que nos des un tiempo razonable para corregir antes de divulgar públicamente.

## Alcance

Este repositorio es una **plantilla**. Quien la usa es responsable de su propia configuración. Aun así, nos interesa recibir reportes sobre:

- Fallos en la autenticación y autorización (`src/auth`, `PolicyGuard`, matriz `config/authorization.yaml`).
- Exposición de datos o comprobaciones de propiedad ausentes en los módulos de ejemplo.
- Valores inseguros por defecto en la configuración (cookies, CORS, secretos).
- Vulnerabilidades en dependencias que afecten al template.

Quedan fuera del alcance: vulnerabilidades de Better Auth, NestJS u otras librerías (repórtalas a sus proyectos) y problemas que requieran un `.env` o infraestructura ya comprometidos.

## Buenas prácticas al desplegar

- Define un `BETTER_AUTH_SECRET` largo y aleatorio; nunca uses el valor por defecto.
- No subas `.env` al repositorio y rota cualquier secreto que se haya expuesto.
- Usa HTTPS y `COOKIE_CROSS_SITE=true` solo cuando el frontend viva en otro sitio.
- Configura `FRONTEND_URL` solo con los orígenes que realmente confías.
