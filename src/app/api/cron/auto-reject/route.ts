import "server-only";

import { NextResponse } from "next/server";
import { autoRejectOverdueAppointments } from "@/server/booking";

// Periodic system job: auto-rejects PENDING reservations whose appointment time has
// already passed (nobody responded in time). Not tied to a logged-in salon admin —
// there is no existing "system context" auth pattern in this codebase, so this route
// uses a shared-secret header instead of a user session. Wire it up to an external
// scheduler (e.g. Vercel Cron, a hosted cron service, or a simple periodic curl) that
// calls this endpoint every few minutes with the `x-cron-secret` header set to the
// CRON_SECRET environment variable.
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
  }
  const result = await autoRejectOverdueAppointments();
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  return POST(request);
}
