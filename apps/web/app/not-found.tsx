import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found"
};

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
        <Compass aria-hidden className="h-6 w-6" />
      </span>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        404
      </p>
      <h1 className="text-balance text-2xl font-semibold sm:text-3xl">This page does not exist</h1>
      <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
        The link may be out of date. Choose a tool below to continue.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button asChild>
          <Link href="/doctor">Open Crop Doctor</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/mandi">View Mandi prices</Link>
        </Button>
      </div>
    </main>
  );
}
