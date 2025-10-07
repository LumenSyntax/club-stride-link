import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    const baseUrl = Deno.env.get('SUPABASE_URL') || '';
    const appUrl = baseUrl.replace('.supabase.co', '.lovableproject.com');

    if (error) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${appUrl}/profile?strava_error=${error}` }
      });
    }

    if (!code) {
      throw new Error('No authorization code received');
    }

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
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Store tokens in database
    const { error: dbError } = await supabase
      .from('strava_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
        athlete_id: tokenData.athlete.id
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

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
