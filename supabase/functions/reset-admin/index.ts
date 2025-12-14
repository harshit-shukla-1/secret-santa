import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
      }
    )

    // 1. Find existing admin user
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const adminUser = users.find(u => u.email === 'admin@secretsanta.app');
    
    // 2. Delete if exists
    if (adminUser) {
        console.log("Deleting existing admin user:", adminUser.id);
        await supabaseAdmin.auth.admin.deleteUser(adminUser.id);
    }

    // 3. Create new admin user
    console.log("Creating new admin user");
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@secretsanta.app',
      password: 'admin123',
      email_confirm: true,
      user_metadata: { username: 'admin', role: 'admin', avatar: '🎅' }
    })

    if (error) throw error;

    // 4. Ensure profile exists (in case trigger failed or race condition)
    if (data.user) {
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: data.user.id,
                username: 'admin',
                role: 'admin',
                avatar: '🎅'
            });
            
        if (profileError) {
            console.error("Profile creation error:", profileError);
            // Don't fail the request, auth user is created
        }
    }

    return new Response(JSON.stringify({ message: "Admin reset successfully" }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })

  } catch (error) {
    console.error("Reset error:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})