// Server configuration
require('dotenv').config();

const config = {
  port: process.env.PORT || 5002,
  nodeEnv: process.env.NODE_ENV || 'development',
  supabase: {
    url: process.env.SUPABASE_URL || 'your_supabase_url_here',
    anonKey: process.env.SUPABASE_ANON_KEY || 'your_supabase_anon_key_here',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  }
};

// Validate required environment variables
if (config.supabase.url === 'your_supabase_url_here' || config.supabase.anonKey === 'your_supabase_anon_key_here') {
  console.warn('⚠️  Supabase configuration not found. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
  console.warn('   You can create a .env file in the server directory with:');
  console.warn('   SUPABASE_URL=your_actual_supabase_url');
  console.warn('   SUPABASE_ANON_KEY=your_actual_supabase_anon_key');
}

module.exports = config;
