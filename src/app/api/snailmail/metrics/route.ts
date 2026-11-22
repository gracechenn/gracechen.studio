import { NextResponse } from "next/server";
import { recordStart, recordView } from "@/lib/snailmail";

// Side-effect endpoint (increments KV counters) — never cached.
export const dynamic = "force-dynamic";

type MetricEvent = "view" | "start";

export async function POST(req: Request) {
  let event: MetricEvent;
  try {
    const body = await req.json();
    event = String(body?.event ?? "") as MetricEvent;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  switch (event) {
    case "view":
      await recordView();
      break;
    case "start":
      await recordStart();
      break;
    default: {
      const _exhaustive: never = event;
      return NextResponse.json(
        { error: `Unknown event: ${String(_exhaustive)}` },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({ ok: true });
}
