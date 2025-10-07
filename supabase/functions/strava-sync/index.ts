import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshStravaToken(refreshToken: string) {
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: Deno.env.get('STRAVA_CLIENT_ID'),
      client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Get Strava tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('strava_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: 'Strava not connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token needs refresh
    let accessToken = tokenData.access_token;
    const expiresAt = new Date(tokenData.expires_at);
    
    if (expiresAt <= new Date()) {
      console.log('Refreshing expired token');
      const newTokenData = await refreshStravaToken(tokenData.refresh_token);
      
      await supabase
        .from('strava_tokens')
        .update({
          access_token: newTokenData.access_token,
          refresh_token: newTokenData.refresh_token,
          expires_at: new Date(newTokenData.expires_at * 1000).toISOString()
        })
        .eq('user_id', user.id);
      
      accessToken = newTokenData.access_token;
    }

    // Fetch activities from Strava
    const stravaResponse = await fetch(
      'https://www.strava.com/api/v3/athlete/activities?per_page=30',
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!stravaResponse.ok) {
      throw new Error('Failed to fetch Strava activities');
    }

    const stravaActivities = await stravaResponse.json();
    let syncedCount = 0;

    // Sync activities to database
    for (const activity of stravaActivities) {
      // Check if activity already exists
      const { data: existing } = await supabase
        .from('activities')
        .select('id')
        .eq('strava_activity_id', activity.id)
        .single();

      if (!existing) {
        const { error: insertError } = await supabase
          .from('activities')
          .insert({
            user_id: user.id,
            title: activity.name,
            activity_type: activity.type.toLowerCase(),
            activity_date: activity.start_date.split('T')[0],
            duration: Math.round(activity.moving_time / 60), // Convert seconds to minutes
            distance: activity.distance / 1000, // Convert meters to km
            calories: activity.calories || null,
            description: `Synced from Strava`,
            strava_activity_id: activity.id
          });

        if (!insertError) {
          syncedCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        syncedCount,
        totalActivities: stravaActivities.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
