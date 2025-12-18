"use client";

import { Home, Package, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    name: "Inicio",
    href: "/",
    icon: Home,
  },
  {
    name: "Inventario",
    href: "/inventario",
    icon: Package,
  },
  {
    name: "Acción",
    href: "/accion",
    icon: Plus,
  },
  {
    name: "Configuración",
    href: "/configuracion",
    icon: Settings,
  },
];

export function BottomNavigation() {
  const pathname = usePathname();

  // Ocultar navegación en páginas públicas y dashboard (usa sidebar)
  const publicRoutes = ["/login", "/update-password", "/auth/callback", "/auth/confirm"];
  const dashboardRoutes = ["/dashboard"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isDashboardRoute = dashboardRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isPublicRoute || isDashboardRoute) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-lg safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 touch-target min-w-[60px] rounded-lg transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                <Icon className="h-6 w-6" />
              </motion.div>
              <span
                className={cn(
                  "text-xs font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

