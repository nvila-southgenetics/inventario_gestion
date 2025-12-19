# SouthGenetics Inventory

Aplicación web progresiva (PWA) de inventario para SouthGenetics, especializada en kits de genética médica.

## Características

- 🎨 Diseño Mobile-First con estética "Medical Clean"
- 📱 PWA completamente funcional
- 🎯 Navegación inferior estilo app nativa
- 📊 Dashboard ejecutivo con KPIs y métricas en tiempo real
- 🔄 Sistema completo de movimientos (Entradas/Salidas) con trazabilidad
- 🏷️ Categorización de kits (Oncológicos/Ginecológicos)
- 📦 Gestión de productos, proveedores y categorías
- 📈 Historial de movimientos con filtros avanzados
- 👥 Sistema de usuarios con roles (ADMIN, MANAGER, VIEWER)
- 🔐 Autenticación segura con Supabase

## Stack Tecnológico

- **Framework**: Next.js 14 (App Router) con TypeScript
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Estilos**: Tailwind CSS
- **Componentes UI**: Shadcn UI
- **Iconos**: Lucide React
- **Animaciones**: Framer Motion
- **Validación**: Zod

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
# Crear archivo .env.local con:
# NEXT_PUBLIC_SUPABASE_URL=tu_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key
# SUPABASE_SERVICE_ROLE_KEY=tu_service_key

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar en producción
npm start
```

## Estructura del Proyecto

```
├── app/                    # App Router de Next.js
│   ├── dashboard/         # Páginas del dashboard
│   │   ├── page.tsx       # Dashboard ejecutivo
│   │   ├── inventory/     # Gestión de inventario
│   │   ├── history/       # Historial de movimientos
│   │   └── users/         # Gestión de usuarios
│   ├── auth/              # Rutas de autenticación
│   └── layout.tsx         # Layout principal
├── components/             # Componentes React
│   ├── ui/                # Componentes UI base (Shadcn)
│   ├── dashboard/         # Componentes del Dashboard
│   └── inventory/         # Componentes de inventario
├── lib/                    # Utilidades y datos
│   ├── supabase/          # Clientes de Supabase
│   ├── metrics.ts         # Funciones de métricas
│   └── utils.ts           # Funciones helper
├── actions/                # Server Actions
│   ├── auth.ts            # Acciones de autenticación
│   └── inventory.ts      # Acciones de inventario
└── types/                  # Tipos TypeScript
    └── database.ts        # Interfaces de base de datos
```

## Funcionalidades Principales

### Dashboard Ejecutivo
- KPIs en tiempo real (Total Inventario, Alertas, Movimientos, Proveedor Top)
- Panel de alertas críticas de stock bajo
- Actividad reciente de movimientos

### Gestión de Inventario
- Catálogo completo de productos con categorías
- Registro de entradas y salidas con trazabilidad
- Control de lotes y fechas de vencimiento
- Alertas automáticas de stock mínimo

### Historial de Movimientos
- Vista completa de todos los movimientos
- Filtros por producto, tipo y fecha
- Vista detallada por producto específico
- Interfaz responsive (tabla desktop, cards móvil)

### Gestión de Usuarios
- Sistema de invitaciones por email
- Roles y permisos (ADMIN, MANAGER, VIEWER)
- Multi-tenancy por organización

## Base de Datos

El sistema utiliza Supabase (PostgreSQL) con:
- Row Level Security (RLS) para seguridad multi-tenant
- Triggers automáticos para actualización de stock
- Funciones RPC optimizadas para métricas

## Desarrollo

Este proyecto está en desarrollo activo. Para más detalles sobre la configuración inicial, consulta `SETUP.md`.

## Licencia

Propiedad de SouthGenetics - Todos los derechos reservados.
