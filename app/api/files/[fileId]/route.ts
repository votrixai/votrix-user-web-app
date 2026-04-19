import { createClient } from "@/lib/supabase/server";
import { backendFetch } from "@/lib/backend";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { fileId } = await params;
  const res = await backendFetch(`/files/${fileId}`, { method: "DELETE" });
  return new Response(null, { status: res.status });
}
