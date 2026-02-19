/**
 * Script para ejecutar la migración de soporte multi-país usando el cliente admin de Supabase
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Error: Faltan variables de entorno");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl);
  console.error("SUPABASE_SERVICE_ROLE_KEY:", !!serviceRoleKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function executeSQL(sql: string): Promise<void> {
  // Dividir el SQL en statements individuales
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  console.log(`📝 Ejecutando ${statements.length} statements...\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.length === 0) continue;

    try {
      // Ejecutar cada statement usando rpc o directamente
      // Nota: Supabase no tiene un método directo para ejecutar SQL arbitrario
      // Necesitamos usar el método rpc si existe una función, o ejecutar directamente
      const { error } = await supabase.rpc("exec_sql", { sql: statement + ";" });

      if (error) {
        // Si la función exec_sql no existe, intentar ejecutar directamente
        // Esto requiere usar el cliente de PostgreSQL directamente
        console.warn(`⚠️  Statement ${i + 1} requiere ejecución manual`);
        console.warn(`   SQL: ${statement.substring(0, 100)}...`);
        console.warn(`   Error: ${error.message}`);
      } else {
        console.log(`✅ Statement ${i + 1} ejecutado correctamente`);
      }
    } catch (err: any) {
      console.error(`❌ Error en statement ${i + 1}:`, err.message);
      console.error(`   SQL: ${statement.substring(0, 100)}...`);
    }
  }
}

async function runMigration() {
  console.log("🚀 Iniciando migración de soporte multi-país...\n");

  // Leer el archivo SQL
  const migrationPath = path.join(
    process.cwd(),
    "supabase",
    "migrations",
    "001_add_country_support.sql"
  );

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ No se encontró el archivo de migración en: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, "utf-8");

  // Ejecutar la migración
  await executeSQL(sql);

  console.log("\n✨ Migración completada!");
  console.log(
    "\n⚠️  NOTA: Algunos statements pueden requerir ejecución manual en el SQL Editor de Supabase"
  );
  console.log(`   Archivo: ${migrationPath}`);
}

runMigration().catch((error) => {
  console.error("❌ Error fatal:", error);
  process.exit(1);
});
