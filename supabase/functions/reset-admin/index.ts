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

    const adminEmail = 'admin@secretsanta.app';
    
    // Optimized: Get specific user instead of listing all
    console.log(`Looking up user: ${adminEmail}`);
    
    // Note: getContextUser or similar doesn't exist on admin, we use listUsers with filter usually, 
    // but generateLink or other methods might work. 
    // Actually, deleteUser requires ID. 
    // Let's try creating first. If it fails, we know they exist.
    
    let userId;

    // Try to create the user directly first
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: 'admin123',
        email_confirm: true,
        user_metadata: { username: 'admin', role: 'admin', avatar: '🎅' }
    });

    if (!createError && createData.user) {
        console.log("User created successfully");
        userId = createData.user.id;
    } else if (createError?.message?.includes("already registered") || createError?.status === 422) {
        console.log("User already exists, attempting to find ID...");
        
        // Since we can't create, we need to find the ID to update.
        // listUsers is failing, so let's try a different approach:
        // We can query the public 'profiles' table which SHOULD have the ID if our sync is working.
        
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('username', 'admin') // Assuming username is unique/consistent
            .single();

        if (profile) {
            userId = profile.id;
            console.log(`Found ID from profiles: ${userId}`);
        } else {
            // Fallback: If not in profile, we HAVE to ask Auth.
            // Let's try listUsers again but with a cleaner call, or maybe the previous error was transient.
            // Alternatively, we can just delete the user by email if possible? No, delete requires ID.
            
            // Retrying listUsers but only expecting one page
            const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
                page: 1,
                perPage: 100 // Limit scope
            });
            
            if (listError) throw new Error(`List Users Retry Error: ${listError.message}`);
            
            const foundUser = users.find(u => u.email === adminEmail);
            if (!foundUser) throw new Error("User says registered but cannot be found in list or profiles.");
            userId = foundUser.id;
        }

        if (userId) {
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
        }
    } else {
        // Genuine create error
        throw new Error(`Create User Error: ${createError?.message}`);
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
             console.log("Profile sync warning: " + profileError.message);
        }
    }

    return new Response(JSON.stringify({ success: true, message: "Admin reset successfully" }), { 
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