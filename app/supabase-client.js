import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Your Supabase project credentials
const supabaseUrl = "https://yuiztwbimtowmoruxlug.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1aXp0d2JpbXRvd21vcnV4bHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MDAwMDIsImV4cCI6MjA4MDA3NjAwMn0.88PUt3STs1gA7gIrq2hwN-RDlaiz9lkhMZyhG6x8OcY";

// Create and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

console.log("✅ Supabase client initialized");