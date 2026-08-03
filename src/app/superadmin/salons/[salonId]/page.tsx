import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { SalonStatusButton } from "@/components/SalonStatusButton";
import { dateTime, money } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/server/authorization";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  PENDING: "Gözləyir", CONFIRMED: "Təsdiqlənib", CANCELLED: "Ləğv edilib",
  REJECTED: "Rədd edilib", COMPLETED: "Tamamlanıb", NO_SHOW: "Gəlmədi",
  NEEDS_REASSIGNMENT: "Yenidən təyinat",
};

function auditLabel(action: string) {
  return action.replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase());
}

export default async function SalonDetail({ params }: { params: Promise<{ salonId: string }> }) {
  await requireSuperAdmin();
  const { salonId } = await params;
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    include: {
      memberships: { where: { active: true }, select: { id: true, role: true } },
      services: { where: { active: true }, select: { id: true } },
      providers: { where: { active: true }, select: { id: true } },
      appointments: {
        orderBy: { startsAt: "desc" }, take: 8,
        select: { id: true, bookingRef: true, startsAt: true, status: true, priceCents: true, service: { select: { name: true } }, provider: { select: { name: true } } },
      },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 20, include: { actor: { select: { name: true, email: true } } } },
    },
  });
  if (!salon) notFound();

  const totals = await prisma.appointment.aggregate({ where: { salonId }, _count: { id: true }, _sum: { priceCents: true } });
  const completed = await prisma.appointment.aggregate({ where: { salonId, status: "COMPLETED" }, _sum: { priceCents: true } });
  const statusCounts = await prisma.appointment.groupBy({ by: ["status"], where: { salonId }, _count: { _all: true } });
  const countOf = (status: string) => statusCounts.find(item => item.status === status)?._count._all ?? 0;

  return <AdminShell title="Platforma idarəetməsi" links={[{ href: "/superadmin", label: "Salonlar" }]}>
    <Link href="/superadmin" className="back-link">← Bütün salonlar</Link>
    <section className="tenant-hero">
      <div className="tenant-identity">
        <div className="tenant-avatar" aria-hidden="true">{salon.name.slice(0, 1).toUpperCase()}</div>
        <div><p className="eyebrow">Tenant profili</p><div className="title-row"><h1>{salon.name}</h1><span className={`status ${salon.status === "SUSPENDED" ? "status-danger" : ""}`}>{salon.status === "ACTIVE" ? "Aktiv" : "Dayandırılıb"}</span></div><p className="muted">{salon.city} · {salon.timezone} · Qoşulub {dateTime(salon.createdAt)}</p></div>
      </div>
      <SalonStatusButton salonId={salon.id} status={salon.status} />
    </section>

    <section className="metrics tenant-metrics" aria-label="Salon göstəriciləri">
      <div className="metric"><span className="muted">Ümumi rezervasiya</span><b>{totals._count.id}</b><small>{countOf("CONFIRMED")} təsdiqlənib</small></div>
      <div className="metric"><span className="muted">Tamamlanan gəlir</span><b>{money(completed._sum.priceCents ?? 0)}</b><small>Yalnız COMPLETED</small></div>
      <div className="metric"><span className="muted">Aktiv kataloq</span><b>{salon.services.length}</b><small>{salon.providers.length} aktiv usta</small></div>
      <div className="metric"><span className="muted">Aktiv komanda</span><b>{salon.memberships.length}</b><small>{salon.memberships.filter(member => member.role === "SALON_ADMIN").length} salon admin</small></div>
    </section>

    <div className="detail-grid">
      <section className="panel"><div className="panel-heading"><div><p className="eyebrow">Əməliyyatlar</p><h2>Son rezervasiyalar</h2></div><span className="muted small">Şəxsi məlumat göstərilmir</span></div>
        {salon.appointments.length ? <div className="appointment-list">{salon.appointments.map(appointment => <div className="appointment-row" key={appointment.id}>
          <div><b>{appointment.service.name}</b><p className="muted small">#{appointment.bookingRef} · {appointment.provider.name}</p></div>
          <div className="appointment-meta"><span className="status">{statusLabel[appointment.status]}</span><span className="muted small">{dateTime(appointment.startsAt)}</span><b>{money(appointment.priceCents)}</b></div>
        </div>)}</div> : <div className="empty-state">Bu salon üçün hələ rezervasiya yoxdur.</div>}
      </section>
      <aside className="panel"><div className="panel-heading"><div><p className="eyebrow">Tenant məlumatı</p><h2>Əlaqə və qaydalar</h2></div></div>
        <dl className="detail-list"><div><dt>Ünvan</dt><dd>{salon.address}, {salon.city}</dd></div><div><dt>Telefon</dt><dd>{salon.phone}</dd></div><div><dt>Rezervasiya lead time</dt><dd>{salon.bookingLeadMinutes} dəqiqə</dd></div><div><dt>Ləğv pəncərəsi</dt><dd>{salon.cancellationHours} saat</dd></div></dl>
        <div className="status-summary"><span><b>{countOf("CANCELLED")}</b> ləğv</span><span><b>{countOf("NO_SHOW")}</b> gəlmədi</span><span><b>{countOf("PENDING")}</b> gözləyir</span></div>
      </aside>
    </div>

    <section className="panel audit-panel"><div className="panel-heading"><div><p className="eyebrow">Təhlükəsizlik izi</p><h2>Audit fəaliyyəti</h2></div><span className="muted small">Son 20 əməliyyat</span></div>
      {salon.auditLogs.length ? <ol className="audit-timeline">{salon.auditLogs.map(log => <li key={log.id}><span className="audit-dot" aria-hidden="true"/><div><b>{auditLabel(log.action)}</b><p className="muted small">{log.actor?.name ?? "Sistem"} · {log.targetType} · {dateTime(log.createdAt)}</p></div></li>)}</ol> : <div className="empty-state">Bu tenant üçün audit qeydi yoxdur.</div>}
    </section>
  </AdminShell>;
}
