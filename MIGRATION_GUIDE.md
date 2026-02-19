# Guía de Migración: Soporte Multi-País

Esta guía explica cómo migrar el sistema de inventario para soportar múltiples países (México y Uruguay).

## 📋 Pasos de Migración

### 1. Ejecutar la Migración SQL

La migración SQL agrega el campo `country_code` a todas las tablas principales y actualiza las políticas RLS.

**Opción A: Ejecutar manualmente en Supabase**

1. Abre el SQL Editor en tu proyecto de Supabase
2. Copia el contenido del archivo `supabase/migrations/001_add_country_support.sql`
3. Pega y ejecuta el SQL en el editor
4. Verifica que no haya errores

**Opción B: Usar el script de migración**

```bash
# Asegúrate de tener las variables de entorno configuradas
export NEXT_PUBLIC_SUPABASE_URL="tu_url"
export SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key"

# Ejecutar el script
npx tsx scripts/run-migration.ts
```

### 2. Actualizar Usuarios Existentes

Después de ejecutar la migración, todos los usuarios existentes tendrán `country_code = 'MX'` por defecto. 

**Para asignar usuarios a Uruguay:**

```sql
-- Actualizar usuarios específicos a Uruguay
UPDATE public.profiles
SET country_code = 'UY'
WHERE email IN ('usuario1@example.com', 'usuario2@example.com');
```

**Para verificar usuarios y sus países:**

```sql
SELECT email, country_code, organization_id
FROM public.profiles
ORDER BY country_code, email;
```

### 3. Actualizar Datos Existentes

Los datos existentes (productos, proveedores, movimientos, categorías) tendrán `country_code = 'MX'` por defecto.

**Si necesitas migrar datos existentes a Uruguay:**

```sql
-- Ejemplo: Migrar productos específicos a Uruguay
UPDATE public.products
SET country_code = 'UY'
WHERE id IN ('product-id-1', 'product-id-2');

-- Ejemplo: Migrar todos los datos de una organización a Uruguay
UPDATE public.products
SET country_code = 'UY'
WHERE organization_id = 'tu-organization-id';

UPDATE public.suppliers
SET country_code = 'UY'
WHERE organization_id = 'tu-organization-id';

UPDATE public.movements
SET country_code = 'UY'
WHERE organization_id = 'tu-organization-id';

UPDATE public.categories
SET country_code = 'UY'
WHERE organization_id = 'tu-organization-id';
```

### 4. Configurar Usuario Multi-País

El usuario `nvila@southgenetics.com` está configurado para poder ver ambos países. Las políticas RLS permiten que este usuario vea datos de todos los países.

**Verificar configuración:**

```sql
SELECT email, country_code
FROM public.profiles
WHERE email = 'nvila@southgenetics.com';
```

Este usuario debería poder cambiar entre países usando el selector en el sidebar.

## 🔒 Seguridad

Las políticas RLS aseguran que:

1. **Usuarios normales** solo pueden ver/modificar datos de su país asignado
2. **Usuario multi-país** (`nvila@southgenetics.com`) puede ver todos los países pero debe seleccionar uno para crear/modificar datos
3. Todos los usuarios solo pueden acceder a datos de su `organization_id`

## 📝 Notas Importantes

- El campo `country_code` es obligatorio y tiene un valor por defecto de `'MX'`
- Los índices compuestos mejoran el rendimiento de las consultas filtradas por organización y país
- El selector de país solo aparece para el usuario `nvila@southgenetics.com`
- Al cambiar de país, el sistema recarga automáticamente para aplicar los nuevos filtros

## 🧪 Verificación

Después de la migración, verifica:

1. ✅ Los usuarios de México solo ven datos de México
2. ✅ Los usuarios de Uruguay solo ven datos de Uruguay
3. ✅ El usuario `nvila@southgenetics.com` puede cambiar entre países
4. ✅ Las políticas RLS funcionan correctamente
5. ✅ Los nuevos registros se crean con el `country_code` correcto

## 🐛 Solución de Problemas

**Problema: Los usuarios no ven datos después de la migración**

- Verifica que el `country_code` del usuario coincida con el `country_code` de los datos
- Verifica que las políticas RLS estén activas: `ALTER TABLE nombre_tabla ENABLE ROW LEVEL SECURITY;`

**Problema: El selector de país no aparece**

- Verifica que el email del usuario sea exactamente `nvila@southgenetics.com`
- Verifica que el componente `CountrySelector` esté importado en el sidebar

**Problema: Error al crear nuevos registros**

- Verifica que el `country_code` del usuario esté configurado
- Verifica que las políticas RLS permitan INSERT con el `country_code` correcto
