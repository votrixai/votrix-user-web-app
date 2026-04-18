import { backendFetch } from "@/lib/backend";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { sessionId } = await params;
  const res = await backendFetch(`/sessions/${sessionId}`, { method: "DELETE" });
  return new Response(null, { status: res.status });
}
