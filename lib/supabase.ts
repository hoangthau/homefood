import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Post {
  id: string;
  content: string;
  image_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  username: string;
  created_at: string;
}
