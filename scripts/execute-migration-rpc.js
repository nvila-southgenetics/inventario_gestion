/**
 * Script para ejecutar la migración usando el cliente admin de Supabase
 * Primero crea una función RPC que ejecute SQL, luego ejecuta la migración
 */

const { createClient } = require('@supabase/supabase-js');
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
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createExecSQLFunction() {
  // Crear función RPC que ejecute SQL
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_text text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_text;
    END;
    $$;
  `;

  console.log('📝 Creando función RPC exec_sql...\n');
  
  // Intentar ejecutar usando el método directo
  // Nota: Esto requiere permisos especiales y puede no funcionar
  try {
    // Usar el método rpc para crear la función
    const { error } = await supabase.rpc('exec_sql', { sql_text: createFunctionSQL });
    if (error) {
      console.log('⚠️  No se pudo crear la función automáticamente');
      console.log('   Esto es normal - Supabase no permite crear funciones desde el cliente\n');
      return false;
    }
    console.log('✅ Función creada correctamente\n');
    return true;
  } catch (err) {
    console.log('⚠️  No se pudo crear la función automáticamente');
    console.log('   Esto es normal - Supabase no permite crear funciones desde el cliente\n');
    return false;
  }
}

async function executeMigration() {
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

  // Intentar crear la función RPC primero
  const functionCreated = await createExecSQLFunction();

  if (!functionCreated) {
    console.log('⚠️  IMPORTANTE:');
    console.log('   Supabase no permite ejecutar SQL DDL directamente desde el cliente JavaScript.');
    console.log('   Por favor, ejecuta la migración manualmente en el SQL Editor de Supabase.\n');
    console.log('📋 Pasos para ejecutar la migración:');
    console.log('   1. Abre tu proyecto en Supabase Dashboard');
    console.log('   2. Ve a SQL Editor');
    console.log('   3. Copia y pega el siguiente SQL:\n');
    console.log('─'.repeat(80));
    console.log(sql);
    console.log('─'.repeat(80));
    console.log('\n   4. Haz clic en "Run" para ejecutar la migración\n');
    return;
  }

  // Si la función existe, intentar ejecutar la migración
  console.log('📝 Ejecutando migración usando función RPC...\n');
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_text: sql });
    if (error) {
      console.error('❌ Error al ejecutar la migración:', error.message);
      console.log('\n💡 Por favor, ejecuta la migración manualmente en el SQL Editor de Supabase.');
      return;
    }
    console.log('✅ Migración ejecutada correctamente!\n');
  } catch (err) {
    console.error('❌ Error al ejecutar la migración:', err.message);
    console.log('\n💡 Por favor, ejecuta la migración manualmente en el SQL Editor de Supabase.');
  }
}

executeMigration().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
