"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Something went wrong
      </p>
      <h1 className="text-balance text-2xl font-semibold sm:text-3xl">
        This screen could not be displayed
      </h1>
      <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
        An unexpected error interrupted this page. No data was changed. Try again, or open another
        tool from the menu.
      </p>
      {error.digest ? (
        <code className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
          Reference {error.digest}
        </code>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={reset}>
          <RotateCcw aria-hidden />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/doctor">Open Crop Doctor</Link>
        </Button>
      </div>
    </main>
  );
}
