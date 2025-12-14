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

    // STRATEGY: 
    // 1. Try Create
    // 2. If Exists -> Try Update
    // 3. If Update Fails -> Delete & Recreate (The Fix)

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
        console.log(`Create failed (${createError?.message}), attempting recovery...`);
        
        // Find existing ID
        const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_user_id_by_email', { 
            email: adminEmail 
        });

        if (rpcError || !rpcData) {
            throw new Error(`Could not create or find admin user. Create Error: ${createError?.message}. Lookup Error: ${rpcError?.message}`);
        }

        userId = rpcData;
        console.log(`Found existing admin ID: ${userId}`);

        // Try standard update
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { 
                password: adminPassword,
                email_confirm: true,
                user_metadata: { username: 'admin', role: 'admin', avatar: '🎅' }
            }
        );

        if (updateError) {
            console.log(`Standard update failed (${updateError.message}). executing force re-creation...`);
            
            // NUCLEAR OPTION: Delete the corrupted user
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
            
            if (deleteError) {
                // If we can't delete, we are truly stuck, but let's try to proceed anyway or throw
                throw new Error(`Critical: Could not delete corrupted user. ${deleteError.message}`);
            }

            // Create Fresh
            const { data: recreateData, error: recreateError } = await supabaseAdmin.auth.admin.createUser({
                email: adminEmail,
                password: adminPassword,
                email_confirm: true,
                user_metadata: { username: 'admin', role: 'admin', avatar: '🎅' }
            });

            if (recreateError) {
                throw new Error(`Force re-creation failed: ${recreateError.message}`);
            }
            
            userId = recreateData.user.id;
            console.log("Admin successfully force re-created with new ID");
        }
    }

    // Ensure Profile Exists in Public Table
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