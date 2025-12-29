import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const auth = req.headers.get("Authorization");

    // ✅ REQUIRE USER LOGIN TOKEN (NOT SERVICE ROLE)
    if (!auth || !auth.startsWith("Bearer ")) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      auth.replace("Bearer ", "")
    );

    const body = await req.json();

    const {
      title,
      description,
      task_type,
      fen,
      pgn,
      max_moves,
      due_at,
      created_by,
      assigned_to,   // ✅ REQUIRED FOR TARGETED ASSIGNMENTS
      status
    } = body;

    const { data, error } = await supabase
      .from("assignments")
      .insert([{
        title,
        description,
        task_type,
        fen,
        pgn,
        max_moves,
        due_at,
        created_by,
        assigned_to,   // ✅ VERY IMPORTANT
        status
      }])
      .select()
      .single();

    if (error) {
      return new Response(error.message, { status: 400 });
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response("Invalid JSON", { status: 400 });
  }
});
