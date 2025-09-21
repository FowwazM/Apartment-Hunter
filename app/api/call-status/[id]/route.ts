import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vapi returns these statuses per your spec
const VALID_STATUSES = new Set([
  "scheduled",
  "queued",
  "ringing",
  "in-progress",
  "forwarding",
  "ended",
]);

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getCallOnce(callId: string, apiKey: string) {
  const res = await fetch(`https://api.vapi.ai/call/${callId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Vapi GET /call/${callId} failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { VAPI_API_KEY } = process.env;
    if (!VAPI_API_KEY) {
      return NextResponse.json({ error: "Missing VAPI_API_KEY" }, { status: 500 });
    }

    const callId = params.id;
    if (!callId) {
      return NextResponse.json({ error: "Missing callId" }, { status: 400 });
    }

    // Allow client to tweak polling behavior
    const url = new URL(req.url);
    const timeoutMs = Math.max(1000, Number(url.searchParams.get("timeoutMs") || 5 * 60 * 1000)); // default 5m
    const intervalMs = Math.max(1000, Number(url.searchParams.get("intervalMs") || 3000));        // default 3s

    const t0 = Date.now();
    let lastStatus = "";

    while (true) {
      const call = await getCallOnce(callId, VAPI_API_KEY);
      const status: string = String(call?.status || call?.state || "").toLowerCase();

      // If Vapi returns an unexpected status, surface it for debugging
      if (!VALID_STATUSES.has(status)) {
        return NextResponse.json(
          { callId, status, note: "Unexpected status from API.", raw: call },
          { status: 200 }
        );
      }

      if (status !== lastStatus) lastStatus = status;

      if (status === "ended") {
        // Extract only what you asked for
        const summary = call?.analysis?.summary ?? null;
        const transcript = call?.artifact?.transcript ?? null;
        return NextResponse.json(
          { callId, status, summary, transcript },
          { status: 200 }
        );
      }

      if (Date.now() - t0 > timeoutMs) {
        // Long calls may exceed serverless limits; return progress to client
        return NextResponse.json(
          { callId, status: lastStatus || status, timedOut: true },
          { status: 202 }
        );
      }

      await sleep(intervalMs);
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
