/**
 * Script final para ejecutar la migración usando el cliente admin de Supabase
 * Este script ejecuta la migración SQL completa usando el método directo
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

async function executeMigration() {
  console.log('🚀 Ejecutando migración de soporte multi-país...\n');

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

  // Dividir el SQL en statements individuales
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Ejecutando ${statements.length} statements...\n`);

  // Ejecutar cada statement usando el método directo del cliente admin
  // Nota: Supabase no permite ejecutar DDL directamente, pero podemos intentar
  // usando el método rpc si hay una función disponible
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const statementWithSemicolon = statement + ';';
    
    console.log(`[${i + 1}/${statements.length}] ${statement.substring(0, 60)}...`);

    try {
      // Intentar ejecutar usando el método directo
      // Para DDL statements, necesitamos usar una función RPC o ejecutar manualmente
      const { error } = await supabase.rpc('exec_sql', { sql: statementWithSemicolon });

      if (error) {
        // Si la función no existe, intentar otro método
        console.log(`   ⚠️  No se pudo ejecutar automáticamente`);
        errorCount++;
      } else {
        console.log(`   ✅ Ejecutado correctamente`);
        successCount++;
      }
    } catch (err) {
      console.log(`   ⚠️  Error: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ Exitosos: ${successCount}`);
  console.log(`   ⚠️  Errores: ${errorCount}`);

  if (errorCount > 0) {
    console.log(`\n⚠️  IMPORTANTE:`);
    console.log(`   Supabase no permite ejecutar SQL DDL directamente desde el cliente JavaScript.`);
    console.log(`   Por favor, ejecuta la migración manualmente en el SQL Editor de Supabase.\n`);
    console.log(`📋 Pasos:`);
    console.log(`   1. Abre: https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}/sql`);
    console.log(`   2. Copia el contenido de: ${migrationPath}`);
    console.log(`   3. Pega y ejecuta el SQL\n`);
  } else {
    console.log(`\n✅ Migración completada exitosamente!`);
  }
}

executeMigration().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
