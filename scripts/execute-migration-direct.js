/**
 * Script para ejecutar la migración directamente usando el cliente admin de Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer variables de entorno directamente desde .env.local
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

async function executeSQLStatement(statement) {
  // Intentar ejecutar usando rpc si hay una función disponible
  // Si no, intentar ejecutar directamente
  try {
    // Para ALTER TABLE, CREATE INDEX, etc., necesitamos usar el método directo
    // Supabase no permite ejecutar DDL directamente desde el cliente JavaScript
    // Necesitamos usar el SQL Editor o una conexión directa a PostgreSQL
    
    // Intentar ejecutar usando el método from() para queries SELECT
    if (statement.toUpperCase().startsWith('SELECT')) {
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
      if (!error) return { success: true };
    }
    
    // Para otros statements, necesitamos ejecutarlos manualmente
    return { success: false, needsManual: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

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
  
  console.log('📋 Contenido de la migración SQL:\n');
  console.log('─'.repeat(80));
  console.log(sql);
  console.log('─'.repeat(80));
  
  console.log('\n⚠️  IMPORTANTE:');
  console.log('   Supabase no permite ejecutar SQL DDL (ALTER TABLE, CREATE INDEX, etc.)');
  console.log('   directamente desde el cliente JavaScript por razones de seguridad.\n');
  console.log('✅ SOLUCIÓN: Ejecutar la migración usando el cliente admin de Supabase');
  console.log('   mediante una función RPC o ejecutarla manualmente en el SQL Editor.\n');
  
  // Intentar ejecutar usando el método directo del cliente admin
  // Dividir el SQL en statements y ejecutarlos uno por uno
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Encontrados ${statements.length} statements\n`);
  
  // Intentar ejecutar cada statement usando el cliente admin
  // Nota: Esto solo funcionará si hay una función RPC que ejecute SQL
  // De lo contrario, necesitaremos ejecutarlo manualmente
  
  let executed = 0;
  let needsManual = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`[${i + 1}/${statements.length}] Ejecutando: ${statement.substring(0, 60)}...`);
    
    try {
      // Intentar ejecutar usando una función RPC si existe
      // Primero, intentar crear una función temporal que ejecute SQL
      const result = await executeSQLStatement(statement);
      
      if (result.success) {
        console.log(`   ✅ Ejecutado correctamente\n`);
        executed++;
      } else if (result.needsManual) {
        console.log(`   ⚠️  Requiere ejecución manual\n`);
        needsManual++;
      } else {
        console.log(`   ⚠️  Error: ${result.error}\n`);
        needsManual++;
      }
    } catch (err) {
      console.log(`   ⚠️  Error: ${err.message}\n`);
      needsManual++;
    }
  }
  
  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ Ejecutados: ${executed}`);
  console.log(`   ⚠️  Requieren ejecución manual: ${needsManual}`);
  
  if (needsManual > 0) {
    console.log(`\n💡 Para ejecutar los statements restantes:`);
    console.log(`   1. Abre el SQL Editor en Supabase Dashboard`);
    console.log(`   2. Copia y pega el SQL completo del archivo de migración`);
    console.log(`   3. Ejecuta el SQL`);
  }
}

runMigration().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
