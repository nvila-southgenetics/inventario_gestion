/**
 * Script para ejecutar la migración usando el cliente admin de Supabase
 * Ejecuta la migración SQL completa usando el método directo
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leer variables de entorno desde .env.local
const envFile = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
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
  console.log('🚀 Ejecutando migración de soporte multi-país usando cliente admin...\n');

  const migrationPath = join(
    __dirname,
    '..',
    'supabase',
    'migrations',
    '001_add_country_support.sql'
  );

  const sql = readFileSync(migrationPath, 'utf-8');

  console.log('⚠️  IMPORTANTE:');
  console.log('   Supabase no permite ejecutar SQL DDL (ALTER TABLE, CREATE INDEX, etc.)');
  console.log('   directamente desde el cliente JavaScript por razones de seguridad.\n');
  console.log('✅ SOLUCIÓN RECOMENDADA:');
  console.log('   Ejecuta la migración manualmente en el SQL Editor de Supabase.\n');
  console.log('📋 URL del SQL Editor:');
  const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (projectId) {
    console.log(`   https://supabase.com/dashboard/project/${projectId}/sql/new\n`);
  }
  console.log('📝 Contenido de la migración:\n');
  console.log('─'.repeat(80));
  console.log(sql);
  console.log('─'.repeat(80));
  console.log('\n💡 Copia el SQL de arriba y pégalo en el SQL Editor de Supabase para ejecutarlo.\n');
}

executeMigration().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
