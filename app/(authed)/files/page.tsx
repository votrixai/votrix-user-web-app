import { backendFetch } from "@/lib/backend";
import FilesWorkspace, { type FileMeta } from "@/components/files-workspace";

export default async function FilesPage() {
  let files: FileMeta[] = [];
  try {
    const res = await backendFetch("/files");
    if (res.ok) files = (await res.json()) as FileMeta[];
  } catch {}

  return <FilesWorkspace initialFiles={files} />;
}
