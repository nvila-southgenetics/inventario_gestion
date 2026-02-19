/**
 * Script para ejecutar la migración usando conexión directa a PostgreSQL
 * Requiere: npm install pg
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Leer variables de entorno
const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  console.error('❌ Error: Falta NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

// Extraer información de conexión de la URL de Supabase
// Formato: https://[project-ref].supabase.co
const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
if (!urlMatch) {
  console.error('❌ Error: URL de Supabase inválida');
  process.exit(1);
}

const projectRef = urlMatch[1];

// Construir la cadena de conexión de PostgreSQL
// Nota: Necesitarás la contraseña de la base de datos de Supabase
// Puedes obtenerla en: Settings > Database > Connection string
const dbConfig = {
  host: `${projectRef}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
};

async function runMigration() {
  console.log('🚀 Iniciando migración de soporte multi-país...\n');

  const migrationPath = path.join(
    process.cwd(),
    'supabase',
    'migrations',
    '001_add_country_support.sql'
  );

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ No se encontró el archivo de migración`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  if (!dbConfig.password) {
    console.error('❌ Error: Falta la contraseña de la base de datos');
    console.error('   Configura SUPABASE_DB_PASSWORD o DATABASE_PASSWORD en .env.local');
    console.error('   Puedes obtenerla en: Supabase Dashboard > Settings > Database > Connection string');
    process.exit(1);
  }

  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // Ejecutar la migración completa
    console.log('📝 Ejecutando migración SQL...\n');
    await client.query(sql);

    console.log('✅ Migración ejecutada correctamente!\n');
    
    // Verificar que las columnas se crearon
    console.log('🔍 Verificando cambios...\n');
    const tables = ['profiles', 'products', 'suppliers', 'movements', 'categories'];
    
    for (const table of tables) {
      const result = await client.query(`
        SELECT column_name, data_type, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = $1
        AND column_name = 'country_code'
      `, [table]);
      
      if (result.rows.length > 0) {
        console.log(`   ✅ ${table}.country_code existe`);
      } else {
        console.log(`   ⚠️  ${table}.country_code no encontrado`);
      }
    }

  } catch (error) {
    console.error('❌ Error al ejecutar la migración:', error.message);
    console.error('   Detalles:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Conexión cerrada');
  }
}

runMigration().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
