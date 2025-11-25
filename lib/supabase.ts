import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

if (supabaseUrl === 'https://placeholder.supabase.co') {
    console.warn('WARNING: Using placeholder Supabase URL. Please set NEXT_PUBLIC_SUPABASE_URL in .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseKey);