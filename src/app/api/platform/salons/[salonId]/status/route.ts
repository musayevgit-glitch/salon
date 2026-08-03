import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/server/authorization";
import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ salonId: string }> }) {
  try {
    const actor = await requireSuperAdmin();
    const { salonId } = await params;
    const { status } = payloadSchema.parse(await request.json());
    const salon = await prisma.salon.update({ where: { id: salonId }, data: { status } });
    await prisma.auditLog.create({ data: { actorId: actor.id, salonId, action: `SALON_${status}`, targetType: "Salon", targetId: salonId } });
    return NextResponse.json({ id: salon.id, status: salon.status });
  } catch (error) {
    return NextResponse.json({ code: error instanceof Error ? error.message : "PLATFORM_ACTION_FAILED" }, { status: 400 });
  }
}
