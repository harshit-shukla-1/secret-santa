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
        throw new Error("Missing Server Configuration");
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

    const adminEmail = 'admin@secretsanta.app';
    const adminPassword = 'admin123';
    let userId;

    console.log(`Attempting to reset admin: ${adminEmail}`);

    // STRATEGY: TRY CREATE FIRST (Most common case for new apps)
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { username: 'admin', role: 'admin', avatar: '🎅' }
    });

    if (!createError && createData.user) {
        console.log("Admin created successfully");
        userId = createData.user.id;
    } else {
        // If create failed, assume user exists and try to find ID via our SQL helper
        console.log(`Create failed (${createError?.message}), attempting update...`);
        
        const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_user_id_by_email', { 
            email: adminEmail 
        });

        if (rpcError || !rpcData) {
            // If we can't find them, report the original create error
            throw new Error(`Could not create or find admin user. Create Error: ${createError?.message}. Lookup Error: ${rpcError?.message}`);
        }

        userId = rpcData;
        console.log(`Found existing admin ID: ${userId}`);

        // Update the existing user's password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { 
                password: adminPassword,
                email_confirm: true,
                user_metadata: { username: 'admin', role: 'admin', avatar: '🎅' }
            }
        );

        if (updateError) {
            throw new Error(`Failed to update existing admin: ${updateError.message}`);
        }
    }

    // Ensure Profile Exists
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
            console.log("Profile sync warning:", profileError);
        }
    }

    return new Response(JSON.stringify({ success: true, message: "Admin reset to 'admin' / 'admin123'" }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })

  } catch (error) {
    return new Response(JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred' 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})