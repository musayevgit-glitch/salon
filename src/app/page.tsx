import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarCheck, Clock3, MapPin, Search, ShieldCheck, Sparkles, Star } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const salons = await prisma.salon.findMany({
    where: { status: "ACTIVE" },
    include: { services: { where: { active: true }, take: 2 } },
    take: 7,
    orderBy: { rating: "desc" },
  });
  const [featured, ...rest] = salons;

  return <>
    <PublicHeader />
    <main>
      <section className="landing-hero">
        <div className="shell landing-hero-inner">
          <div className="landing-hero-copy hero-copy-rule">
            <p className="hero-wordmark">Salonomia</p>
            <p className="tag"><Sparkles size={14} aria-hidden="true" /> Gözəllik üçün vaxt ayır</p>
            <h1>Sənin növbəti <em>gözəllik randevun</em> bir neçə klikə qədər yaxındır.</h1>
            <p className="lead">Etibarlı salonları kəşf et, xidmətini və ustanı seç, real boş saatlardan birinə saniyələr içində rezervasiya et.</p>
            <form className="search landing-search" action="/salons">
              <div className="field"><label htmlFor="q">Nə axtarırsan?</label><input id="q" name="q" placeholder="Saç, manikür, makiyaj…" /></div>
              <div className="field"><label htmlFor="city">Şəhər</label><input id="city" name="city" placeholder="Bakı" /></div>
              <button className="button" type="submit"><Search size={17} /> Axtar</button>
            </form>
            <div className="trust-row" aria-label="Platforma üstünlükləri"><span><CalendarCheck size={16} /> Real availability</span><span><ShieldCheck size={16} /> Tokenlə idarəetmə</span><span><Clock3 size={16} /> Mobil rahat flow</span></div>
          </div>
          <div className="landing-visual" aria-hidden="true">
            <p className="landing-visual-quote">Gözəllik randevusu axtarmaq deyil, tapmaq qədər rahat olmalıdır.</p>
            <ul className="landing-visual-points">
              <li><ShieldCheck size={17} aria-hidden="true" /> Yalnız aktiv və doğrulanmış salonlar platformada yer alır.</li>
              <li><CalendarCheck size={17} aria-hidden="true" /> Boş saatlar real vaxtda göstərilir, saniyələr içində təsdiqlənir.</li>
              <li><Star size={17} fill="currentColor" aria-hidden="true" /> Reytinq və rəylərlə etibarlı seçim etmək asandır.</li>
            </ul>
          </div>
        </div>
      </section>

      {featured && <section className="section featured-section">
        <div className="shell">
          <p className="eyebrow-divider"><span>Bu həftənin seçimi</span></p>
          <h2>Premium salon</h2>
          <article className="featured-salon">
            <div className="featured-salon-image">{featured.imageUrl && <Image src={featured.imageUrl} alt="" width={900} height={700} sizes="(max-width: 1024px) 100vw, 45vw" priority />}</div>
            <div className="featured-salon-body">
              <span className="badge-premium">Ən yüksək qiymətləndirmə</span>
              <h3>{featured.name}</h3>
              <p className="muted small"><MapPin size={14} aria-hidden="true" /> {featured.city} · {featured.address}</p>
              <p className="small"><Star size={14} fill="currentColor" aria-hidden="true" /> {featured.rating.toString()} reytinq</p>
              <p className="service-chips">{featured.services.map((service) => <span key={service.id}>{service.name}</span>)}</p>
              <Link className="button" href={`/salons/${featured.slug}`}>Rezervasiya et <ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
          </article>
        </div>
      </section>}

      <section id="salonlar" className="section">
        <div className="shell">
          <div className="section-head">
            <div><p className="eyebrow-divider"><span>Kürasiya edilmiş seçim</span></p><h2>Seçilmiş salonlar</h2><p className="muted">Keyfiyyətli xidmət, rahat rezervasiya.</p></div>
            <Link className="button secondary" href="/salons">Hamısını gör</Link>
          </div>
          <div className="grid">{rest.map((salon) => <article className="card salon-card" key={salon.id}>
            <div className="card-image-wrap">{salon.imageUrl && <Image src={salon.imageUrl} alt="" width={900} height={600} sizes="(max-width: 760px) 100vw, 33vw" />}</div>
            <div className="card-body">
              <div className="row"><h3>{salon.name}</h3><span className="tag"><Star size={13} fill="currentColor" /> {salon.rating.toString()}</span></div>
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
          <ol className="step-path">
            <li className="step-path-item"><span className="step-badge">1</span><h3>Kəşf et</h3><p className="muted">Şəhərə, xidmətə və zövqünə uyğun salonu seç.</p></li>
            <li className="step-path-item"><span className="step-badge">2</span><h3>Vaxtını seç</h3><p className="muted">Xidmət, usta və real boş saatı müəyyənləşdir.</p></li>
            <li className="step-path-item"><span className="step-badge">3</span><h3>Təsdiq al</h3><p className="muted">Rezervasiyanı idarə etmək üçün təhlükəsiz linkin hazırdır.</p></li>
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="landing-cta">
            <div>
              <h2>Salonunu bu gün seç, sabaha rezervasiya et.</h2>
              <p>Bakıda və digər şəhərlərdə aktiv salonları kəşf et, xidmətini seç, bir neçə saniyəyə növbəni tut.</p>
            </div>
            <div className="cta-actions">
              <Link className="button" href="/salons">Salonları kəşf et <ArrowRight size={16} aria-hidden="true" /></Link>
              <Link className="button secondary" href="/register">Hesab yarat</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
    <footer className="shell footer">© {new Date().getFullYear()} Salonomia · Gözəllik daha əlçatan.</footer>
  </>;
}
