import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { SalonStatusButton } from "@/components/SalonStatusButton";
import { requireSuperAdmin } from "@/server/authorization";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SuperAdmin() {
  await requireSuperAdmin();
  const salons = await prisma.salon.findMany({
    include: { _count: { select: { appointments: true, memberships: true } } },
    orderBy: { createdAt: "desc" },
  });

  return <AdminShell title="Platforma idarəetməsi" links={[{ href: "/superadmin", label: "Salonlar" }]}>
    <div className="page-heading">
      <div><p className="eyebrow-divider"><span>Platforma nəzarəti</span></p><h1>Salonlar</h1><p className="muted">Tenant vəziyyəti və fəaliyyətini bir yerdən izləyin.</p></div>
    </div>
    <div className="metrics">
      <div className="metric"><span className="muted">Cəmi salon</span><b>{salons.length}</b></div>
      <div className="metric"><span className="muted">Aktiv salon</span><b>{salons.filter(x => x.status === "ACTIVE").length}</b></div>
      <div className="metric"><span className="muted">Dayandırılıb</span><b>{salons.filter(x => x.status === "SUSPENDED").length}</b></div>
      <div className="metric"><span className="muted">Rezervasiyalar</span><b>{salons.reduce((sum, s) => sum + s._count.appointments, 0)}</b></div>
    </div>
    <div className="table-wrap"><table><thead><tr><th>Salon</th><th>Status</th><th>Rezervasiyalar</th><th>Komanda</th><th>Əməliyyat</th></tr></thead><tbody>{salons.map(s => <tr key={s.id}>
      <td data-label="Salon"><Link className="entity-link" href={`/superadmin/salons/${s.id}`}>{s.name}</Link><br/><span className="muted small">{s.city}</span></td>
      <td data-label="Status"><span className={`status ${s.status === "SUSPENDED" ? "status-danger" : ""}`}>{s.status === "ACTIVE" ? "Aktiv" : "Dayandırılıb"}</span></td>
      <td data-label="Rezervasiyalar">{s._count.appointments}</td><td data-label="Komanda">{s._count.memberships}</td>
      <td data-label="Əməliyyat"><div className="row-actions"><Link className="button secondary compact" href={`/superadmin/salons/${s.id}`}>Detallara bax</Link><SalonStatusButton salonId={s.id} status={s.status}/></div></td>
    </tr>)}</tbody></table></div>
  </AdminShell>;
}
