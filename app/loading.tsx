export default function Loading() {
  return (
    <main className="flex h-dvh items-center justify-center bg-background">
      <div className="flex gap-1">
        <div className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
        <div className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
        <div className="size-2 animate-bounce rounded-full bg-muted-foreground" />
      </div>
    </main>
  );
}
