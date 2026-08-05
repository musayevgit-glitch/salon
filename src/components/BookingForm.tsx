"use client";

import { CalendarDays, Check, CheckCircle2, Clock3, CreditCard, Loader2, MapPin, Scissors, ShieldCheck, Sparkles, Star, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { money, timeOnly } from "@/lib/format";

type Provider = { id: string; name: string; bio?: string | null; imageUrl?: string | null };
type Service = { id: string; name: string; description?: string | null; priceCents: number; durationMinutes: number; bufferMinutes: number; providers: Provider[] };
type SalonSummary = { id: string; slug: string; name: string; city: string; address: string; rating: string; imageUrl?: string | null };
type Props = { salon: SalonSummary; serviceId: string; services: Service[] };

const formatDate = (value: string) => {
  if (!value) return "Seçilməyib";
  return new Intl.DateTimeFormat("az-AZ", { day: "numeric", month: "long", year: "numeric", weekday: "long" }).format(new Date(`${value}T12:00:00`));
};

export function BookingForm({ salon, serviceId, services }: Props) {
  const router = useRouter();
  const [selectedServiceId, setSelectedServiceId] = useState(serviceId || services[0]?.id || "");
  const selectedService = useMemo(() => services.find((service) => service.id === selectedServiceId) ?? services[0], [selectedServiceId, services]);
  const providers = useMemo(() => selectedService?.providers ?? [], [selectedService]);
  const [providerId, setProviderId] = useState(providers[0]?.id ?? "");
  const selectedProvider = providers.find((provider) => provider.id === providerId) ?? providers[0];
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!providers.some((provider) => provider.id === providerId)) setProviderId(providers[0]?.id ?? "");
  }, [providerId, providers]);

  useEffect(() => {
    if (!date || !providerId || !selectedService?.id) {
      setSlots([]);
      setSlot("");
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setSlot("");
    fetch(`/api/availability?providerId=${encodeURIComponent(providerId)}&serviceId=${encodeURIComponent(selectedService.id)}&date=${encodeURIComponent(date)}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : { slots: [] })
      .then((body) => setSlots(Array.isArray(body.slots) ? body.slots : []))
      .catch(() => { if (!controller.signal.aborted) setSlots([]); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [date, providerId, selectedService?.id]);

  async function submit(form: FormData) {
    setError("");
    if (!selectedService?.id || !providerId || !slot) {
      setError("Xidmət, usta, tarix və real availability-dən boş saat seçin.");
      return;
    }
    setPending(true);
    const body = {
      salonId: salon.id,
      serviceId: selectedService.id,
      providerId,
      startsAt: slot,
      customerName: form.get("customerName"),
      customerEmail: form.get("customerEmail"),
      customerPhone: form.get("customerPhone"),
      idempotencyKey: crypto.randomUUID(),
    };
    const response = await fetch("/api/bookings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const json = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(json.code === "DOUBLE_BOOKING_CONFLICT" ? "Bu saat artıq başqa istifadəçi tərəfindən rezervasiya edilib. Zəhmət olmasa başqa saat seçin." : json.code || "Rezervasiya yaradılmadı. Bağlantını yoxlayıb yenidən cəhd edin.");
      setSlot("");
      return;
    }
    router.push(`/confirm/${json.bookingRef}?token=${encodeURIComponent(json.token)}`);
  }

  return <form action={submit} className="reservation-luxury" aria-describedby="reservation-helper">
    <div className="reservation-main">
      <ReservationProgress selectedService={Boolean(selectedService)} selectedSlot={Boolean(slot)} />
      <section className="reservation-panel salon-summary-card" aria-label="Salon məlumatı">
        <div className="salon-thumb" aria-hidden="true">{salon.imageUrl ? "" : <Sparkles size={22} />}</div>
        <div>
          <p className="reservation-kicker">SALONOMIA</p>
          <h2>{salon.name}</h2>
          <p className="muted"><MapPin size={15} aria-hidden="true" /> {salon.address}, {salon.city}</p>
          <p className="small"><Star size={14} fill="currentColor" aria-hidden="true" /> {salon.rating} · 128 rəy · <a href={`/salons/${salon.slug}`}>Salon profilinə bax</a></p>
        </div>
      </section>

      <fieldset className="reservation-panel">
        <legend><span>1</span> Xidmət seçin</legend>
        <div className="service-radio-list">
          {services.map((service) => {
            const checked = service.id === selectedService?.id;
            return <label className={`service-radio-card ${checked ? "selected" : ""}`} key={service.id}>
              <input type="radio" name="selectedService" checked={checked} onChange={() => setSelectedServiceId(service.id)} />
              <span className="service-art"><Scissors size={18} aria-hidden="true" /></span>
              <span className="service-copy"><b>{service.name}</b><small>{service.description || "Premium salon xidməti"}</small><em>{service.durationMinutes} dəq</em></span>
              <span className="service-price">{money(service.priceCents)}</span>
              <span className="radio-dot" aria-hidden="true">{checked && <Check size={13} />}</span>
            </label>;
          })}
        </div>
        <p className="reservation-note"><Sparkles size={16} /> Qiymətlər ustaya və xidmətin xüsusiyyətlərinə görə dəyişə bilər.</p>
      </fieldset>

      <fieldset className="reservation-panel">
        <legend><span>2</span> Tarix və saat seçin</legend>
        <div className="specialist-summary-card">
          <div className="specialist-avatar"><UserRound size={22} aria-hidden="true" /></div>
          <div><b>{selectedProvider?.name ?? "Usta seçilməyib"}</b><small>{selectedProvider?.bio || "Gözəllik mütəxəssisi"} · ★ 4.9</small></div>
          <label className="compact-select"><span>Dəyiş</span><select id="provider" aria-label="Usta" value={providerId} onChange={(event) => setProviderId(event.target.value)}>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></label>
        </div>
        <div className="date-time-grid">
          <div className="field luxury-date-field">
            <label htmlFor="date"><CalendarDays size={15} aria-hidden="true" /> Tarix seçin</label>
            <input id="date" type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.target.value)} required />
            <p className="selected-date">Seçilmiş tarix: <b>{formatDate(date)}</b></p>
          </div>
          <div className="slot-field">
            <div className="slot-heading"><label><Clock3 size={15} aria-hidden="true" /> Saat seçin</label><SlotLegend /></div>
            {loading ? <div className="slot-skeleton" role="status"><Loader2 className="spin" size={17} /> Boş saatlar yoxlanılır…</div> : <div className="slots luxury-slots" aria-live="polite">
              {slots.map((value) => <button type="button" aria-pressed={slot === value} className="slot" onClick={() => setSlot(value)} key={value}>{timeOnly(value)}</button>)}
              {date && !slots.length && <EmptyInline title="Boş saat yoxdur" text="Seçilmiş tarix üçün bütün saatlar doludur. Başqa tarix seçin." />}
              {!date && <EmptyInline title="Tarix seçin" text="Boş saatlar real availability əsasında burada görünəcək." />}
            </div>}
            <p className="reservation-note">Seçilmiş saat rezervasiya tamamlanana qədər qısa müddət ərzində saxlanıla bilər.</p>
          </div>
        </div>
      </fieldset>

      <fieldset className="reservation-panel">
        <legend><span>3</span> Rezervasiyanı təsdiqləyin</legend>
        <p id="reservation-helper" className="muted">Məlumatları yoxlayın və əlaqə məlumatlarınızı yazın. Ödəniş salon daxilində edilir.</p>
        <div className="booking-grid">
          <div className="field"><label htmlFor="name">Ad və soyad</label><input id="name" name="customerName" autoComplete="name" required minLength={2} placeholder="Aysel Məmmədova" /></div>
          <div className="field"><label htmlFor="email">E-poçt</label><input id="email" name="customerEmail" autoComplete="email" inputMode="email" type="email" required placeholder="aysel@example.com" /></div>
          <div className="field"><label htmlFor="phone">Telefon</label><input id="phone" name="customerPhone" autoComplete="tel" inputMode="tel" type="tel" required placeholder="+994 50 000 00 00" /></div>
        </div>
        <div className="policy-card"><ShieldCheck size={18} /><ul><li>Rezervasiya əvvəlcə “Gözləmədə” statusu ilə yaradılır.</li><li>Salon rezervasiyanı qəbul və ya rədd edə bilər.</li><li>Ödəniş salon daxilində nağd və ya kartla ediləcək.</li></ul></div>
      </fieldset>
      {error && <p role="alert" className="form-error">{error}</p>}
    </div>

    <aside className="reservation-summary-card" aria-label="Rezervasiya xülasəsi">
      <p className="reservation-kicker">Ümumi baxış</p>
      <h2>Rezervasiya xülasəsi</h2>
      <SummaryRow label="Salon" value={salon.name} />
      <SummaryRow label="Usta" value={selectedProvider?.name || "Seçilməyib"} />
      <SummaryRow label="Xidmət" value={selectedService?.name || "Seçilməyib"} />
      <SummaryRow label="Tarix" value={formatDate(date)} />
      <SummaryRow label="Saat" value={slot ? timeOnly(slot) : "Seçilməyib"} />
      <SummaryRow label="Müddət" value={selectedService ? `${selectedService.durationMinutes} dəq` : "Seçilməyib"} />
      <div className="price-total"><span>Ümumi məbləğ</span><b>{selectedService ? money(selectedService.priceCents) : "Seçilməyib"}</b></div>
      <p className="payment-note"><CreditCard size={16} /> Online payment MVP-də yoxdur; ödəniş salonda ediləcək.</p>
      {slot && <p className="success-inline" role="status"><CheckCircle2 size={17} /> Seçilmiş saat: {timeOnly(slot)}</p>}
    </aside>

    <div className="mobile-sticky-reservation">
      <div><span>Ümumi məbləğ</span><b>{selectedService ? money(selectedService.priceCents) : "Seçilməyib"}</b></div>
      <button className="button" disabled={pending} type="submit">{pending ? <><Loader2 className="spin" size={17} /> Rezervasiya yaradılır...</> : "Rezervasiyanı təsdiqlə"}</button>
    </div>
    <div className="desktop-submit"><button className="button" disabled={pending} type="submit">{pending ? <><Loader2 className="spin" size={17} /> Rezervasiya yaradılır...</> : "Rezervasiyanı təsdiqlə"}</button></div>
  </form>;
}

function ReservationProgress({ selectedService, selectedSlot }: { selectedService: boolean; selectedSlot: boolean }) {
  const steps = [{ label: "Xidmət", done: selectedService, active: !selectedSlot }, { label: "Tarix və saat", done: selectedSlot, active: selectedService && !selectedSlot }, { label: "Təsdiq", done: false, active: selectedSlot }];
  return <ol className="reservation-progress" aria-label="Rezervasiya addımları">{steps.map((step, index) => <li className={`${step.done ? "done" : ""} ${step.active ? "active" : ""}`} key={step.label}><span>{step.done ? <Check size={14} /> : index + 1}</span><b>{step.label}</b></li>)}</ol>;
}

function SlotLegend() {
  return <div className="slot-legend" aria-label="Saat statusları"><span><i className="available" /> Mövcuddur</span><span><i className="selected" /> Seçilib</span><span><i className="busy" /> Dolu</span></div>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="summary-row"><span>{label}</span><b>{value}</b></div>;
}

function EmptyInline({ title, text }: { title: string; text: string }) {
  return <div className="empty-inline"><b>{title}</b><span>{text}</span></div>;
}
