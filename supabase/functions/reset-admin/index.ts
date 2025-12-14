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

    // CHANGED: Use a new email domain to bypass the corrupted 'admin@secretsanta.app' record
    const adminEmail = 'admin@secretsantahq.com';
    const adminPassword = 'admin123';
    
    console.log(`Resetting admin to NEW identity: ${adminEmail}`);

    // 1. Clean up public profile first (to free up the 'admin' username if it's unique)
    const { error: delError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('username', 'admin');
        
    if (delError) console.log("Warning deleting old profile:", delError.message);

    // 2. Create the NEW Admin User
    // We try create first. If it exists (unlikely with new domain), we update.
    let userId;

    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { username: 'admin', role: 'admin', avatar: '🎅' }
    });

    if (!createError && createData.user) {
        userId = createData.user.id;
    } else {
        // If this new email ALSO exists, find it and update it
        console.log("User exists, updating...");
        const { data: rpcData } = await supabaseAdmin.rpc('get_user_id_by_email', { email: adminEmail });
        if (rpcData) {
            userId = rpcData;
            await supabaseAdmin.auth.admin.updateUserById(userId, { password: adminPassword });
        }
    }

    if (!userId) throw new Error("Failed to create or find new admin user.");

    // 3. Ensure Profile Exists
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: userId,
            username: 'admin',
            role: 'admin',
            avatar: '🎅'
        });

    return new Response(JSON.stringify({ success: true, message: "Admin reset! Login with admin / admin123" }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })

  } catch (error) {
    return new Response(JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error' 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})