"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Package,
  Plus,
  AlertTriangle,
  CheckCircle2,
  History,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Product, Category } from "@/types/database";

type ProductWithCategory = Product & {
  category?: Category;
};
import { MovementSheet } from "@/components/inventory/movement-sheet";
import { ProductSheet } from "@/components/inventory/product-sheet";

export default function InventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isMovementSheetOpen, setIsMovementSheetOpen] = useState(false);
  const [isProductSheetOpen, setIsProductSheetOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("No autenticado");
      setIsLoading(false);
      return;
    }

    // Obtener organization_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Error al obtener perfil:", profileError);
      toast.error("Error al obtener información del usuario");
      setIsLoading(false);
      return;
    }

    // Cargar productos
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("name", { ascending: true });

    if (productsError) {
      console.error("Error al cargar productos:", productsError);
      toast.error("Error al cargar productos: " + productsError.message);
      setIsLoading(false);
      return;
    }

    // Cargar categorías
    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("name", { ascending: true });

    if (categoriesError) {
      console.error("Error al cargar categorías:", categoriesError);
    }

    // Mapear productos con información de categoría
    const productsWithCategory = (productsData || []).map((p: Product) => {
      const category = categories.find((c) => c.id === p.category_id);
      return {
        ...p,
        category,
      };
    });

    setProducts(productsWithCategory);
    setCategories(categoriesData || []);
    setIsLoading(false);
  }

  // Filtrar productos
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === null || product.category_id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (product: Product) => {
    const stock = product.current_stock || product.stock || 0;
    const minStock = product.min_stock || 0;

    if (stock <= 0) {
      return { status: "empty", label: "Sin Stock", variant: "destructive" as const };
    } else if (stock <= minStock) {
      return { status: "low", label: "Stock Bajo", variant: "destructive" as const };
    } else {
      return { status: "ok", label: "En Stock", variant: "default" as const };
    }
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "Sin categoría";
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Inventario</h1>
            <p className="text-slate-600 mt-1">
              Gestiona tus productos y stock
            </p>
          </div>
          <Button
            onClick={() => setIsMovementSheetOpen(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Registrar Movimiento
          </Button>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Buscar por nombre o SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Filtros por Categoría */}
        <Tabs
          value={selectedCategory?.toString() || "all"}
          onValueChange={(value) =>
            setSelectedCategory(value === "all" ? null : parseInt(value))
          }
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Todos</TabsTrigger>
            {categories.slice(0, 3).map((category) => (
              <TabsTrigger key={category.id} value={category.id.toString()}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Lista de Productos */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500">
          Cargando productos...
        </div>
      ) : filteredProducts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            {searchQuery || selectedCategory
              ? "No se encontraron productos"
              : "No hay productos"}
          </h3>
          <p className="text-slate-500 mb-6">
            {searchQuery || selectedCategory
              ? "Intenta con otros filtros de búsqueda"
              : "Comienza agregando tu primer producto"}
          </p>
          {!searchQuery && !selectedCategory && (
            <Button
              onClick={() => setIsProductSheetOpen(true)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Producto
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProducts.map((product, index) => {
            const stockStatus = getStockStatus(product);
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icono */}
                      <div className="p-3 rounded-xl bg-teal-50 flex-shrink-0">
                        <Package className="h-6 w-6 text-teal-600" />
                      </div>

                      {/* Información */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 text-lg truncate">
                              {product.name}
                            </h3>
                            <p className="text-sm text-slate-500">
                              SKU: {product.sku}
                            </p>
                          </div>
                          <Badge
                            variant={stockStatus.variant}
                            className={
                              stockStatus.status === "low"
                                ? "animate-pulse"
                                : ""
                            }
                          >
                            {stockStatus.label}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 mt-3">
                          <div>
                            <span className="text-sm text-slate-600">Stock: </span>
                            <span
                              className={`font-bold text-lg ${
                                stockStatus.status === "empty"
                                  ? "text-red-600"
                                  : stockStatus.status === "low"
                                  ? "text-orange-600"
                                  : "text-teal-600"
                              }`}
                            >
                              {product.current_stock || product.stock || 0}
                            </span>
                            {product.min_stock > 0 && (
                              <span className="text-sm text-slate-500 ml-1">
                                / Mín: {product.min_stock}
                              </span>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getCategoryName(product.category_id)}
                          </Badge>
                        </div>

                        {product.description && (
                          <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                            {product.description}
                          </p>
                        )}

                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              router.push(`/dashboard/history?product_id=${product.id}`);
                            }}
                          >
                            <History className="mr-1 h-3 w-3" />
                            Ver Historial
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Sheet de Registro de Movimientos */}
      <MovementSheet
        open={isMovementSheetOpen}
        onOpenChange={setIsMovementSheetOpen}
        products={products}
        onSuccess={() => {
          loadData();
          setIsMovementSheetOpen(false);
        }}
      />

      {/* Sheet de Crear Producto */}
      <ProductSheet
        open={isProductSheetOpen}
        onOpenChange={setIsProductSheetOpen}
        onSuccess={() => {
          loadData();
          // No cerrar aquí, el componente ya lo hace
        }}
      />
    </div>
  );
}

