import { supabase } from './src/lib/supabase';

/**
 * Test script to verify Supabase connection
 * Run this to check if your database is properly configured
 */

export async function testDatabaseConnection() {
  console.log('🔄 Testing Supabase connection...');
  
  try {
    // Test 1: Check if we can reach Supabase
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth connection failed:', authError.message);
      return false;
    }
    
    console.log('✅ Auth connection OK');
    
    // Test 2: Check if profiles table exists and is accessible
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (profilesError) {
      console.error('❌ Profiles table error:', profilesError.message);
      console.log('💡 Make sure you have created the profiles table in Supabase');
      return false;
    }
    
    console.log('✅ Profiles table accessible');
    
    // Test 3: Check if posts table exists
    const { error: postsError } = await supabase
      .from('posts')
      .select('count', { count: 'exact', head: true });
    
    if (postsError) {
      console.error('❌ Posts table error:', postsError.message);
      console.log('💡 Make sure you have created the posts table');
    } else {
      console.log('✅ Posts table accessible');
    }
    
    // Test 4: Check if messages table exists
    const { error: messagesError } = await supabase
      .from('messages')
      .select('count', { count: 'exact', head: true });
    
    if (messagesError) {
      console.error('❌ Messages table error:', messagesError.message);
    } else {
      console.log('✅ Messages table accessible');
    }
    
    // Test 5: Check if storage buckets exist
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    
    if (storageError) {
      console.error('❌ Storage error:', storageError.message);
    } else {
      console.log('✅ Storage accessible. Buckets:', buckets.map(b => b.name).join(', ') || 'None');
      
      const requiredBuckets = ['avatars', 'post-images', 'story-images', 'cover-images'];
      const existingBuckets = buckets.map(b => b.name);
      const missingBuckets = requiredBuckets.filter(b => !existingBuckets.includes(b));
      
      if (missingBuckets.length > 0) {
        console.log('⚠️ Missing storage buckets:', missingBuckets.join(', '));
        console.log('💡 Create them in Supabase Dashboard > Storage');
      }
    }
    
    console.log('\n✅ Database connection test completed!');
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run test if executed directly
if (require.main === module) {
  testDatabaseConnection();
}
