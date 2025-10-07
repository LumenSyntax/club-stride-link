import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-VIDEO-ACCESS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { classPartId } = await req.json();
    if (!classPartId) throw new Error("classPartId is required");

    logStep("Fetching class part", { classPartId });

    // Fetch the class part and its parent class
    const { data: classPart, error: partError } = await supabaseClient
      .from("class_parts")
      .select("id, video_url, class_id, classes!inner(id, price, is_free)")
      .eq("id", classPartId)
      .single();

    if (partError || !classPart) {
      logStep("Class part not found", { error: partError });
      throw new Error("Class part not found");
    }

    logStep("Class part fetched", { classPart });

    const classData = (classPart as any).classes;
    const isFree = classData.is_free;

    // Check if user has access (either free or purchased)
    let hasAccess = isFree;

    if (!isFree) {
      logStep("Checking purchase status");
      const { data: purchase, error: purchaseError } = await supabaseClient
        .from("class_purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("class_id", classPart.class_id)
        .maybeSingle();

      if (purchaseError) {
        logStep("Error checking purchase", { error: purchaseError });
        throw new Error("Error checking purchase status");
      }

      hasAccess = !!purchase;
      logStep("Purchase check complete", { hasAccess });
    }

    if (!hasAccess) {
      logStep("Access denied - no purchase found");
      return new Response(
        JSON.stringify({ error: "Purchase required to access this content" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate signed URL with 1 hour expiration
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    const signedUrl = classPart.video_url; // YouTube URLs don't need signing, but we track access

    // Log the access
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const { error: logError } = await supabaseClient
      .from("video_access_logs")
      .insert({
        user_id: user.id,
        class_id: classPart.class_id,
        class_part_id: classPartId,
        ip_address: ipAddress,
        user_agent: userAgent,
        signed_url_expires_at: expiresAt.toISOString(),
      });

    if (logError) {
      logStep("Error logging access", { error: logError });
    } else {
      logStep("Access logged successfully");
    }

    logStep("Returning signed URL", { expiresAt });

    return new Response(
      JSON.stringify({
        signedUrl,
        userEmail: user.email,
        expiresAt: expiresAt.toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
