import { createClient } from "@/lib/supabase/server";
import { backendFetch } from "@/lib/backend";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { fileId } = await params;
  const res = await backendFetch(`/files/${fileId}/content`);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return new Response(text || "File not available", { status: res.status });
  }

  const buf = await res.arrayBuffer();
  return new Response(buf, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Disposition":
        res.headers.get("Content-Disposition") ?? `attachment; filename="${fileId}"`,
    },
  });
}
