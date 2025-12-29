import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { assignment_id, student_ids } = await req.json();

    if (!assignment_id || !Array.isArray(student_ids)) {
      return new Response("Missing fields", { status: 400 });
    }

    const rows = student_ids.map((sid: string) => ({
      assignment_id,
      student_id: sid,
      status: "assigned"
    }));

    const { error } = await supabase.from("assignment_targets").insert(rows);
    if (error) return new Response(error.message, { status: 400 });

    return new Response("Assigned", { status: 200 });
  } catch (err) {
    return new Response("Invalid JSON", { status: 400 });
  }
});
