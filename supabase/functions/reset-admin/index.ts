import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
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

    // 1. Check if admin exists
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
        throw new Error(`Failed to list users: ${listError.message}`);
    }

    const adminEmail = 'admin@secretsanta.app';
    const adminUser = users.find(u => u.email === adminEmail);
    
    let userId;

    if (adminUser) {
        console.log("Admin exists, updating password...");
        userId = adminUser.id;
        // Update existing user
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { 
                password: 'admin123',
                email_confirm: true,
                user_metadata: { username: 'admin', role: 'admin', avatar: '🎅' }
            }
        );
        if (updateError) throw updateError;
    } else {
        console.log("Creating new admin user...");
        // Create new user
        const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: adminEmail,
            password: 'admin123',
            email_confirm: true,
            user_metadata: { username: 'admin', role: 'admin', avatar: '🎅' }
        });
        if (createError) throw createError;
        userId = createData.user.id;
    }

    // 2. Ensure profile exists and is correct
    if (userId) {
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                username: 'admin',
                role: 'admin',
                avatar: '🎅'
            });
            
        if (profileError) {
            console.error("Profile sync error:", profileError);
            // We continue even if profile sync fails, as auth is the priority
        }
    }

    return new Response(JSON.stringify({ message: "Admin reset successfully" }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })

  } catch (error) {
    console.error("Reset execution error:", error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error occurred' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})