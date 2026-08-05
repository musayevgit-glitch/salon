import crypto from "node:crypto";
import { CalendarCheck, Clock3 } from "lucide-react";
import { notFound } from "next/navigation";
import { CustomerBookingActions } from "@/components/CustomerBookingActions";
import { PublicHeader } from "@/components/PublicHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { prisma } from "@/lib/prisma";
import { appointmentStatusDescription, dateTime, money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Confirm({ params, searchParams }: { params: Promise<{ bookingRef: string }>; searchParams: Promise<{ token?: string }> }) {
  const { bookingRef } = await params;
  const { token } = await searchParams;
  const a = await prisma.appointment.findUnique({ where: { bookingRef }, include: { salon: true, service: true, provider: true } });
  if (!a) notFound();
  const valid = token ? crypto.createHash("sha256").update(token).digest("hex") === a.manageTokenHash : false;
  return <>
    <PublicHeader />
    <main className="shell booking">
      <div className="confirm-badge" aria-hidden="true"><CalendarCheck size={28} /></div>
      <p className="eyebrow-divider"><span>{appointmentStatusDescription[a.status] ?? "Rezervasiya qeydə alındı"}</span></p>
      <h1 style={{ fontSize: "2.3rem" }}>Rezervasiya #{a.bookingRef}</h1>
      <section className="card card-body">
        <h2>{a.salon.name}</h2>
        <p>{a.service.name} · {a.provider.name}</p>
        <p>{dateTime(a.startsAt)} · {money(a.priceCents)}</p>
        <p><StatusBadge status={a.status} /></p>
        <p className="muted small" style={{ display: "flex", alignItems: "center", gap: 6 }}><Clock3 size={14} /> Ödəniş salon daxilində nağd və ya kartla həyata keçiriləcək.</p>
        {valid ? <CustomerBookingActions bookingRef={a.bookingRef} token={token!} providerId={a.providerId} serviceId={a.serviceId} salonName={a.salon.name} serviceName={a.service.name} providerName={a.provider.name} startsAt={a.startsAt.toISOString()} status={a.status} /> : <p className="muted">İdarəetmə üçün təhlükəsiz keçidi istifadə edin.</p>}
      </section>
    </main>
  </>;
}
