import { AdminShell } from "@/components/AdminShell";
import { CatalogManager } from "@/components/CatalogManager";
import { prisma } from "@/lib/prisma";
import { requireTenantMembership } from "@/server/authorization";
export const dynamic = "force-dynamic";
const links = [{ href: "/salonadmin", label: "Ümumi baxış" }, { href: "/salonadmin/appointments", label: "Rezervasiyalar" }, { href: "/salonadmin/services", label: "Xidmətlər" }, { href: "/salonadmin/team", label: "Komanda" }, { href: "/salonadmin/hours", label: "İş saatları" }];
export default async function ServicesPage() { const { salon } = await requireTenantMembership(["SALON_ADMIN"]); const [services, providers, hours] = await Promise.all([prisma.service.findMany({ where: { salonId: salon.id }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }), prisma.provider.findMany({ where: { salonId: salon.id }, include: { images: { orderBy: { position: "asc" } } } }), prisma.businessHour.findMany({ where: { salonId: salon.id } })]); return <AdminShell title={salon.name} links={links}><CatalogManager tab="services" services={services} providers={providers} hours={hours} /></AdminShell>; }
