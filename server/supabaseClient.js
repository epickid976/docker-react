// Supabase client for Node.js server
const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

// Create Supabase client (prefer service role if provided)
const supabaseKey = config.supabase.serviceRoleKey || config.supabase.anonKey;
const supabase = createClient(config.supabase.url, supabaseKey);

// Test connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (err) {
    console.error('❌ Supabase connection error:', err.message);
    return false;
  }
};

module.exports = {
  supabase,
  testConnection
};
