"use client";

import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, Clock3, Plus, RefreshCcw, UserRound, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppointmentActions } from "@/components/AppointmentActions";
import { StatusBadge } from "@/components/StatusBadge";
import { dateLabelFromKey, timeOnly } from "@/lib/format";

type Appointment = { id: string; bookingRef: string; customerName: string; startsAt: string; endsAt: string; status: string; service: string; provider: string };
type Service = { id: string; name: string; durationMinutes: number; priceCents: number };
type Provider = { id: string; name: string };
const dateKey = (value: Date) => value.toISOString().slice(0, 10);

export function ManagerOperations({ appointments, services, providers }: { appointments: Appointment[]; services: Service[]; providers: Provider[] }) {
  const router = useRouter();
  const [day, setDay] = useState(() => dateKey(new Date()));
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const todays = useMemo(() => appointments.filter((item) => item.startsAt.slice(0, 10) === day), [appointments, day]);
  const changeDay = (amount: number) => { const next = new Date(`${day}T12:00:00`); next.setDate(next.getDate() + amount); setDay(dateKey(next)); };

  return <section className="manager-operations" aria-labelledby="manager-title">
    <div className="manager-topbar">
      <div><p className="eyebrow">Gündəlik əməliyyatlar</p><h1 id="manager-title">Təqvim</h1><p className="muted">Günün rezervasiyalarını izləyin və walk-in əlavə edin.</p></div>
      <button type="button" className="button manager-walkin" onClick={() => { setFeedback(null); setOpen(true); }}><Plus size={18} aria-hidden="true" /> Walk-in əlavə et</button>
    </div>
    {feedback && <div className={`manager-feedback ${feedback.type}`} role="status">{feedback.type === "success" ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}<span>{feedback.text}</span></div>}
    <div className="agenda-toolbar" aria-label="Təqvim tarixini seçin">
      <button type="button" className="icon-button" onClick={() => changeDay(-1)} aria-label="Əvvəlki gün"><ChevronLeft size={20} /></button>
      <label className="agenda-date"><CalendarDays size={18} aria-hidden="true" /><input type="date" value={day} onChange={(event) => setDay(event.target.value)} aria-label="Tarix" /><strong>{dateLabelFromKey(day)}</strong></label>
      <button type="button" className="icon-button" onClick={() => changeDay(1)} aria-label="Növbəti gün"><ChevronRight size={20} /></button>
      <button type="button" className="today-button" onClick={() => setDay(dateKey(new Date()))}>Bu gün</button>
    </div>
    <div className="agenda-summary"><span><b>{todays.length}</b> rezervasiya</span><span><b>{todays.filter((item) => item.status === "CONFIRMED").length}</b> təsdiqlənib</span></div>
    <div className="agenda" aria-live="polite">
      {todays.length === 0 ? <div className="agenda-empty"><CalendarDays size={30} /><h2>Bu gün üçün rezervasiya yoxdur</h2><p>Telefonla və ya salonda gələn müştəri üçün walk-in rezervasiyası yarada bilərsiniz.</p><button type="button" className="button secondary" onClick={() => setOpen(true)}><Plus size={17} /> Walk-in əlavə et</button></div> : todays.map((item) => <article className="appointment-card" key={item.id}>
        <div className="appointment-time"><Clock3 size={17} /><b>{timeOnly(item.startsAt)}</b><span>{timeOnly(item.endsAt)}</span></div>
        <div className="appointment-info"><div className="appointment-title"><h2>{item.service}</h2><StatusBadge status={item.status} /></div><p><UserRound size={15} /> {item.customerName} <span aria-hidden="true">·</span> {item.provider}</p><small>#{item.bookingRef}</small></div>
        <div className="appointment-card-actions"><AppointmentActions appointmentId={item.id} currentStatus={item.status} /></div>
      </article>)}
    </div>
    {open && <WalkInDialog services={services} providers={providers} selectedDay={day} onClose={() => setOpen(false)} onSuccess={(bookingRef) => { setOpen(false); setFeedback({ type: "success", text: `Walk-in rezervasiyası yaradıldı: #${bookingRef}` }); router.refresh(); }} onError={(text) => setFeedback({ type: "error", text })} />}
  </section>;
}

function WalkInDialog({ services, providers, selectedDay, onClose, onSuccess, onError }: { services: Service[]; providers: Provider[]; selectedDay: string; onClose: () => void; onSuccess: (bookingRef: string) => void; onError: (text: string) => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [providerId, setProviderId] = useState(providers[0]?.id ?? "");
  const [date, setDate] = useState(selectedDay);
  const [timeValue, setTimeValue] = useState("12:00");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (!serviceId || !providerId || !date) { setSlots([]); return; }
    const controller = new AbortController();
    setSlotsLoading(true);
    fetch(`/api/availability?serviceId=${encodeURIComponent(serviceId)}&providerId=${encodeURIComponent(providerId)}&date=${encodeURIComponent(date)}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : { slots: [] })
      .then((body) => {
        const nextSlots = Array.isArray(body.slots) ? body.slots : [];
        setSlots(nextSlots);
        if (nextSlots[0]) { setTimeValue(timeOnly(nextSlots[0])); setSelectedSlot(nextSlots[0]); }
        else setSelectedSlot("");
      })
      .catch(() => { if (!controller.signal.aborted) setSlots([]); })
      .finally(() => { if (!controller.signal.aborted) setSlotsLoading(false); });
    return () => controller.abort();
  }, [date, providerId, serviceId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setPending(true);
    const data = new FormData(event.currentTarget);
    const values = Object.fromEntries(data);
    const startsAt = selectedSlot || `${String(values.date)}T${String(values.time)}:00.000Z`;
    const result = await fetch("/api/salon/walk-ins", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...values, startsAt }) });
    const body = await result.json().catch(() => ({})); setPending(false);
    if (!result.ok) { const text = body.code === "DOUBLE_BOOKING_CONFLICT" ? "Bu vaxt artıq doludur. Başqa vaxt və ya usta seçin." : "Walk-in yaradılmadı. Məlumatları yoxlayıb yenidən cəhd edin."; setError(text); onError(text); return; }
    onSuccess(body.bookingRef);
  }
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="walkin-dialog" role="dialog" aria-modal="true" aria-labelledby="walkin-title">
      <div className="dialog-heading"><div><p className="eyebrow">Salon rezervasiyası</p><h2 id="walkin-title">Walk-in əlavə et</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Bağla"><X size={20} /></button></div>
      <p className="muted small">Müştərinin məlumatlarını yazın. Sistem uyğunluq və toqquşmanı avtomatik yoxlayır.</p>
      {error && <p className="form-error" role="alert"><CircleAlert size={16} /> {error}</p>}
      <form className="walkin-form" onSubmit={submit}>
        <label>Ad, soyad<input name="customerName" required autoFocus placeholder="Məs. Aysel Məmmədova" /></label>
        <label>Telefon<input name="customerPhone" required inputMode="tel" placeholder="+994 50 000 00 00" /></label>
        <label>E-poçt<input name="customerEmail" required type="email" placeholder="aysel@example.com" /></label>
        <div className="walkin-grid"><label>Xidmət<select name="serviceId" required value={serviceId} onChange={(event) => setServiceId(event.target.value)}> <option value="" disabled>Xidmət seçin</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name} · {service.durationMinutes} dəq</option>)}</select></label><label>Usta<select name="providerId" required value={providerId} onChange={(event) => setProviderId(event.target.value)}> <option value="" disabled>Usta seçin</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></label></div>
        <div className="walkin-grid"><label>Tarix<input name="date" type="date" required value={date} onChange={(event) => { setDate(event.target.value); setSelectedSlot(""); }} /></label><label>Vaxt<input name="time" type="time" required step="1800" value={timeValue} onChange={(event) => { setTimeValue(event.target.value); setSelectedSlot(""); }} /></label></div>
        <div className="walkin-slots" aria-live="polite">
          <p className="form-hint">{slotsLoading ? "Boş slotlar yoxlanılır…" : slots.length ? "Real availability slotlarından birini seçin." : "Xidmət, usta və tarix seçin; boş slotlar burada görünəcək."}</p>
          {slots.length ? <div className="slot-row">{slots.slice(0, 10).map((slot) => { const value = timeOnly(slot); return <button key={slot} type="button" className={slot === selectedSlot ? "slot-pill selected" : "slot-pill"} aria-pressed={slot === selectedSlot} onClick={() => { setTimeValue(value); setSelectedSlot(slot); }}>{value}</button>; })}</div> : null}
        </div>
        <p className="form-hint">Yarat düyməsində sistem toqquşmanı yenidən serverdə yoxlayır.</p>
        <button className="button" disabled={pending} type="submit">{pending ? <><RefreshCcw className="spin" size={17} /> Yaradılır…</> : <><Plus size={17} /> Walk-in yarat</>}</button>
      </form>
    </section>
  </div>;
}
