import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { attempt_id, score, feedback } = await req.json();
    if (!attempt_id) return new Response("Missing attempt_id", { status: 400 });

    const { error } = await supabase
      .from("attempts")
      .update({ score, feedback })
      .eq("id", attempt_id);

    if (error) return new Response(error.message, { status: 400 });

    return new Response("Graded", { status: 200 });
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
});
