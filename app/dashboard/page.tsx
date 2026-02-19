"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package,
  AlertTriangle,
  Activity,
  Truck,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Product, Movement, Profile } from "@/types/database";

type LowStockProduct = Product & {
  alert_level: "critical" | "warning";
};

type RecentMovement = Movement & {
  products: { name: string; sku: string } | null;
  profiles: { email: string } | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    topSupplier: null as string | null,
    movementsToday: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [recentMovements, setRecentMovements] = useState<RecentMovement[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("No autenticado");
      setIsLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, country_code")
      .eq("id", user.id)
      .single();

    if (!profile) {
      setIsLoading(false);
      return;
    }

    const countryCode = profile.country_code || "MX";

    // Cargar estadísticas
    const [productsResult, lowStockResult, movementsResult, topSupplierResult] =
      await Promise.all([
        // Total productos
        supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", profile.organization_id)
          .eq("country_code", countryCode),
            // Productos con stock bajo (filtramos en el cliente por ahora)
        supabase
          .from("products")
          .select("*")
          .eq("organization_id", profile.organization_id)
          .eq("country_code", countryCode)
          .order("current_stock", { ascending: true }),
        // Movimientos de hoy
        (async () => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return supabase
            .from("movements")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", profile.organization_id)
            .eq("country_code", countryCode)
            .gte("created_at", today.toISOString());
        })(),
        // Proveedor top
        supabase.rpc("get_top_supplier_last_month", {
          org_id: profile.organization_id,
        }),
      ]);

    // Últimos 5 movimientos
    const { data: movements } = await supabase
      .from("movements")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .eq("country_code", countryCode)
      .order("created_at", { ascending: false })
      .limit(5);

    if (movements && movements.length > 0) {
      const productIds = [...new Set(movements.map((m) => m.product_id))];
      const userIds = [...new Set(movements.map((m) => m.created_by).filter(Boolean))];

      const { data: products } = await supabase
        .from("products")
        .select("id, name, sku")
        .in("id", productIds);

      const { data: profiles } = userIds.length > 0
        ? await supabase.from("profiles").select("id, email").in("id", userIds)
        : { data: [] };

      const movementsWithDetails = movements.map((movement) => ({
        ...movement,
        products: products?.find((p) => p.id === movement.product_id) || null,
        profiles: profiles?.find((p) => p.id === movement.created_by) || null,
      }));

      setRecentMovements(movementsWithDetails);
    }

    // Filtrar productos con stock bajo en el cliente
    const lowStockProductsFiltered = (lowStockResult.data || []).filter(
      (product) => (product.current_stock || 0) <= (product.min_stock || 0)
    );

    setStats({
      totalProducts: productsResult.count || 0,
      lowStockCount: lowStockProductsFiltered.length,
      topSupplier:
        topSupplierResult.data && topSupplierResult.data.length > 0
          ? topSupplierResult.data[0].supplier_name
          : null,
      movementsToday: movementsResult.count || 0,
    });

    const lowStockWithAlert = lowStockProductsFiltered.map((product) => ({
      ...product,
      alert_level: (product.current_stock || 0) === 0 ? "critical" : "warning",
    }));

    setLowStockProducts(lowStockWithAlert);
    setIsLoading(false);
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Hace un momento";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inventario */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Inventario
              </CardTitle>
              <Package className="h-5 w-5 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {isLoading ? "..." : stats.totalProducts}
              </div>
              <p className="text-xs text-slate-500 mt-1">Productos registrados</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Alertas de Stock */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Alertas de Stock
              </CardTitle>
              <AlertTriangle
                className={`h-5 w-5 ${
                  stats.lowStockCount > 0 ? "text-red-600" : "text-slate-400"
                }`}
              />
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${
                  stats.lowStockCount > 0 ? "text-red-600" : "text-slate-900"
                }`}
              >
                {isLoading ? "..." : stats.lowStockCount}
              </div>
              <p className="text-xs text-slate-500 mt-1">Requieren atención</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Movimientos Hoy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Movimientos Hoy
              </CardTitle>
              <Activity className="h-5 w-5 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {isLoading ? "..." : stats.movementsToday}
              </div>
              <p className="text-xs text-slate-500 mt-1">Registrados hoy</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Proveedor Top */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Proveedor Top
              </CardTitle>
              <Truck className="h-5 w-5 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-slate-900 truncate">
                {isLoading ? "..." : stats.topSupplier || "N/A"}
              </div>
              <p className="text-xs text-slate-500 mt-1">Último mes</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Paneles Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna Izquierda: Alertas Críticas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Requieren Atención
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-slate-500">
                  Cargando alertas...
                </div>
              ) : lowStockProducts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 mb-4">
                    <Package className="h-8 w-8 text-teal-600" />
                  </div>
                  <p className="text-slate-600 font-medium">
                    ¡Todo en orden!
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    No hay productos con stock bajo
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-slate-600">
                            Stock:{" "}
                            <span className="font-bold text-red-600">
                              {product.current_stock || 0}
                            </span>
                          </span>
                          <span className="text-sm text-slate-500">
                            Mín: {product.min_stock || 0}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/dashboard/suppliers")}
                        className="ml-3"
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Pedir
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Columna Derecha: Actividad Reciente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-600" />
                Últimos Movimientos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-slate-500">
                  Cargando actividad...
                </div>
              ) : recentMovements.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                    <Activity className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-medium">
                    Sin actividad reciente
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Los movimientos aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentMovements.map((movement) => {
                    const isEntrada = movement.type === "Entrada";
                    return (
                      <div
                        key={movement.id}
                        className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white"
                      >
                        <div
                          className={`p-2 rounded-lg ${
                            isEntrada
                              ? "bg-emerald-100"
                              : "bg-orange-100"
                          }`}
                        >
                          {isEntrada ? (
                            <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <ArrowUpCircle className="h-4 w-4 text-orange-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 text-sm">
                            {movement.products?.name || "Producto eliminado"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                isEntrada
                                  ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                                  : "border-orange-200 text-orange-700 bg-orange-50"
                              }`}
                            >
                              {isEntrada ? "Entrada" : "Salida"}
                            </Badge>
                            <span
                              className={`font-bold text-sm ${
                                isEntrada ? "text-emerald-600" : "text-orange-600"
                              }`}
                            >
                              {isEntrada ? "+" : "-"}
                              {movement.quantity}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(movement.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
