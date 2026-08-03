import "server-only";

import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { AppointmentStatus, Prisma } from "@prisma/client";

const bookingSchema = z.object({
  salonId: z.string().cuid(),
  serviceId: z.string().cuid(),
  providerId: z.string().cuid(),
  startsAt: z.coerce.date(),
  customerName: z.string().trim().min(2).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(7).max(30),
  idempotencyKey: z.string().uuid(),
});

const blocking: AppointmentStatus[] = ["PENDING", "CONFIRMED", "NEEDS_REASSIGNMENT"];
const hash = (value: string) => crypto.createHash("sha256").update(value).digest("hex");
const bookingRef = () => crypto.randomBytes(8).toString("base64url").slice(0, 10);
const minutes = (value: string) => {
  const [hours, mins] = value.split(":").map(Number);
  return hours * 60 + mins;
};

async function resolveWorkingWindow(tx: Prisma.TransactionClient, salonId: string, providerId: string, weekday: number) {
  const providerHour = await tx.providerHour.findFirst({ where: { providerId, weekday } });
  if (providerHour) return { startsAt: providerHour.startsAt, endsAt: providerHour.endsAt, closed: false };

  const businessHour = await tx.businessHour.findFirst({ where: { salonId, weekday } });
  if (!businessHour || businessHour.closed) return null;
  return { startsAt: businessHour.opensAt, endsAt: businessHour.closesAt, closed: false };
}

async function assertWithinWorkingHours(
  tx: Prisma.TransactionClient,
  salonId: string,
  providerId: string,
  startsAt: Date,
  blockedEndTime: Date,
) {
  const weekday = startsAt.getUTCDay();
  const window = await resolveWorkingWindow(tx, salonId, providerId, weekday);
  if (!window) throw new Error("BOOKING_OUTSIDE_WORKING_HOURS");

  const startMinutes = startsAt.getUTCHours() * 60 + startsAt.getUTCMinutes();
  const blockedEndMinutes = blockedEndTime.getUTCHours() * 60 + blockedEndTime.getUTCMinutes();
  if (startMinutes < minutes(window.startsAt) || blockedEndMinutes > minutes(window.endsAt)) {
    throw new Error("BOOKING_OUTSIDE_WORKING_HOURS");
  }
}

export async function createBooking(raw: unknown) {
  const data = bookingSchema.parse(raw);
  return prisma.$transaction(async (tx) => {
    const existing = await tx.appointment.findUnique({ where: { idempotencyKey: data.idempotencyKey } });
    if (existing) return { appointment: existing, manageToken: null };

    const [salon, service, provider] = await Promise.all([
      tx.salon.findFirst({ where: { id: data.salonId, status: "ACTIVE" } }),
      tx.service.findFirst({ where: { id: data.serviceId, salonId: data.salonId, active: true } }),
      tx.provider.findFirst({ where: { id: data.providerId, salonId: data.salonId, active: true, services: { some: { serviceId: data.serviceId } } } }),
    ]);
    if (!salon || !service || !provider) throw new Error("BOOKING_RESOURCE_NOT_FOUND");

    const now = new Date();
    if (data.startsAt.getTime() < now.getTime() + salon.bookingLeadMinutes * 60000) throw new Error("BOOKING_LEAD_TIME");

    const endsAt = new Date(data.startsAt.getTime() + service.durationMinutes * 60000);
    const blockedEndTime = new Date(endsAt.getTime() + service.bufferMinutes * 60000);
    await assertWithinWorkingHours(tx, salon.id, provider.id, data.startsAt, blockedEndTime);

    const overlap = await tx.appointment.findFirst({
      where: {
        providerId: provider.id,
        status: { in: blocking },
        startsAt: { lt: blockedEndTime },
        blockedEndTime: { gt: data.startsAt },
      },
    });
    if (overlap) throw new Error("DOUBLE_BOOKING_CONFLICT");

    const token = crypto.randomBytes(32).toString("base64url");
    const appointment = await tx.appointment.create({
      data: {
        bookingRef: bookingRef(),
        salonId: salon.id,
        serviceId: service.id,
        providerId: provider.id,
        startsAt: data.startsAt,
        endsAt,
        blockedEndTime,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        priceCents: service.priceCents,
        idempotencyKey: data.idempotencyKey,
        manageTokenHash: hash(token),
      },
    });
    await tx.auditLog.create({ data: { salonId: salon.id, action: "APPOINTMENT_CREATED", targetType: "Appointment", targetId: appointment.id } });
    return { appointment, manageToken: token };
  });
}

export async function setAppointmentStatus(salonId: string, appointmentId: string, status: "CONFIRMED" | "CANCELLED" | "REJECTED" | "COMPLETED" | "NO_SHOW") {
  const appointment = await prisma.appointment.findFirst({ where: { id: appointmentId, salonId } });
  if (!appointment) throw new Error("APPOINTMENT_NOT_FOUND");
  return prisma.$transaction([
    prisma.appointment.update({ where: { id: appointment.id }, data: { status } }),
    prisma.auditLog.create({ data: { salonId, action: `APPOINTMENT_${status}`, targetType: "Appointment", targetId: appointment.id } }),
  ]);
}
