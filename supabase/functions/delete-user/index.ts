import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { email } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find((u) => u.email === email);
  if (!user) return new Response("User not found", { status: 404 });

  await supabase.auth.admin.deleteUser(user.id);
  await supabase.from("students").delete().eq("email", email);
  await supabase.from("profiles").delete().eq("id", user.id);

  return new Response("User deleted", { status: 200 });
});
