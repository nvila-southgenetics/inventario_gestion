"use server";

import { createClient } from "@/lib/supabase/server";
import type { Product, Movement, Profile } from "@/types/database";

export interface LowStockAlert extends Product {
  alert_level: "critical" | "warning";
}

export interface RecentActivity extends Movement {
  products: { name: string; sku: string } | null;
  profiles: { email: string } | null;
}

export interface DashboardStats {
  totalProducts: number;
  lowStockCount: number;
  topSupplier: string | null;
  movementsToday: number;
}

export async function getLowStockAlerts(): Promise<LowStockAlert[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, country_code")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return [];
  }

  const countryCode = profile.country_code || "MX";

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .eq("country_code", countryCode)
    .order("current_stock", { ascending: true });

  if (error) {
    console.error("Error al obtener alertas de stock:", error);
    return [];
  }

  // Filtrar productos con stock bajo en el cliente
  const lowStockProducts = (products || []).filter(
    (product) => (product.current_stock || 0) <= (product.min_stock || 0)
  );

  return lowStockProducts.map((product) => ({
    ...product,
    alert_level: product.current_stock === 0 ? "critical" : "warning",
  }));
}

export async function getRecentActivity(): Promise<RecentActivity[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, country_code")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return [];
  }

  const countryCode = profile.country_code || "MX";

  // Obtener últimos 5 movimientos
  const { data: movements, error } = await supabase
    .from("movements")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .eq("country_code", countryCode)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error || !movements) {
    return [];
  }

  // Obtener productos y perfiles relacionados
  const productIds = [...new Set(movements.map((m) => m.product_id))];
  const userIds = [...new Set(movements.map((m) => m.created_by).filter(Boolean))];

  const { data: products } = await supabase
    .from("products")
    .select("id, name, sku")
    .in("id", productIds);

  const { data: profiles } = userIds.length > 0
    ? await supabase.from("profiles").select("id, email").in("id", userIds)
    : { data: [] };

  return movements.map((movement) => ({
    ...movement,
    products: products?.find((p) => p.id === movement.product_id) || null,
    profiles: profiles?.find((p) => p.id === movement.created_by) || null,
  }));
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      totalProducts: 0,
      lowStockCount: 0,
      topSupplier: null,
      movementsToday: 0,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, country_code")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return {
      totalProducts: 0,
      lowStockCount: 0,
      topSupplier: null,
      movementsToday: 0,
    };
  }

  const countryCode = profile.country_code || "MX";

  // Total de productos
  const { count: totalProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", profile.organization_id)
    .eq("country_code", countryCode);

  // Productos con stock bajo (obtener todos y filtrar en cliente)
  const { data: allProducts } = await supabase
    .from("products")
    .select("id, current_stock, min_stock")
    .eq("organization_id", profile.organization_id)
    .eq("country_code", countryCode);
  
  const lowStockCount = (allProducts || []).filter(
    (product) => (product.current_stock || 0) <= (product.min_stock || 0)
  ).length;

  // Movimientos de hoy
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: movementsToday } = await supabase
    .from("movements")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", profile.organization_id)
    .eq("country_code", countryCode)
    .gte("created_at", today.toISOString());

  // Proveedor top usando la función RPC
  const { data: topSupplierData } = await supabase.rpc(
    "get_top_supplier_last_month",
    { org_id: profile.organization_id }
  );

  const topSupplier =
    topSupplierData && topSupplierData.length > 0
      ? topSupplierData[0].supplier_name
      : null;

  return {
    totalProducts: totalProducts || 0,
    lowStockCount: lowStockCount || 0,
    topSupplier,
    movementsToday: movementsToday || 0,
  };
}



