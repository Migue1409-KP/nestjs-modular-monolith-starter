# Database Seeders

Este directorio contiene los seeders que cargan los datos base de la base de datos.

## 📂 Estructura

Los seeders se ejecutan en este orden (lo define `run-seeders.ts`):

1. **01-languages-countries.seeder.ts** - Idiomas (`es` Español, `en` English).
2. **02-notification-templates.seeder.ts** - Plantillas de notificación por email con traducciones `en` y `es` (requiere los idiomas del paso 1).

## 🚀 Cómo ejecutarlos

```bash
npm run seed
```

Equivale a:

```bash
ts-node -r tsconfig-paths/register src/core/database/seeders/run-seeders.ts
```

## 📋 Prerequisitos

1. Base de datos creada y accesible (variables `DB_*` en `.env`).
2. Tablas de Better Auth y migraciones de TypeORM aplicadas: `npm run auth:migrate` y `npm run migration:run`.

## 🔄 Comportamiento

- **Idempotentes**: se pueden ejecutar varias veces sin duplicar datos.
- **No destructivos**: solo insertan o actualizan, no eliminan.
- Usan `ON CONFLICT DO NOTHING` (idiomas, por `id`) u `ON CONFLICT DO UPDATE` (plantillas y traducciones, por `code` y por `template` + `language`).
- Los UUID de los idiomas son fijos, de modo que son consistentes entre ambientes.

## 📚 Datos sembrados

### Languages

- Español (`es`)
- English (`en`)

### Notification Templates

Plantillas (`en` + `es`) usadas por los correos de autenticación:

- `MAGIC_LINK` (params: `url`, `token`)
- `CHANGE_EMAIL` (params: `url`, `token`, `newEmail`)

## 🛠️ Crear un nuevo seeder

1. Crea un archivo en este directorio con el patrón `NN-nombre-descriptivo.seeder.ts`.
2. Exporta una función async que reciba un `DataSource`.
3. Importa y llama la función en `run-seeders.ts` en el orden correcto.

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

- Los seeders modifican la base de datos directamente.
- Ejecútalos primero en desarrollo/staging antes de producción.
- Revisa los logs para detectar errores o warnings.
