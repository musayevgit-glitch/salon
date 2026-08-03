import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTenantMembership } from "@/server/authorization";
import { prisma } from "@/lib/prisma";

const input = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("service"), name: z.string().min(2).max(80), durationMinutes: z.coerce.number().int().min(15).max(480), bufferMinutes: z.coerce.number().int().min(0).max(120), priceCents: z.coerce.number().int().min(0) }),
  z.object({ kind: z.literal("provider"), name: z.string().min(2).max(80), bio: z.string().max(500).optional() }),
  z.object({ kind: z.literal("hours"), weekday: z.coerce.number().int().min(0).max(6), opensAt: z.string().regex(/^\d{2}:\d{2}$/), closesAt: z.string().regex(/^\d{2}:\d{2}$/) }),
]);
export async function POST(request: Request) {
  try {
    const { salon } = await requireTenantMembership(["SALON_ADMIN"]);
    const data = input.parse(await request.json());

    if (data.kind === "service") {
      const service = await prisma.service.create({
        data: {
          salonId: salon.id,
          name: data.name,
          durationMinutes: data.durationMinutes,
          bufferMinutes: data.bufferMinutes,
          priceCents: data.priceCents,
        },
      });
      await prisma.auditLog.create({
        data: {
          salonId: salon.id,
          action: "CATALOG_SERVICE_CREATED",
          targetType: "Service",
          targetId: service.id,
        },
      });
      return NextResponse.json(service);
    }

    if (data.kind === "provider") {
      const provider = await prisma.provider.create({
        data: { salonId: salon.id, name: data.name, bio: data.bio },
      });
      const services = await prisma.service.findMany({ where: { salonId: salon.id, active: true }, select: { id: true } });
      if (services.length) {
        await prisma.providerService.createMany({
          data: services.map((service) => ({ providerId: provider.id, serviceId: service.id })),
          skipDuplicates: true,
        });
      }
      await prisma.auditLog.create({
        data: {
          salonId: salon.id,
          action: "CATALOG_PROVIDER_CREATED",
          targetType: "Provider",
          targetId: provider.id,
        },
      });
      return NextResponse.json(provider);
    }

    const hour = await prisma.businessHour.upsert({
      where: { salonId_weekday: { salonId: salon.id, weekday: data.weekday } },
      update: { opensAt: data.opensAt, closesAt: data.closesAt, closed: false },
      create: { salonId: salon.id, weekday: data.weekday, opensAt: data.opensAt, closesAt: data.closesAt },
    });
    await prisma.auditLog.create({
      data: {
        salonId: salon.id,
        action: "BUSINESS_HOURS_UPDATED",
        targetType: "BusinessHour",
        targetId: hour.id,
        metadata: { weekday: data.weekday },
      },
    });

    return NextResponse.json(hour);
  } catch (error) {
    return NextResponse.json({ code: error instanceof Error ? error.message : "CATALOG_UPDATE_FAILED" }, { status: 400 });
  }
}
