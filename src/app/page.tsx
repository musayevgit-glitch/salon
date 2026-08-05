import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, Clock3, MapPin, Search, ShieldCheck, Sparkles, Star } from "lucide-react";
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
        <div className="shell hero-shell">
          <div className="hero-copy hero-copy-rule">
          <p className="hero-wordmark">Salonomia</p>
          <p className="tag"><Sparkles size={14} aria-hidden="true" /> Gözəllik üçün vaxt ayır</p>
          <h1>Sənin üçün doğru salon, doğru vaxt.</h1>
          <p className="lead">Etibarlı salonları kəşf et, xidmətini və ustasını seç, real boş saatlardan birinə bir neçə saniyəyə rezervasiya et.</p>
          <form className="search" action="/salons">
            <div className="field"><label htmlFor="q">Nə axtarırsan?</label><input id="q" name="q" placeholder="Saç, manikür, makiyaj…" /></div>
            <div className="field"><label htmlFor="city">Şəhər</label><input id="city" name="city" placeholder="Bakı" /></div>
            <button className="button" type="submit"><Search size={17} /> Axtar</button>
          </form>
          <div className="trust-row" aria-label="Platforma üstünlükləri"><span><CalendarCheck size={16}/> Real availability</span><span><ShieldCheck size={16}/> Tokenlə idarəetmə</span><span><Clock3 size={16}/> Mobil rahat flow</span></div>
          </div>
          <div className="hero-card" aria-hidden="true">
            <div className="hero-card-top"><span>Bugünkü boş saat</span><b>16:30</b></div>
            <div className="mini-agenda"><span>Saç baxımı</span><strong>Studio Bloom</strong><small>Təsdiq gözləyir</small></div>
            <div className="hero-card-bottom">Təhlükəsiz rezervasiya linki hazırdır</div>
          </div>
        </div>
      </section>
      <section id="salonlar" className="section">
        <div className="shell">
          <div className="section-head">
            <div><p className="eyebrow-divider"><span>Kürasiya edilmiş seçim</span></p><h2>Seçilmiş salonlar</h2><p className="muted">Keyfiyyətli xidmət, rahat rezervasiya.</p></div>
            <Link className="button secondary" href="/salons">Hamısını gör</Link>
          </div>
          <div className="grid">{salons.map((salon, index) => <article className="card salon-card" key={salon.id}>
            <div className="card-image-wrap">{salon.imageUrl && <Image src={salon.imageUrl} alt="" width={900} height={600} sizes="(max-width: 760px) 100vw, 33vw" />}</div>
            <div className="card-body">
              <div className="row"><h3>{salon.name}</h3><span className="tag"><Star size={13} fill="currentColor" /> {salon.rating.toString()}</span></div>
              {index === 0 && <p><span className="badge-premium">Ən yüksək qiymətləndirmə</span></p>}
              <p className="muted small"><MapPin size={14} /> {salon.city} · {salon.address}</p>
              <p className="small service-chips">{salon.services.map((service) => <span key={service.id}>{service.name}</span>)}</p>
              <Link className="button" href={`/salons/${salon.slug}`}>Rezervasiya et</Link>
            </div>
          </article>)}</div>
        </div>
      </section>
      <section id="nece-isleyir" className="section tint">
        <div className="shell">
          <div className="section-head"><div><p className="eyebrow-divider"><span>Müştəri flow-u</span></p><h2>Üç addımda hazır</h2></div></div>
          <div className="grid steps-grid">
            <div><span>01</span><h3>Kəşf et</h3><p className="muted">Şəhərə, xidmətə və zövqünə uyğun salonu seç.</p></div>
            <div><span>02</span><h3>Vaxtını seç</h3><p className="muted">Xidmət, usta və real boş saatı müəyyənləşdir.</p></div>
            <div><span>03</span><h3>Təsdiq al</h3><p className="muted">Rezervasiyanı idarə etmək üçün təhlükəsiz linkin hazırdır.</p></div>
          </div>
        </div>
      </section>
    </main>
    <footer className="shell footer">© {new Date().getFullYear()} Salonomia · Gözəllik daha əlçatan.</footer>
  </>;
}
