import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response("Unauthorized", { status: 401 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      auth.replace("Bearer ", "")
    );

    const { assignment_id, pgn, notes } = await req.json();
    if (!assignment_id) return new Response("Missing assignment_id", { status: 400 });

    const { error } = await supabase.from("attempts").insert([
      { assignment_id, pgn, notes }
    ]);

    if (error) return new Response(error.message, { status: 400 });

    return new Response("Submitted", { status: 200 });
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
});
