import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    const baseUrl = Deno.env.get('SUPABASE_URL') || '';
    const appUrl = baseUrl.replace('.supabase.co', '.lovableproject.com');

    if (error) {
      console.error('Strava authorization error:', error);
      return new Response(null, {
        status: 302,
        headers: { Location: `${appUrl}/profile?strava_error=${error}` }
      });
    }

    if (!code || !state) {
      throw new Error('Missing authorization code or state parameter');
    }

    // Use service role to look up user_id from state token
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Look up the OAuth state
    const { data: oauthState, error: stateError } = await supabaseAdmin
      .from('strava_oauth_states')
      .select('user_id, expires_at')
      .eq('state_token', state)
      .single();

    if (stateError || !oauthState) {
      console.error('Invalid or expired OAuth state:', stateError);
      return new Response(null, {
        status: 302,
        headers: { Location: `${appUrl}/profile?strava_error=invalid_state` }
      });
    }

    // Check if state has expired
    const expiresAt = new Date(oauthState.expires_at);
    if (expiresAt < new Date()) {
      console.error('OAuth state expired');
      await supabaseAdmin
        .from('strava_oauth_states')
        .delete()
        .eq('state_token', state);
      
      return new Response(null, {
        status: 302,
        headers: { Location: `${appUrl}/profile?strava_error=state_expired` }
      });
    }

    const userId = oauthState.user_id;
    console.log('Processing Strava callback for user:', userId);

    const STRAVA_CLIENT_ID = Deno.env.get('STRAVA_CLIENT_ID');
    const STRAVA_CLIENT_SECRET = Deno.env.get('STRAVA_CLIENT_SECRET');

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Strava token error:', errorText);
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    console.log('Successfully exchanged code for Strava tokens');

    // Store tokens in database using service role
    const { error: dbError } = await supabaseAdmin
      .from('strava_tokens')
      .upsert({
        user_id: userId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
        athlete_id: tokenData.athlete.id
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    // Delete the used state token
    await supabaseAdmin
      .from('strava_oauth_states')
      .delete()
      .eq('state_token', state);

    console.log('Successfully stored Strava tokens and cleaned up state');

    // Redirect back to profile
    return new Response(null, {
      status: 302,
      headers: { Location: `${appUrl}/profile?strava_connected=true` }
    });

  } catch (error) {
    console.error('Callback error:', error);
    const baseUrl = Deno.env.get('SUPABASE_URL') || '';
    const appUrl = baseUrl.replace('.supabase.co', '.lovableproject.com');
    return new Response(null, {
      status: 302,
      headers: { Location: `${appUrl}/profile?strava_error=callback_failed` }
    });
  }
});
