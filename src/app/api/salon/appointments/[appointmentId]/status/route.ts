import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTenantMembership } from "@/server/authorization";
import { setAppointmentStatus } from "@/server/booking";

const payload = z.object({ status: z.enum(["CONFIRMED", "CANCELLED", "REJECTED", "COMPLETED", "NO_SHOW"]) });
export async function PATCH(request: Request, { params }: { params: Promise<{ appointmentId: string }> }) {
  try {
    const { salon } = await requireTenantMembership(["SALON_ADMIN", "SALON_MANAGER"]);
    const { appointmentId } = await params;
    const { status } = payload.parse(await request.json());
    await setAppointmentStatus(salon.id, appointmentId, status);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ code: error instanceof Error ? error.message : "APPOINTMENT_ACTION_FAILED" }, { status: 400 });
  }
}
