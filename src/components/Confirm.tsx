/** Two-step delete without any client code: tap, then confirm. `warn` says what else goes with it, before "Sure?". */
export function Confirm({ label, action, warn }: { label: string; action: () => Promise<void>; warn?: string }) {
  return (
    <details className="inline">
      <summary className="inline cursor-pointer list-none underline underline-offset-2 [&::-webkit-details-marker]:hidden">{label}</summary>
      {warn && <span role="alert" className="mt-1 block rounded-2xl bg-amber-50 p-3 text-[15px] text-amber-900">{warn}</span>}
      <form action={action} className="inline">
        <button className="ml-2 font-semibold text-red-700">Sure?</button>
      </form>
    </details>
  );
}
