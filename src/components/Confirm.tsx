/** Two-step delete without any client code: tap, then confirm. */
export function Confirm({ label, action }: { label: string; action: () => Promise<void> }) {
  return (
    <details className="inline">
      <summary className="inline cursor-pointer list-none underline underline-offset-2 [&::-webkit-details-marker]:hidden">{label}</summary>
      <form action={action} className="inline">
        <button className="ml-2 font-semibold text-red-700">Sure?</button>
      </form>
    </details>
  );
}
