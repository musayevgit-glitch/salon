import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { BookingForm } from "@/components/BookingForm";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Book({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ service?: string }> }) {
  const { slug } = await params;
  const { service: serviceId } = await searchParams;
  const salon = await prisma.salon.findFirst({ where: { slug, status: "ACTIVE" } });
  if (!salon || !serviceId) notFound();
  const service = await prisma.service.findFirst({ where: { id: serviceId, salonId: salon.id, active: true }, include: { providers: { include: { provider: true } } } });
  if (!service) notFound();
  return <>
    <PublicHeader />
    <main className="shell booking">
      <Link className="back-link" href={`/salons/${salon.slug}`}>← Salon profilinə qayıt</Link>
      <div className="booking-hero">
        <div><p className="tag">{salon.name}</p><h1>{service.name} üçün rezervasiya</h1><p className="lead">Real boş saatı seçin; sistem toqquşmanı yenidən serverdə yoxlayır.</p></div>
        <aside className="booking-summary"><span>{money(service.priceCents)}</span><b>{service.durationMinutes} dəqiqə</b><small>{service.bufferMinutes ? `+${service.bufferMinutes} dəq buffer` : "Buffer yoxdur"}</small></aside>
      </div>
      <BookingForm salonId={salon.id} serviceId={service.id} providers={service.providers.filter((item) => item.provider.active).map((item) => ({ id: item.provider.id, name: item.provider.name }))} />
    </main>
  </>;
}
