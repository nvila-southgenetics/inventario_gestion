# Configuración de Autenticación - SouthGenetics Inventory

## Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://hbvwbnprpgxiwjezythf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

### Cómo obtener las keys:

1. **NEXT_PUBLIC_SUPABASE_URL**: Ya está configurado (proyecto InventarioSG)
2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**: 
   - Ve a tu proyecto en Supabase Dashboard
   - Settings > API
   - Copia la "anon public" key o la "publishable key"
3. **SUPABASE_SERVICE_ROLE_KEY**:
   - En el mismo lugar (Settings > API)
   - Copia la "service_role" key (⚠️ NUNCA la expongas en el cliente)

## Estructura de Autenticación

### Flujo de Invitación

1. **Admin invita usuario** (`/dashboard/users`):
   - Solo usuarios con rol `ADMIN` pueden invitar
   - Se envía email de invitación
   - El usuario invitado recibe un link con código de intercambio

2. **Usuario hace clic en el email**:
   - Redirige a `/auth/callback?code=xxx&type=invite`
   - El código se intercambia por sesión
   - Redirige a `/update-password`

3. **Usuario establece contraseña**:
   - Ingresa nueva contraseña
   - Se actualiza en Supabase Auth
   - Redirige al dashboard

### Flujo de Login

1. Usuario ingresa email/password en `/login`
2. Server action `login()` autentica con Supabase
3. Si es exitoso, redirige a `/` (dashboard)
4. Si hay error, muestra toast con mensaje

## Rutas Protegidas

El middleware protege automáticamente:
- Todas las rutas excepto `/login`, `/update-password`, `/auth/callback`
- Si no está autenticado → redirige a `/login`
- Si está autenticado y va a `/login` → redirige a `/`

## Seguridad (RLS)

Todas las tablas tienen Row Level Security habilitado:
- Los usuarios solo ven/modifican datos de su `organization_id`
- Las políticas verifican que `auth.uid()` pertenezca a la organización

## Server Actions

### `login(formData)`
- Autentica usuario con email/password
- Redirige a dashboard si es exitoso

### `inviteUser(formData)`
- Verifica que el usuario actual sea ADMIN
- Invita usuario con `supabaseAdmin.auth.admin.inviteUserByEmail()`
- Crea/actualiza perfil con `organization_id` y `role` correctos

### `updatePassword(formData)`
- Actualiza contraseña del usuario autenticado
- Valida que las contraseñas coincidan
- Redirige a dashboard si es exitoso

### `signOut()`
- Cierra sesión
- Redirige a `/login`

## Componentes UI Creados

- `Button`: Botón con variantes y tamaños
- `Input`: Input con estilos consistentes
- `Label`: Label accesible (Radix UI)
- `Select`: Select dropdown (Radix UI)
- `Toast`: Sistema de notificaciones (react-hot-toast)
- `Card`: Tarjetas con header/content/footer

Todos los componentes siguen el diseño "Medical Clean" con:
- Bordes redondeados (radius-xl)
- Touch targets de mínimo 44px
- Colores del tema (primary teal/cyan)



