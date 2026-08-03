import Image from "next/image";
import Link from "next/link";
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
    <main className="shell section">
      <div className="section-head"><div><h1 style={{ fontSize: "2.5rem" }}>Salonları kəşf et</h1><p className="muted">{salons.length} nəticə</p></div></div>
      <div className="grid">{salons.map((salon) => <article className="card" key={salon.id}>
        {salon.imageUrl && <Image src={salon.imageUrl} alt="" width={900} height={600} sizes="(max-width: 760px) 100vw, 33vw" />}
        <div className="card-body">
          <h2>{salon.name}</h2>
          <p className="muted">{salon.city} · ★ {salon.rating.toString()}</p>
          <p>{salon.services.map((service) => service.name).join(" · ")}</p>
          <Link className="button" href={`/salons/${salon.slug}`}>Bax və rezervasiya et</Link>
        </div>
      </article>)}</div>
      {!salons.length && <p className="notice">Bu axtarış üzrə salon tapılmadı. Axtarışı dəyişib yenidən yoxlayın.</p>}
    </main>
  </>;
}
