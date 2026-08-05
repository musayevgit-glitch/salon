import { notFound } from "next/navigation";
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
    <main className="reservation-page">
      <div className="shell reservation-shell">
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
