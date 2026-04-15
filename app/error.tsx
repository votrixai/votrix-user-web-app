"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-3">
      <p className="text-sm text-muted-foreground">Something went wrong.</p>
      <button
        onClick={reset}
        className="text-sm text-foreground underline hover:no-underline"
      >
        Try again
      </button>
    </main>
  );
}
