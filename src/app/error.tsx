"use client";

/** When a page or a save fails unexpectedly: say so plainly and offer a retry, instead of the framework's blank error. */
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-soft">That didn’t go through. Try again in a moment.</p>
      <button type="button" className="link tap text-[17px]" onClick={reset}>Try again</button>
    </main>
  );
}
