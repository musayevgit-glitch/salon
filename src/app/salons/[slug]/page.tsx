import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, Clock3, MapPin, ShieldCheck, Sparkles, Star } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const days = ["Bazar", "B.e.", "Ç.a.", "Ç.", "C.a.", "C.", "Ş."];

export default async function SalonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const salon = await prisma.salon.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      services: { where: { active: true }, orderBy: { sortOrder: "asc" } },
      providers: { where: { active: true }, include: { services: { include: { service: true } }, hours: true } },
      businessHours: { orderBy: { weekday: "asc" } },
    },
  });
  if (!salon) notFound();
  const firstService = salon.services[0];
  const heroImage = salon.imageUrl ?? "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1400&auto=format&fit=crop";

  return <>
    <PublicHeader />
    <main className="salon-profile">
      <section className="salon-hero shell">
        <div className="salon-hero-copy">
          <p className="tag"><Star size={14} fill="currentColor" aria-hidden="true" /> {salon.rating.toString()} · Premium salon</p>
          <h1>{salon.name}</h1>
          <p className="lead">{salon.description}</p>
          <div className="salon-facts">
            <span><MapPin size={16} aria-hidden="true" /> {salon.city}, {salon.address}</span>
            <span><Clock3 size={16} aria-hidden="true" /> {salon.timezone}</span>
            <span><ShieldCheck size={16} aria-hidden="true" /> Tokenlə təhlükəsiz idarəetmə</span>
          </div>
          {firstService && <Link className="button salon-primary-cta" href={`/salons/${salon.slug}/book?service=${firstService.id}`}>Rezervasiya et</Link>}
        </div>
        <div className="salon-gallery" aria-label={`${salon.name} qalereyası`}>
          <Image priority src={heroImage} alt={`${salon.name} salon interyeri`} width={1100} height={820} sizes="(max-width: 768px) 100vw, 48vw" />
          <div className="gallery-mini"><span>Portfolio</span><span>Real availability</span></div>
        </div>
      </section>

      <section className="section tint">
        <div className="shell service-layout">
          <div className="section-head"><div><p className="eyebrow">Xidmət seçimi</p><h2>Xidmətlər</h2><p className="muted">Qiymət, müddət və uyğun boş saatlar serverdə yoxlanılır.</p></div></div>
          <div className="service-list">{salon.services.map((service) => <article className="service-card" key={service.id}>
            <div>
              <h3>{service.name}</h3>
              <p className="muted">{service.description || "Salon tərəfindən təqdim olunan aktiv xidmət."}</p>
            </div>
            <div className="service-card-meta"><b>{money(service.priceCents)}</b><span>{service.durationMinutes} dəq{service.bufferMinutes ? ` · ${service.bufferMinutes} dəq buffer` : ""}</span></div>
            <Link className="button secondary" href={`/salons/${salon.slug}/book?service=${service.id}`}>Vaxt seç</Link>
          </article>)}</div>
        </div>
      </section>

      <section className="shell section salon-details-grid">
        <div>
          <p className="eyebrow">Komanda</p>
          <h2>Ustalar və portfolio</h2>
          <div className="provider-grid">{salon.providers.map((provider) => <article className="provider-profile" key={provider.id}>
            <div className="provider-photo">{provider.imageUrl ? <Image src={provider.imageUrl} alt="" width={120} height={120} /> : provider.name.slice(0, 1)}</div>
            <div><h3>{provider.name}</h3><p className="muted">{provider.bio || "Portfolio və ixtisaslaşma salon panelindən yenilənə bilər."}</p><p className="small">{provider.services.map((item) => item.service.name).join(" · ")}</p></div>
          </article>)}</div>
        </div>
        <aside className="policy-panel">
          <p className="eyebrow">Planlama</p>
          <h2>İş saatı və qaydalar</h2>
          <dl className="hours-compact">{salon.businessHours.map((hour) => <div key={hour.id}><dt>{days[hour.weekday] ?? hour.weekday}</dt><dd>{hour.closed ? "Bağlı" : `${hour.opensAt}–${hour.closesAt}`}</dd></div>)}</dl>
          <div className="policy-note"><CalendarCheck size={18} /><p>Rezervasiyanı ən azı {Math.round(salon.bookingLeadMinutes / 60)} saat əvvəl yaradın. Ləğv limiti: {salon.cancellationHours} saat.</p></div>
        </aside>
      </section>
      {firstService && <div className="mobile-sticky-cta"><Link className="button" href={`/salons/${salon.slug}/book?service=${firstService.id}`}><Sparkles size={17} /> Rezervasiya et</Link></div>}
    </main>
  </>;
}
