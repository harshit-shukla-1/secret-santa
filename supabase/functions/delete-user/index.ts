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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Verify the caller is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return new Response('Forbidden: Admin only', { status: 403, headers: corsHeaders })
    }

    // 2. Get the target username to delete
    const { username } = await req.json()
    if (!username) {
      return new Response('Missing username', { status: 400, headers: corsHeaders })
    }

    if (username === 'admin') {
        return new Response(JSON.stringify({ error: "Cannot delete the main admin" }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
    }

    // 3. Find the user ID
    const email = `${username}@secretsantahq.com`
    
    // Use the RPC helper we made earlier to find ID by email
    const { data: targetUserId, error: lookupError } = await supabaseClient.rpc('get_user_id_by_email', { email })

    if (lookupError || !targetUserId) {
        return new Response(JSON.stringify({ error: "User not found" }), { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
    }

    // 4. Delete the user
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(targetUserId)

    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Manually ensure profile is gone (though cascade should handle it)
    await supabaseClient.from('profiles').delete().eq('id', targetUserId);

    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})