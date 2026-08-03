import { AdminShell } from "@/components/AdminShell";
import { ManagerOperations } from "@/components/ManagerOperations";
import { requireTenantMembership } from "@/server/authorization";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SalonManager() {
  const { salon } = await requireTenantMembership(["SALON_MANAGER", "SALON_ADMIN"]);
  const [appointments, services, providers] = await Promise.all([
    prisma.appointment.findMany({
      where: { salonId: salon.id, startsAt: { gte: new Date(Date.now() - 86400000) } },
      include: { service: true, provider: true },
      take: 60,
      orderBy: { startsAt: "asc" },
    }),
    prisma.service.findMany({ where: { salonId: salon.id, active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.provider.findMany({ where: { salonId: salon.id, active: true }, orderBy: { name: "asc" } }),
  ]);

  return <AdminShell title="Əməliyyat paneli" links={[
    { href: "/salonmanager", label: "Təqvim" },
    { href: "/salonadmin/appointments", label: "Rezervasiyalar" },
  ]}>
    <ManagerOperations
      appointments={appointments.map((appointment) => ({
        id: appointment.id, bookingRef: appointment.bookingRef, customerName: appointment.customerName,
        startsAt: appointment.startsAt.toISOString(), endsAt: appointment.endsAt.toISOString(), status: appointment.status,
        service: appointment.service.name, provider: appointment.provider.name,
      }))}
      services={services.map((service) => ({ id: service.id, name: service.name, durationMinutes: service.durationMinutes, priceCents: service.priceCents }))}
      providers={providers.map((provider) => ({ id: provider.id, name: provider.name }))}
    />
  </AdminShell>;
}
