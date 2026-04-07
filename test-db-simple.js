// Test simple de connexion Supabase (fonctionne avec Node.js)
// Usage: node test-db-simple.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERREUR: Variables d\'environnement manquantes');
  console.log('Créer un fichier .env avec:');
  console.log('EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co');
  console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-cle');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔄 Test de connexion à Supabase...\n');

  try {
    // Test 1: Auth
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('❌ Erreur Auth:', authError.message);
      return;
    }
    console.log('✅ Connexion Auth OK');

    // Test 2: Tables
    const tables = [
      'profiles',
      'posts',
      'stories',
      'messages',
      'conversations',
      'student_groups',
      'likes',
      'comments'
    ];

    console.log('\n📊 Test des tables:');
    for (const table of tables) {
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      if (error) {
        console.log(`  ❌ ${table}: ${error.message}`);
      } else {
        console.log(`  ✅ ${table}`);
      }
    }

    // Test 3: Storage
    console.log('\n🪣 Test Storage:');
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    if (storageError) {
      console.log(`  ❌ Storage: ${storageError.message}`);
    } else {
      console.log(`  ✅ Buckets: ${buckets.map(b => b.name).join(', ') || 'Aucun'}`);
    }

    console.log('\n✅ Test terminé!');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testConnection();
