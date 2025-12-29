/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://your-project-id.supabase.co";

serve(async (req: Request): Promise<Response> => {
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

  if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { username, email } = body;

    if (!username || !email) {
      return new Response("Missing fields", { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, serviceRoleKey);
    const { error } = await supabase.from("students").insert([{ username, email }]);

    if (error) {
      return new Response(`Insert error: ${error.message}`, { status: 500 });
    }

    return new Response("Student created", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
});
