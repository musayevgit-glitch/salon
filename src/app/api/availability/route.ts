import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clientAddress, rateLimitHeaders, rateLimits } from "@/lib/rate-limit";
import type { AppointmentStatus } from "@prisma/client";

const query = z.object({
  providerId: z.string().cuid(),
  serviceId: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
const blocking: AppointmentStatus[] = ["PENDING", "CONFIRMED", "NEEDS_REASSIGNMENT"];

export async function GET(request: Request) {
  const limit = checkRateLimit("availability", clientAddress(request.headers), rateLimits.availability);
  if (!limit.allowed) return NextResponse.json({ code: "RATE_LIMITED" }, { status: 429, headers: rateLimitHeaders(limit) });

  try {
    const data = query.parse(Object.fromEntries(new URL(request.url).searchParams));
    const [provider, service] = await Promise.all([
      prisma.provider.findFirst({ where: { id: data.providerId, active: true }, include: { salon: true } }),
      prisma.service.findFirst({ where: { id: data.serviceId, active: true } }),
    ]);
    if (!provider || !service || provider.salonId !== service.salonId) return NextResponse.json({ code: "AVAILABILITY_NOT_FOUND" }, { status: 404 });

    const start = new Date(`${data.date}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    const weekday = start.getUTCDay();
    const [providerHour, businessHour, appointments] = await Promise.all([
      prisma.providerHour.findFirst({ where: { providerId: provider.id, weekday } }),
      prisma.businessHour.findFirst({ where: { salonId: provider.salonId, weekday } }),
      prisma.appointment.findMany({
        where: {
          providerId: provider.id,
          status: { in: blocking },
          startsAt: { gte: start, lt: end },
        },
        select: { startsAt: true, blockedEndTime: true },
      }),
    ]);

    const window = providerHour
      ? { startsAt: providerHour.startsAt, endsAt: providerHour.endsAt }
      : businessHour && !businessHour.closed
        ? { startsAt: businessHour.opensAt, endsAt: businessHour.closesAt }
        : null;
    if (!window) return NextResponse.json({ slots: [] }, { headers: rateLimitHeaders(limit) });

    const [oh, om] = window.startsAt.split(":").map(Number);
    const [ch, cm] = window.endsAt.split(":").map(Number);
    const openMinutes = oh * 60 + om;
    const closeMinutes = ch * 60 + cm;
    const slots: string[] = [];
    for (let minutes = openMinutes; minutes + service.durationMinutes + service.bufferMinutes <= closeMinutes; minutes += 30) {
      const value = new Date(start);
      value.setUTCHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
      const blockedEndTime = new Date(value.getTime() + (service.durationMinutes + service.bufferMinutes) * 60000);
      const conflict = appointments.some((appointment) => appointment.startsAt < blockedEndTime && appointment.blockedEndTime > value);
      if (value.getTime() > Date.now() + provider.salon.bookingLeadMinutes * 60000 && !conflict) slots.push(value.toISOString());
    }

    return NextResponse.json({ slots }, { headers: rateLimitHeaders(limit) });
  } catch {
    return NextResponse.json({ code: "INVALID_AVAILABILITY_QUERY" }, { status: 400, headers: rateLimitHeaders(limit) });
  }
}
