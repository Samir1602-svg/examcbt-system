import { createClient } from '@supabase/supabase-js';

// Agar abhi Supabase keys nahi hain, toh dummy string se crash nahi hoga
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'dummy_anon_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);