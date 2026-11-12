# Añadir Nuevas Funcionalidades (Features)

Para mantener el monolito modular ordenado, crea cada capacidad como un módulo propio con un dominio claro (ejemplo: `src/posts/`, `src/billing/`, `src/analytics/`). Usa `src/users/` como referencia.

## Pasos para un nuevo Dominio

Supongamos que vas a agregar el dominio **`Products`**.

### 1. El Módulo (Estructura Base)

Genera la estructura básica con Nest CLI o manualmente:

```bash
npx @nestjs/cli g module products
```

```text
src/products/
├── controllers/
├── services/
├── repositories/
├── entities/
├── dto/
└── products.module.ts
```

### 2. Dtos (Data Transfer Objects) con Zod

En lugar de decorators de validación complejos como `class-validator`, prefermos la inferencia de tipos de Zod (ej: `create-product.dto.ts`):

```typescript
import { z } from 'zod';

export const CreateProductSchema = z.object({
  name: z.string().min(3),
  price: z.number().positive(),
});

export type CreateProductDto = z.infer<typeof CreateProductSchema>;
```

### 3. Entidad de TypeORM

En `entities/product.entity.ts`:

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column('decimal')
  price!: number;
}
```

No hace falta registrarla en el DataSource: se descubre por el patrón `**/*.entity.ts` (nombra el archivo `product.entity.ts`). Sí debes declararla en el módulo con `TypeOrmModule.forFeature([Product])`. Después genera y aplica la migración (`npm run migration:generate -- src/core/database/migrations/AddProducts` y `npm run migration:run`).

### 4. Controlador y Servicio

Conecta tu DTO con tus rutas usando `ZodValidationPipe` (en `src/shared/pipes/`) sobre el body. No añadas `@UseGuards`: la autenticación y la autorización son globales.

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { CreateProductDto, CreateProductSchema } from '../dto/create-product.dto';
import { ZodValidationPipe } from '@/shared/pipes/zod-validation.pipe';
import { ApiSuccess } from '@/shared/interfaces/api-response';

@Controller('products')
export class ProductsController {
  @Post()
  async create(
    @Body(new ZodValidationPipe(CreateProductSchema)) dto: CreateProductDto,
  ): Promise<ApiSuccess<unknown>> {
    // Llamar al servicio
    return { status: 'success', data: null };
  }
}
```

### 5. Autorización

Todo endpoint nuevo está **denegado** para el rol `USER` hasta que lo agregues a `config/authorization.yaml` (`ADMIN` tiene acceso total):

```yaml
roles:
  USER:
    - resource: 'products'
      methods: ['GET']
    - resource: 'products/:id'
      methods: ['GET']
```

El `resource` es la ruta sin el prefijo global (`api/v1`). Si el recurso se identifica por `:id` y pertenece a un usuario, verifica la propiedad en el controller (ver `assertOwnerOrAdmin` en `users.controller.ts`).

### 6. Registrar el módulo

Declara controller, servicio y repositorio en `products.module.ts` e importa el módulo en `AppModule`.

### 7. Tests

Añade `*.spec.ts` junto al código (ver `src/users/services/users.service.spec.ts`) y ejecuta `npm test`.

## Logging Correcto con Winston

Dentro del servicio (y siempre que sea útil para trazabilidad empresarial o depuración de errores), no uses un simple `console.log`.

Utiliza el `Logger` de `@nestjs/common` (`private readonly logger = new Logger(ProductsService.name)`), que ya está acoplado a **Winston** desde `main.ts`. Escribe en consola y en `logs/error.log` y `logs/combined.log`; el nivel se controla con `LOG_LEVEL` (por defecto `warn`).

Cada petición recibe un `requestId` (UUID) que `LoggingInterceptor` incluye en su línea de log y que `ResponseInterceptor` devuelve en el body, de modo que puedes correlacionar una petición con su log.