import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

console.log('Supabase Client Config:', {
  url: supabaseUrl ? 'Set' : 'Missing',
  key: supabaseAnonKey ? 'Set' : 'Missing',
  urlValue: supabaseUrl?.substring(0, 20) + '...',
  keyValue: supabaseAnonKey?.substring(0, 20) + '...'
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);