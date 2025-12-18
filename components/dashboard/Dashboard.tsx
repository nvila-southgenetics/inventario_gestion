"use client";

import { motion } from "framer-motion";
import { Package, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  kitsMock,
  movimientosMock,
  getKitsBajosStock,
  getTotalKits,
  formatFecha,
  type Movimiento,
} from "@/lib/mock-data";

export function Dashboard() {
  const totalKits = getTotalKits(kitsMock);
  const kitsBajos = getKitsBajosStock(kitsMock);
  const ultimosMovimientos = movimientosMock.slice(0, 5);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <motion.div
        className="container mx-auto px-4 py-6 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            SouthGenetics Inventory
          </h1>
          <p className="text-muted-foreground">
            Sistema de gestión de inventario
          </p>
        </motion.div>

        {/* Tarjetas de Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.div variants={itemVariants}>
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium text-muted-foreground">
                  Total de Kits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">
                      {totalKits}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Kits en stock
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-salida/20 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium text-muted-foreground">
                  Kits Bajos en Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-salida/10">
                    <AlertTriangle className="h-6 w-6 text-salida" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">
                      {kitsBajos.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Requieren atención
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Últimos Movimientos */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Últimos Movimientos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ultimosMovimientos.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay movimientos recientes
                  </p>
                ) : (
                  ultimosMovimientos.map((movimiento) => (
                    <MovimientoItem
                      key={movimiento.id}
                      movimiento={movimiento}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

function MovimientoItem({ movimiento }: { movimiento: Movimiento }) {
  const isEntrada = movimiento.tipo === "Entrada";
  const Icon = isEntrada ? TrendingUp : TrendingDown;

  return (
    <motion.div
      className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-3 flex-1">
        <div
          className={`p-2 rounded-lg ${
            isEntrada ? "bg-entrada-light" : "bg-salida-light"
          }`}
        >
          <Icon
            className={`h-5 w-5 ${
              isEntrada ? "text-entrada" : "text-salida"
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">
            {movimiento.kitNombre}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant={
                movimiento.categoria === "Oncológico"
                  ? "oncologico"
                  : "ginecologico"
              }
            >
              {movimiento.categoria}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatFecha(movimiento.fecha)}
            </span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p
          className={`font-bold text-lg ${
            isEntrada ? "text-entrada" : "text-salida"
          }`}
        >
          {isEntrada ? "+" : "-"}
          {movimiento.cantidad}
        </p>
        <p className="text-xs text-muted-foreground">{movimiento.tipo}</p>
      </div>
    </motion.div>
  );
}



