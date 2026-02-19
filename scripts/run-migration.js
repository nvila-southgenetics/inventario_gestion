/**
 * Script para ejecutar la migración de soporte multi-país
 * Ejecutar con: node scripts/run-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function executeMigration() {
  console.log('🚀 Iniciando migración de soporte multi-país...\n');

  // Leer el archivo SQL
  const migrationPath = path.join(
    process.cwd(),
    'supabase',
    'migrations',
    '001_add_country_support.sql'
  );

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ No se encontró el archivo de migración en: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  // Dividir el SQL en statements individuales
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Encontrados ${statements.length} statements para ejecutar\n`);

  // Ejecutar cada statement usando el método rpc si está disponible
  // Nota: Supabase no permite ejecutar SQL arbitrario directamente
  // Necesitamos usar el SQL Editor de Supabase o una conexión directa a PostgreSQL
  
  console.log('⚠️  IMPORTANTE: Supabase no permite ejecutar SQL arbitrario desde el cliente JavaScript.');
  console.log('   Por favor, ejecuta la migración manualmente en el SQL Editor de Supabase.\n');
  console.log('📋 Pasos para ejecutar la migración:');
  console.log('   1. Abre tu proyecto en Supabase Dashboard');
  console.log('   2. Ve a SQL Editor');
  console.log('   3. Copia y pega el siguiente SQL:\n');
  console.log('─'.repeat(80));
  console.log(sql);
  console.log('─'.repeat(80));
  
  // Intentar ejecutar algunos statements básicos usando el cliente admin
  // Solo para verificar la conexión
  console.log('\n🔍 Verificando conexión a Supabase...');
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.log('⚠️  Error al verificar conexión:', error.message);
    } else {
      console.log('✅ Conexión a Supabase verificada correctamente');
    }
  } catch (err) {
    console.log('⚠️  Error al verificar conexión:', err.message);
  }
}

executeMigration().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
