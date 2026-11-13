import { ImageResponse } from "next/og";
import { getEvent } from "@/lib/data";
import { when } from "@/lib/format";

// The link preview picture for events without a cover photo: title, date and place on white, chirk's plain look.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const e = await getEvent((await params).slug, true);
  if (!e) return new Response("Not found", { status: 404 });
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#ffffff", color: "#1c1917", padding: 72 }}>
        <div style={{ fontSize: 30, color: "#78716c", display: "flex" }}>You&apos;re invited</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: e.title.length > 28 ? 72 : 92, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>{e.title}</div>
          <div style={{ fontSize: 40, marginTop: 28, fontWeight: 600 }}>{when(e)}</div>
          {e.place && <div style={{ fontSize: 34, marginTop: 10, color: "#78716c" }}>{e.place}</div>}
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, display: "flex" }}>chirk</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
