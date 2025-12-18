export type Categoria = "Oncológico" | "Ginecológico";
export type TipoMovimiento = "Entrada" | "Salida";

export interface Kit {
  id: string;
  nombre: string;
  categoria: Categoria;
  stock: number;
  sku: string;
  stockMinimo?: number;
}

export interface Movimiento {
  id: string;
  tipo: TipoMovimiento;
  kitId: string;
  kitNombre: string;
  cantidad: number;
  fecha: Date;
  categoria: Categoria;
}

// Datos mock de kits
export const kitsMock: Kit[] = [
  {
    id: "1",
    nombre: "Kit BRCA1/2",
    categoria: "Oncológico",
    stock: 15,
    sku: "SG-ONC-001",
    stockMinimo: 10,
  },
  {
    id: "2",
    nombre: "Test VPH",
    categoria: "Ginecológico",
    stock: 8,
    sku: "SG-GIN-001",
    stockMinimo: 5,
  },
  {
    id: "3",
    nombre: "Kit TP53",
    categoria: "Oncológico",
    stock: 22,
    sku: "SG-ONC-002",
    stockMinimo: 10,
  },
  {
    id: "4",
    nombre: "Test Papanicolaou Avanzado",
    categoria: "Ginecológico",
    stock: 3,
    sku: "SG-GIN-002",
    stockMinimo: 5,
  },
  {
    id: "5",
    nombre: "Kit EGFR",
    categoria: "Oncológico",
    stock: 18,
    sku: "SG-ONC-003",
    stockMinimo: 10,
  },
  {
    id: "6",
    nombre: "Test Hormonal Completo",
    categoria: "Ginecológico",
    stock: 12,
    sku: "SG-GIN-003",
    stockMinimo: 5,
  },
];

// Datos mock de movimientos recientes
export const movimientosMock: Movimiento[] = [
  {
    id: "m1",
    tipo: "Entrada",
    kitId: "1",
    kitNombre: "Kit BRCA1/2",
    cantidad: 5,
    fecha: new Date(2025, 11, 16, 10, 30),
    categoria: "Oncológico",
  },
  {
    id: "m2",
    tipo: "Salida",
    kitId: "2",
    kitNombre: "Test VPH",
    cantidad: 2,
    fecha: new Date(2025, 11, 16, 9, 15),
    categoria: "Ginecológico",
  },
  {
    id: "m3",
    tipo: "Entrada",
    kitId: "3",
    kitNombre: "Kit TP53",
    cantidad: 10,
    fecha: new Date(2025, 11, 15, 16, 45),
    categoria: "Oncológico",
  },
  {
    id: "m4",
    tipo: "Salida",
    kitId: "4",
    kitNombre: "Test Papanicolaou Avanzado",
    cantidad: 1,
    fecha: new Date(2025, 11, 15, 14, 20),
    categoria: "Ginecológico",
  },
  {
    id: "m5",
    tipo: "Salida",
    kitId: "1",
    kitNombre: "Kit BRCA1/2",
    cantidad: 3,
    fecha: new Date(2025, 11, 14, 11, 0),
    categoria: "Oncológico",
  },
];

// Funciones helper
export function getKitsBajosStock(kits: Kit[]): Kit[] {
  return kits.filter(
    (kit) => kit.stockMinimo && kit.stock <= kit.stockMinimo
  );
}

export function getTotalKits(kits: Kit[]): number {
  return kits.reduce((total, kit) => total + kit.stock, 0);
}

export function formatFecha(fecha: Date): string {
  const ahora = new Date();
  const diffMs = ahora.getTime() - fecha.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  
  return fecha.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
}



