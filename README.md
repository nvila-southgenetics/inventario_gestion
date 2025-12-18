# SouthGenetics Inventory

Aplicación web progresiva (PWA) de inventario para SouthGenetics, especializada en kits de genética médica.

## Características

- 🎨 Diseño Mobile-First con estética "Medical Clean"
- 📱 PWA completamente funcional
- 🎯 Navegación inferior estilo app nativa
- 📊 Dashboard con resumen de inventario
- 🔄 Sistema de movimientos (Entradas/Salidas)
- 🏷️ Categorización de kits (Oncológicos/Ginecológicos)

## Stack Tecnológico

- **Framework**: Next.js 14 (App Router) con TypeScript
- **Estilos**: Tailwind CSS
- **Componentes UI**: Shadcn UI
- **Iconos**: Lucide React
- **Animaciones**: Framer Motion

## Instalación

```bash
# Instalar dependencias
npm install

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
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página principal (Dashboard)
│   └── globals.css        # Estilos globales
├── components/             # Componentes React
│   ├── ui/                # Componentes UI base (Shadcn)
│   ├── dashboard/         # Componentes del Dashboard
│   └── navigation/        # Componentes de navegación
├── lib/                    # Utilidades y datos
│   ├── utils.ts           # Funciones helper
│   └── mock-data.ts       # Datos mock
└── public/                 # Archivos estáticos
    └── manifest.json      # Manifest de PWA
```

## Próximos Pasos

- [ ] Página de Inventario completa
- [ ] Modal de registro de movimientos
- [ ] Integración con Supabase
- [ ] Autenticación
- [ ] Reportes y estadísticas



