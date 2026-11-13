import { getEvent } from "@/lib/data";

/**
 * Wraps every page of one event in that event's colors.
 * Colors come from events.theme, so a future event can look completely different.
 */
export default async function EventLayout({
  children, params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);
  const theme = event?.theme ?? {};
  const vars = {
    ...(theme.background ? { "--color-maroon": theme.background } : {}),
    ...(theme.ink ? { "--color-cream": theme.ink } : {}),
  } as React.CSSProperties;
  return (
    <div className="event-theme min-h-dvh" style={vars}>
      {children}
    </div>
  );
}
