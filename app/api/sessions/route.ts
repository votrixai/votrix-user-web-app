import { backendFetch } from "@/lib/backend";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await request.json();
  const res = await backendFetch("/sessions", {
    method: "POST",
    body: JSON.stringify({ agent_slug: body.agent_slug }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("backend POST /sessions failed", {
      status: res.status,
      agent_slug: body.agent_slug,
      body: text,
    });
  }
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
