// Supabase config and initialization
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tundonccbhcavdvzulym.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1bmRvbmNjYmhjYXZkdnp1bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3OTQ1NzIsImV4cCI6MjA2MTM3MDU3Mn0.Twt6_Pd7m8GJehC2BQhTisjM5dkXZFTbupTKUG0Tufw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
