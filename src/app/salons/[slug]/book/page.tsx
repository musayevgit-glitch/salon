import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { BookingForm } from "@/components/BookingForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Book({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ service?: string }> }) {
  const { slug } = await params;
  const { service: serviceId } = await searchParams;
  const salon = await prisma.salon.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      services: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        include: { providers: { include: { provider: true } } },
      },
    },
  });
  if (!salon || !salon.services.length) notFound();
  const initialService = salon.services.find((service) => service.id === serviceId) ?? salon.services[0];
  return <>
    <PublicHeader />
    <main className="reservation-page">
      <div className="shell reservation-shell">
        <div className="reservation-page-head">
          <a className="back-link" href={`/salons/${salon.slug}`}>← Geri</a>
          <p className="reservation-kicker">Gözəlliyinizə zaman ayırın</p>
          <h1>Rezervasiya et</h1>
          <p className="lead">Xidməti, tarixi və uyğun saatı seçin.</p>
        </div>
        <BookingForm
          salon={{ id: salon.id, slug: salon.slug, name: salon.name, city: salon.city, address: salon.address, rating: salon.rating.toString(), imageUrl: salon.imageUrl }}
          serviceId={initialService.id}
          services={salon.services.map((service) => ({
            id: service.id,
            name: service.name,
            description: service.description,
            priceCents: service.priceCents,
            durationMinutes: service.durationMinutes,
            bufferMinutes: service.bufferMinutes,
            providers: service.providers.filter((item) => item.provider.active).map((item) => ({ id: item.provider.id, name: item.provider.name, bio: item.provider.bio, imageUrl: item.provider.imageUrl })),
          }))}
        />
      </div>
    </main>
  </>;
}
