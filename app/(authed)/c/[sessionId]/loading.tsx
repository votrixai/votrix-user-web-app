export default function Loading() {
  return (
    <main className="flex h-full flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-8">
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-20 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-32 w-full animate-pulse rounded bg-muted" />
      </div>
      <div className="border-t border-border p-4">
        <div className="mx-auto h-12 w-full max-w-3xl animate-pulse rounded-lg bg-muted" />
      </div>
    </main>
  );
}
