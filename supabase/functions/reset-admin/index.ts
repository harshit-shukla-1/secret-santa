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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error(`Missing Env Vars: URL=${!!supabaseUrl}, KEY=${!!supabaseServiceKey}`);
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
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
        throw new Error(`List Users Error: ${listError.message}`);
    }

    const adminEmail = 'admin@secretsanta.app';
    const adminUser = users.find(u => u.email === adminEmail);
    
    let userId;

    if (adminUser) {
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
        if (updateError) throw new Error(`Update User Error: ${updateError.message}`);
    } else {
        // Create new user
        const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: adminEmail,
            password: 'admin123',
            email_confirm: true,
            user_metadata: { username: 'admin', role: 'admin', avatar: '🎅' }
        });
        if (createError) throw new Error(`Create User Error: ${createError.message}`);
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
             // If this fails, it might be RLS, but service role bypasses RLS.
             // However, just in case, we log it.
             console.log("Profile sync warning: " + profileError.message);
        }
    }

    return new Response(JSON.stringify({ success: true, message: "Admin reset successfully" }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })

  } catch (error) {
    // Return 200 with error details so the client can display them
    return new Response(JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred' 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})