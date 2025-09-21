import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  listingName: string;         // e.g. "Parkview Lofts"
  listingAddress: string;      // e.g. "101 Walnut St, Philadelphia, PA"
  userQuestions?: string[];    // optional list of questions
};

// Polling controls (tweak as needed)
const POLL_INTERVAL_MS = 3000;          // 3 seconds
const MAX_WAIT_MS = 5 * 60 * 1000;      // 5 minutes
const TERMINAL_STATUS = "ended";
const VALID_STATUSES = new Set([
  "scheduled",
  "queued",
  "ringing",
  "in-progress",
  "forwarding",
  "ended",
]);

function sleep(ms: number) {
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

export async function POST(req: Request) {
  try {
    const { VAPI_API_KEY, VAPI_ASSISTANT_ID, VAPI_PHONE_NUMBER_ID } = process.env;
    if (!VAPI_API_KEY || !VAPI_ASSISTANT_ID || !VAPI_PHONE_NUMBER_ID) {
      return NextResponse.json({ error: "Missing VAPI env vars" }, { status: 500 });
    }

    const { listingName, listingAddress, userQuestions = [] } =
      (await req.json()) as Body;

    // if ( !listingName || !listingAddress) {
    //   return NextResponse.json(
    //     { error: "listingPhone, listingName, and listingAddress are required" },
    //     { status: 400 }
    //   );
    // }

    const joinedQuestions =
      userQuestions
        .map((q) => (q || "").trim())
        .filter(Boolean)
        .map((q) => `- ${q}`)
        .join("\n");

    const createPayload = {
      assistantId: VAPI_ASSISTANT_ID,
      phoneNumberId: VAPI_PHONE_NUMBER_ID,
      customer: { number: "+13464008051" }, // agent dials the listing
      // customer: { number: "+14804146609" }, // agent dials the listing
      assistantOverrides: {
        variableValues: {
          listing_name: listingName,
          listing_address: listingAddress,
          joined_questions: joinedQuestions,
        },
      },
    };

    // 1) Create the call
    const createRes = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createPayload),
    });

    const created = await createRes.json();
    if (!createRes.ok) {
      return NextResponse.json({ error: created }, { status: createRes.status });
    }

    const callId: string | undefined = created?.id;
    if (!callId) {
      return NextResponse.json({ error: "No call id returned" }, { status: 502 });
    }

    // 2) Poll until status === "ended" or timeout
    const t0 = Date.now();
    let lastStatus = "";

    while (true) {
      const call = await getCallOnce(callId, VAPI_API_KEY);
      const status: string = String(call?.status || call?.state || "").toLowerCase();

      if (!VALID_STATUSES.has(status)) {
        // Return unexpected status for debugging
        return NextResponse.json({ callId, status, note: "Unexpected status", raw: call }, { status: 200 });
      }

      if (status === TERMINAL_STATUS) {
        const summary = call?.analysis?.summary ?? null;
        const transcript = call?.artifact?.transcript ?? null;
        return NextResponse.json({ callId, status, summary, transcript }, { status: 200 });
      }

      if (Date.now() - t0 > MAX_WAIT_MS) {
        // Timed out: return progress so client can decide to poll again
        return NextResponse.json({ callId, status, timedOut: true }, { status: 202 });
      }

      await sleep(POLL_INTERVAL_MS);
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
