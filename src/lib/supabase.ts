import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://grudfrtojmllelbhefms.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdydWRmcnRvam1sbGVsYmhlZm1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNDIwMTAsImV4cCI6MjA4MDYxODAxMH0.X-JHCmKcBWp7Y3drAxBKUErR2RilBewdMuR_GeGtlL0';

if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
  console.error('Supabase URL is missing or placeholder. Check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
