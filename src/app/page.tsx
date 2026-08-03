import Image from "next/image";
import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const salons = await prisma.salon.findMany({
    where: { status: "ACTIVE" },
    include: { services: { where: { active: true }, take: 2 } },
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  return <>
    <PublicHeader />
    <main>
      <section className="hero">
        <div className="shell">
          <p className="tag">Gözəllik üçün vaxt ayır</p>
          <h1>Sənin üçün doğru salon, doğru vaxt.</h1>
          <p className="lead">Etibarlı salonları kəşf et, xidmətini və ustasını seç, bir neçə saniyəyə rezervasiya et.</p>
          <form className="search" action="/salons">
            <div className="field"><label htmlFor="q">Nə axtarırsan?</label><input id="q" name="q" placeholder="Saç, manikür, makiyaj…" /></div>
            <div className="field"><label htmlFor="city">Şəhər</label><input id="city" name="city" placeholder="Bakı" /></div>
            <button className="button" type="submit">Axtar</button>
          </form>
        </div>
      </section>
      <section id="salonlar" className="section">
        <div className="shell">
          <div className="section-head">
            <div><h2>Seçilmiş salonlar</h2><p className="muted">Keyfiyyətli xidmət, rahat rezervasiya.</p></div>
            <Link className="button secondary" href="/salons">Hamısını gör</Link>
          </div>
          <div className="grid">{salons.map((salon) => <article className="card" key={salon.id}>
            {salon.imageUrl && <Image src={salon.imageUrl} alt="" width={900} height={600} sizes="(max-width: 760px) 100vw, 33vw" />}
            <div className="card-body">
              <div className="row"><h3>{salon.name}</h3><span className="tag"><Star size={13} fill="currentColor" /> {salon.rating.toString()}</span></div>
              <p className="muted small"><MapPin size={14} /> {salon.city} · {salon.address}</p>
              <p className="small">{salon.services.map((service) => service.name).join(" · ")}</p>
              <Link className="button" href={`/salons/${salon.slug}`}>Rezervasiya et</Link>
            </div>
          </article>)}</div>
        </div>
      </section>
      <section id="nece-isleyir" className="section tint">
        <div className="shell">
          <h2>Üç addımda hazır</h2>
          <div className="grid">
            <div><h3>1. Kəşf et</h3><p className="muted">Şəhərə, xidmətə və zövqünə uyğun salonu seç.</p></div>
            <div><h3>2. Vaxtını seç</h3><p className="muted">Xidmət, usta və sənə uyğun boş saatı müəyyənləşdir.</p></div>
            <div><h3>3. Təsdiq al</h3><p className="muted">Rezervasiyanı idarə etmək üçün təhlükəsiz linkin hazırdır.</p></div>
          </div>
        </div>
      </section>
    </main>
    <footer className="shell footer">© {new Date().getFullYear()} Salonomia · Gözəllik daha əlçatan.</footer>
  </>;
}
