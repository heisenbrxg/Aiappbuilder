import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  console.log('🚀 Starting Supabase migrations for Starsky...\n');

  try {
    // Migration 1: Create tables
    console.log('📋 Running migration 001: Create user data tables...');
    const migration1 = readFileSync(
      join(__dirname, '../supabase/migrations/001_create_user_data_tables.sql'),
      'utf8'
    );
    
    const { error: error1 } = await supabase.rpc('exec_sql', { sql: migration1 });
    if (error1) {
      console.error('❌ Migration 001 failed:', error1);
      throw error1;
    }
    console.log('✅ Migration 001 completed successfully');

    // Migration 2: Create RLS policies
    console.log('🔒 Running migration 002: Create RLS policies...');
    const migration2 = readFileSync(
      join(__dirname, '../supabase/migrations/002_create_rls_policies.sql'),
      'utf8'
    );
    
    const { error: error2 } = await supabase.rpc('exec_sql', { sql: migration2 });
    if (error2) {
      console.error('❌ Migration 002 failed:', error2);
      throw error2;
    }
    console.log('✅ Migration 002 completed successfully');

    console.log('\n🎉 All migrations completed successfully!');
    console.log('\n📊 Database schema is ready for Starsky');
    
    // Verify tables were created
    console.log('\n🔍 Verifying database schema...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['user_profiles', 'user_chats', 'chat_snapshots', 'user_settings']);

    if (tablesError) {
      console.warn('⚠️  Could not verify tables:', tablesError);
    } else {
      console.log('✅ Verified tables:', tables.map(t => t.table_name).join(', '));
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Alternative method: Run SQL directly if exec_sql RPC doesn't exist
async function runMigrationsDirectly() {
  console.log('🚀 Running migrations directly via SQL execution...\n');

  try {
    // Read and execute migration files
    const migrations = [
      {
        name: '001_create_user_data_tables.sql',
        description: 'Create user data tables'
      },
      {
        name: '002_create_rls_policies.sql', 
        description: 'Create RLS policies'
      }
    ];

    for (const migration of migrations) {
      console.log(`📋 Running ${migration.name}: ${migration.description}...`);
      
      const sql = readFileSync(
        join(__dirname, '../supabase/migrations', migration.name),
        'utf8'
      );

      // Split SQL into individual statements and execute them
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('/*') && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (error) {
            console.error(`❌ Failed to execute statement: ${statement.substring(0, 100)}...`);
            console.error('Error:', error);
            throw error;
          }
        }
      }
      
      console.log(`✅ ${migration.name} completed successfully`);
    }

    console.log('\n🎉 All migrations completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.log('\n💡 You may need to run these SQL statements manually in your Supabase dashboard:');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Go to SQL Editor');
    console.log('   4. Copy and paste the contents of each migration file');
    process.exit(1);
  }
}

// Try the RPC method first, fall back to direct execution
runMigrations().catch(() => {
  console.log('\n🔄 Trying alternative migration method...');
  runMigrationsDirectly();
});
