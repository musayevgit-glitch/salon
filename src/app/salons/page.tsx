import Image from "next/image";
import Link from "next/link";
import { MapPin, Search, SlidersHorizontal, Star } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Salons({ searchParams }: { searchParams: Promise<{ q?: string; city?: string }> }) {
  const { q = "", city = "" } = await searchParams;
  const salons = await prisma.salon.findMany({
    where: {
      status: "ACTIVE",
      AND: [
        city ? { city: { contains: city, mode: "insensitive" } } : {},
        q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { services: { some: { name: { contains: q, mode: "insensitive" }, active: true } } }] } : {},
      ],
    },
    include: { services: { where: { active: true }, take: 3 } },
    orderBy: { rating: "desc" },
  });

  return <>
    <PublicHeader />
    <main className="shell section salons-index">
      <div className="page-heading"><div><p className="eyebrow-divider"><span>Salon kataloqu</span></p><h1>Salonları kəşf et</h1><p className="muted">{salons.length} nəticə · aktiv salonlar və real xidmətlər</p></div></div>
      <form className="search listing-search" action="/salons">
        <div className="field"><label htmlFor="q">Xidmət və ya salon</label><input id="q" name="q" defaultValue={q} placeholder="Saç, dırnaq, makiyaj…" /></div>
        <div className="field"><label htmlFor="city">Şəhər</label><input id="city" name="city" defaultValue={city} placeholder="Bakı" /></div>
        <button className="button" type="submit"><Search size={17} /> Yenilə</button>
      </form>
      <div className="filter-summary"><SlidersHorizontal size={16} /><span>{q || city ? "Axtarış filtrləri tətbiq olunub" : "Bütün aktiv salonlar göstərilir"}</span></div>
      <div className="grid">{salons.map((salon, index) => <article className="card salon-card" key={salon.id}>
        <div className="card-image-wrap">{salon.imageUrl && <Image src={salon.imageUrl} alt="" width={900} height={600} sizes="(max-width: 760px) 100vw, 33vw" />}</div>
        <div className="card-body">
          <div className="row"><h2>{salon.name}</h2><span className="tag"><Star size={13} fill="currentColor" /> {salon.rating.toString()}</span></div>
          {index === 0 && <p><span className="badge-premium">Ən yüksək qiymətləndirmə</span></p>}
          <p className="muted small"><MapPin size={14} /> {salon.city} · {salon.address}</p>
          <p className="service-chips">{salon.services.map((service) => <span key={service.id}>{service.name}</span>)}</p>
          <Link className="button" href={`/salons/${salon.slug}`}>Bax və rezervasiya et</Link>
        </div>
      </article>)}</div>
      {!salons.length && <div className="empty-state"><h2>Salon tapılmadı</h2><p>Bu axtarış üzrə nəticə yoxdur. Xidmət və ya şəhər filtrini sadələşdirib yenidən yoxlayın.</p></div>}
    </main>
  </>;
}
