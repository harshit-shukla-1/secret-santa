import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fuzbtkvanlqyqerabkwo.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1emJ0a3ZhbmxxeXFlcmFia3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzIwODcsImV4cCI6MjA4MTMwODA4N30.Bio3ORgA7YrkCoyD8wSHexpIlvYVp2DhMQL32r949WA';

export const supabase = createClient(supabaseUrl, supabaseKey);