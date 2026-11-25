export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8"
    >
      <span className="sr-only">Loading page</span>
      <div aria-hidden className="animate-pulse space-y-6">
        <div className="space-y-3">
          <div className="h-4 w-28 rounded-full bg-muted" />
          <div className="h-8 w-2/3 max-w-sm rounded-lg bg-muted" />
          <div className="h-4 w-full max-w-xl rounded bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-40 rounded-2xl border border-border bg-card p-5">
              <div className="h-4 w-1/3 rounded bg-muted" />
              <div className="mt-4 h-3 w-full rounded bg-muted" />
              <div className="mt-2 h-3 w-5/6 rounded bg-muted" />
              <div className="mt-2 h-3 w-2/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
