import { signIn } from "@/app/[slug]/host/actions";

export function HostSignIn({ next, wrong }: { next: string; wrong: boolean }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5">
      <h1 className="mb-4 text-[24px] font-bold">Host sign-in</h1>
      <form action={signIn.bind(null, next)} className="space-y-3">
        <input name="password" type="password" placeholder="Password" className="field" autoComplete="current-password" autoFocus />
        {wrong && <p className="text-red-700">That&apos;s not it.</p>}
        <button className="btn w-full">Sign in</button>
      </form>
    </main>
  );
}
