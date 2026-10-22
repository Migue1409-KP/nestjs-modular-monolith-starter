# Database Seeders - MyLasts API

Este directorio contiene los seeders para poblar la base de datos con datos iniciales.

## 📂 Estructura de Seeders

Los seeders se ejecutan en el siguiente orden para respetar las dependencias:

1. **01-languages-countries.seeder.ts** - Idiomas (con nombre nativo y estado activo/inactivo)
2. **02-business-parameters.seeder.ts** - Parámetros de negocio del sistema
3. **03-plans-addons.seeder.ts** - Planes de suscripción y addons de almacenamiento
4. **04-notification-templates.seeder.ts** - Templates de notificaciones por email/SMS

## 🚀 Cómo Ejecutar los Seeders

### Opción 1: Ejecutar todos los seeders
```bash
npm run seed
```

### Opción 2: Ejecutar con ts-node directamente
```bash
ts-node -r tsconfig-paths/register src/core/database/seeders/run-seeders.ts
```

## 📋 Prerequisitos

Antes de ejecutar los seeders, asegúrate de:

1. Tener la base de datos creada
2. Haber ejecutado todas las migraciones: `npm run migration:run`
3. Tener las variables de entorno configuradas correctamente

## 📝 Nota Importante sobre Notificaciones

El seeder de notificaciones (`04-notification-templates.seeder.ts`) utiliza el archivo `insertNotifications.sql` ubicado en esta misma carpeta de seeders. Este archivo contiene todos los templates de notificaciones por email y SMS que utiliza el sistema.

**El archivo ya está incluido en el repositorio** y no requiere configuración adicional.

## 🔄 Comportamiento de los Seeders

- **Idempotentes**: Los seeders están diseñados para ser seguros de ejecutar múltiples veces
- **No destructivos**: No eliminan datos existentes, solo insertan o actualizan
- **Con manejo de conflictos**: Usan `ON CONFLICT DO NOTHING` o `ON CONFLICT DO UPDATE` según corresponda

## 🛠️ Desarrollo

### Crear un nuevo seeder

1. Crea un archivo en este directorio siguiendo el patrón: `NN-nombre-descriptivo.seeder.ts`
2. Exporta una función async que reciba `DataSource` como parámetro
3. Agrega el import y llamada en `run-seeders.ts` en el orden correcto

Ejemplo:
```typescript
import { DataSource } from 'typeorm';

export async function seedMiNuevoSeeder(dataSource: DataSource): Promise<void> {
  console.log('🌱 Seeding mi nuevo seeder...');
  
  await dataSource.query(`
    INSERT INTO mi_tabla (campo1, campo2)
    VALUES ('valor1', 'valor2')
    ON CONFLICT (campo1) DO NOTHING;
  `);
  
  console.log('✅ Mi nuevo seeder completado');
}
```

## ⚠️ Advertencias

- Los seeders modifican la base de datos directamente
- Ejecuta primero en desarrollo/staging antes de producción
- Revisa los logs para detectar errores o warnings
- Los IDs fijos (UUIDs) en los seeders están diseñados para ser consistentes entre ambientes

## 📚 Datos Sembrados

### Languages
- Español (es)
- Inglés (en)

### Countries
- United States (us)

### Config Instruction Letter
- DAILY, WEEKLY, MONTHLY con sus respectivas configuraciones

### Business Parameters
- `asset_lifecycle`: Ciclo de vida de assets
- `access_code_expiration`: Expiración de códigos de acceso
- `email_support_notification`: Email de soporte

### Plans
- **Essentials**: Plan básico con 2 beneficiarios
- **Standard**: Plan estándar con multimedia
- **Pro**: Plan profesional con 5 beneficiarios

### Storage Addons
- Addon de almacenamiento de 100MB

### Notification Templates
- MAGIC_LINK
- CHANGE_EMAIL
- NEW_GRANTEE_NOTIFICATION
- DELETE_GRANTEE_NOTIFICATION
- UPDATE_GRANTEE_NOTIFICATION
- HEARTBEAT_FAILED
- HEARTBEAT_CHECK
- HEARTBEAT_VERIFIED
- TRIGGER_LETTER_METHOD_CHANGED
- ASSET_RELEASE
- ASSET_DELETION_WARNING
- FEEDBACK_PQR_STAFF
- FEEDBACK_PQR_USER
- ASSET_RELEASED_GRANTOR
