import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { normalizeUsername, uniqueUsernameMatch, usernameSearchPattern } from './username.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { username } = await req.json();
    if (typeof username !== "string" || !normalizeUsername(username)) {
      return new Response(JSON.stringify({ error: "Username required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing service configuration');
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Look up profile by username
    const { data: profiles, error: lookupError } = await supabase
      .from("profiles")
      .select("user_id, username")
      .ilike("username", usernameSearchPattern(username));
    if (lookupError) throw lookupError;
    const profile = uniqueUsernameMatch(profiles ?? [], username);

    if (!profile) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get email from auth.users using admin API
    const { data: { user } } = await supabase.auth.admin.getUserById(profile.user_id);

    if (!user?.email) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ email: user.email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
