import { AdminShell } from "@/components/AdminShell";
import { CatalogManager } from "@/components/CatalogManager";
import { requireTenantMembership } from "@/server/authorization";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";
export const dynamic = "force-dynamic";

const adminLinks = [
  { href: "/salonadmin", label: "Ümumi baxış" }, { href: "/salonadmin/appointments", label: "Rezervasiyalar" },
  { href: "/salonadmin/services", label: "Xidmətlər" }, { href: "/salonadmin/team", label: "Komanda" }, { href: "/salonadmin/hours", label: "İş saatları" },
];

export default async function SalonAdmin() {
  const { salon } = await requireTenantMembership(["SALON_ADMIN"]);
  const [appointments, serviceCount, customers, providers, hours, serviceRows] = await Promise.all([
    prisma.appointment.count({ where: { salonId: salon.id } }), prisma.service.count({ where: { salonId: salon.id, active: true } }),
    prisma.appointment.findMany({ where: { salonId: salon.id }, distinct: ["customerEmail"], select: { customerEmail: true } }),
    prisma.provider.findMany({ where: { salonId: salon.id }, orderBy: { name: "asc" }, include: { images: { orderBy: { position: "asc" } } } }), prisma.businessHour.findMany({ where: { salonId: salon.id }, orderBy: { weekday: "asc" } }),
    prisma.service.findMany({ where: { salonId: salon.id }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);
  const revenue = await prisma.appointment.aggregate({ where: { salonId: salon.id, status: "COMPLETED" }, _sum: { priceCents: true } });
  return <AdminShell title={salon.name} links={adminLinks}><h1>{salon.name}</h1><div className="metrics"><div className="metric"><span className="muted">Rezervasiyalar</span><b>{appointments}</b></div><div className="metric"><span className="muted">Müştərilər</span><b>{customers.length}</b></div><div className="metric"><span className="muted">Aktiv xidmətlər</span><b>{serviceCount}</b></div><div className="metric"><span className="muted">Tamamlanan gəlir</span><b>{money(revenue._sum.priceCents ?? 0)}</b></div></div><CatalogManager services={serviceRows} providers={providers} hours={hours} /></AdminShell>;
}
