import { createClient } from '@supabase/supabase-js';

// Obtenha essas credenciais em: https://app.supabase.com
const supabaseUrl = 'https://hndeyarwwlezfyfuhimr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuZGV5YXJ3d2xlemZ5ZnVoaW1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTk0NjAsImV4cCI6MjA3NzQ5NTQ2MH0.6qSfpUow0QSndZSJrYsdKJKnqpS1dJNbDgk11iJMDDE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
