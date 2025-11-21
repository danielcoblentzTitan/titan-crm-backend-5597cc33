import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateTeamMemberAuthRequest {
  email: string;
  password: string;
  name?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin Supabase client using service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password, name } = await req.json() as CreateTeamMemberAuthRequest

    console.log(`Creating auth user for team member: ${email}`)

    // First, check if team member exists in our database
    const { data: teamMember, error: teamMemberError } = await supabaseAdmin
      .from('team_members')
      .select('*')
      .eq('email', email)
      .single()

    if (teamMemberError || !teamMember) {
      console.error('Team member not found:', teamMemberError)
      return new Response(
        JSON.stringify({ error: 'Team member not found in database' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if team member already has auth user
    if (teamMember.auth_user_id) {
      console.log('Team member already has auth user')
      return new Response(
        JSON.stringify({ error: 'Team member already has an authentication account' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create the auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        full_name: name || teamMember.name,
        role: 'builder'
      }
    })

    if (authError || !authUser.user) {
      console.error('Failed to create auth user:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to create authentication account', details: authError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Created auth user with ID: ${authUser.user.id}`)

    // Update team member with auth user ID
    const { error: updateError } = await supabaseAdmin
      .from('team_members')
      .update({ 
        auth_user_id: authUser.user.id,
        user_id: authUser.user.id // Also update the legacy user_id field for compatibility
      })
      .eq('id', teamMember.id)

    if (updateError) {
      console.error('Failed to update team member:', updateError)
      
      // Try to clean up the auth user if team member update failed
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      } catch (cleanupError) {
        console.error('Failed to clean up auth user:', cleanupError)
      }

      return new Response(
        JSON.stringify({ error: 'Failed to link authentication account to team member', details: updateError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Successfully created auth user and linked to team member: ${email}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Authentication account created successfully',
        user_id: authUser.user.id,
        team_member_id: teamMember.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    const message = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})