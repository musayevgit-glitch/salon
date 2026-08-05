"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Edit, Info, MapPin, ShieldCheck, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { money, timeOnly } from "@/lib/format";
import { authClient } from "@/lib/auth-client";

/** Reservation draft is kept in sessionStorage so an auth redirect (login/register) can restore
 * the exact step, service, specialist, date and slot the customer was on before finalizing. */
type BookingDraft = { step: Step; selectedServiceId: string; providerId: string; date: string; slot: string; contact: { customerName: string; customerEmail: string; customerPhone: string } };
function draftKey(slug: string) {
  return `salonomia:booking-draft:${slug}`;
}
function readDraft(slug: string): Partial<BookingDraft> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(draftKey(slug));
    return raw ? (JSON.parse(raw) as Partial<BookingDraft>) : null;
  } catch {
    return null;
  }
}
function writeDraft(slug: string, draft: BookingDraft) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(draftKey(slug), JSON.stringify(draft));
  } catch {
    /* sessionStorage unavailable (private mode, etc.) — draft simply won't survive redirect */
  }
}
function clearDraft(slug: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(draftKey(slug));
  } catch { /* no-op */ }
}

type Provider = { id: string; name: string; bio?: string | null; imageUrl?: string | null };
type Service = { id: string; name: string; description?: string | null; priceCents: number; durationMinutes: number; bufferMinutes: number; providers: Provider[] };
type SalonSummary = { id: string; slug: string; name: string; city: string; address: string; rating: string; imageUrl?: string | null };
type Props = { salon: SalonSummary; serviceId: string; services: Service[] };
type Step = 1 | 2 | 3;

const serviceImages = [
  "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=220&q=80",
  "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=220&q=80",
  "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=220&q=80",
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=220&q=80",
];
const fallbackSalon = "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80";
const fallbackAvatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=180&q=80";
const weekdayShort = ["B.e", "Ç.a", "Ç.", "C.a", "C.", "Ş.", "B"];
const stepTitles: Record<Step, string> = { 1: "Xidmət və usta seçin", 2: "Tarix və saat seçin", 3: "Rezervasiyanı təsdiqləyin" };
const stepLabels = ["Xidmət", "Tarix və saat", "Təsdiq"];

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
function niceDate(value: string) {
  if (!value) return "Seçilməyib";
  return new Intl.DateTimeFormat("az-AZ", { day: "numeric", month: "long", year: "numeric", weekday: "long" }).format(new Date(`${value}T12:00:00`));
}
function monthTitle(value: Date) {
  return new Intl.DateTimeFormat("az-AZ", { month: "long", year: "numeric" }).format(value);
}

export function BookingForm({ salon, serviceId, services }: Props) {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [step, setStep] = useState<Step>(1);
  const [selectedServiceId, setSelectedServiceId] = useState(serviceId || services[0]?.id || "");
  const selectedService = useMemo(() => services.find((service) => service.id === selectedServiceId) ?? services[0], [selectedServiceId, services]);
  const providers = useMemo(() => selectedService?.providers ?? [], [selectedService]);
  const [providerId, setProviderId] = useState(providers[0]?.id ?? "");
  const selectedProvider = providers.find((provider) => provider.id === providerId) ?? providers[0];
  const [date, setDate] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [contact, setContact] = useState({ customerName: "", customerEmail: "", customerPhone: "" });
  const [restored, setRestored] = useState(false);

  // Restore an in-progress reservation (service/specialist/date/slot/contact/step) after an
  // auth redirect sent the customer to /login or /register mid-flow. Browsing never requires
  // an account — only finalizing a reservation does — so this only matters once, right here.
  useEffect(() => {
    const draft = readDraft(salon.slug);
    if (draft) {
      if (draft.selectedServiceId) setSelectedServiceId(draft.selectedServiceId);
      if (draft.providerId) setProviderId(draft.providerId);
      if (draft.date) setDate(draft.date);
      if (draft.slot) setSlot(draft.slot);
      if (draft.contact) setContact(draft.contact);
      if (draft.step) setStep(draft.step);
    }
    setRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!restored) return;
    writeDraft(salon.slug, { step, selectedServiceId, providerId, date, slot, contact });
  }, [restored, salon.slug, step, selectedServiceId, providerId, date, slot, contact]);

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

  function redirectToAuth() {
    // Reservation drafts are already persisted continuously (see the effect above); we only
    // need to send the customer to auth and bring them straight back to this exact URL.
    const next = `${window.location.pathname}${window.location.search}`;
    router.push(`/login?next=${encodeURIComponent(next)}`);
  }

  async function submit() {
    setError("");
    if (!selectedService?.id || !providerId || !slot) {
      setError("Xidmət, usta, tarix və saat seçin.");
      return;
    }
    if (!contact.customerName || !contact.customerEmail || !contact.customerPhone) {
      setError("Rezervasiya üçün əlaqə məlumatlarını tamamlayın.");
      return;
    }
    // Business rule: browsing and selecting a service/specialist/time never requires an account —
    // an account is required only at the moment of finalizing the reservation.
    if (!sessionLoading && !session) {
      redirectToAuth();
      return;
    }
    setPending(true);
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ salonId: salon.id, serviceId: selectedService.id, providerId, startsAt: slot, ...contact, idempotencyKey: crypto.randomUUID() }),
    });
    const json = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      if (response.status === 401 || json.code === "UNAUTHENTICATED") {
        redirectToAuth();
        return;
      }
      setError(json.code === "DOUBLE_BOOKING_CONFLICT" ? "Bu saat artıq başqa istifadəçi tərəfindən rezervasiya edilib. Başqa saat seçin." : json.code || "Rezervasiya yaradılmadı. Yenidən cəhd edin.");
      setSlot("");
      setStep(2);
      return;
    }
    clearDraft(salon.slug);
    router.push(`/confirm/${json.bookingRef}?token=${encodeURIComponent(json.token)}`);
  }

  const canContinue = step === 1 ? Boolean(selectedService && selectedProvider) : step === 2 ? Boolean(date && slot) : true;
  const needsAuth = step === 3 && !sessionLoading && !session;
  const continueLabel = step === 3 ? (pending ? "Rezervasiya yaradılır..." : needsAuth ? "Daxil olub davam et" : "Rezervasiyanı yarat") : "Davam et";
  const summaryPrice = selectedService ? money(selectedService.priceCents) : "Seçilməyib";

  return <main className="reservation-page">
    <div className="shell reservation-shell">
      <div className="reservation-page-head">
        <button type="button" className="back-link" onClick={() => step > 1 ? setStep((step - 1) as Step) : router.push(`/salons/${salon.slug}`)}><ChevronLeft size={16} aria-hidden="true" /> Geri</button>
        <p className="reservation-kicker">{salon.name}</p>
        <h1>{stepTitles[step]}</h1>
      </div>

      <ReservationStepper step={step} />

      <div className="reservation-luxury">
        <div className="reservation-main">
          {step === 1 && <ServiceStep salon={salon} services={services} selectedServiceId={selectedService?.id ?? ""} selectedProvider={selectedProvider} providerId={providerId} providers={providers} setProviderId={setProviderId} setSelectedServiceId={setSelectedServiceId} />}
          {step === 2 && <DateTimeStep selectedService={selectedService} selectedProvider={selectedProvider} date={date} setDate={setDate} calendarMonth={calendarMonth} setCalendarMonth={setCalendarMonth} slots={slots} slot={slot} setSlot={setSlot} loading={loading} onEdit={() => setStep(1)} />}
          {step === 3 && <ConfirmStep salon={salon} selectedService={selectedService} selectedProvider={selectedProvider} date={date} slot={slot} contact={contact} setContact={setContact} needsAuth={needsAuth} />}
          {error && <p role="alert" className="form-error">{error}</p>}
        </div>

        <aside className="reservation-summary-card" aria-label="Rezervasiya xülasəsi">
          <h2>Seçimləriniz</h2>
          <div className="summary-row"><span>Salon</span><b>{salon.name}</b></div>
          <div className="summary-row"><span>Usta</span><b>{selectedProvider?.name ?? "Seçilməyib"}</b></div>
          <div className="summary-row"><span>Xidmət</span><b>{selectedService?.name ?? "Seçilməyib"}</b></div>
          <div className="summary-row"><span>Tarix</span><b>{date ? niceDate(date) : "Seçilməyib"}</b></div>
          <div className="summary-row"><span>Saat</span><b>{slot ? timeOnly(slot) : "Seçilməyib"}</b></div>
          <div className="price-total"><span>Ümumi məbləğ</span><b>{summaryPrice}</b></div>
          <p className="payment-note"><Clock3 size={15} aria-hidden="true" /> Ödəniş salon daxilində nağd və ya kartla həyata keçiriləcək.</p>
          <div className="desktop-submit">
            <button type="button" className="button" disabled={!canContinue || pending} onClick={() => step === 3 ? void submit() : setStep((step + 1) as Step)}>{continueLabel}</button>
          </div>
        </aside>
      </div>

      <div className="mobile-sticky-reservation">
        <span>Ümumi məbləğ<b>{summaryPrice}</b></span>
        <button type="button" className="button" disabled={!canContinue || pending} onClick={() => step === 3 ? void submit() : setStep((step + 1) as Step)}>{continueLabel}</button>
      </div>
    </div>
  </main>;
}

function ReservationStepper({ step }: { step: Step }) {
  return <ol className="reservation-progress">
    {stepLabels.map((label, index) => {
      const current = (index + 1) as Step;
      const state = current < step ? "done" : current === step ? "active" : "";
      return <li key={label} className={state}>
        <span>{current < step ? <Check size={13} aria-hidden="true" /> : current}</span>
        {label}
      </li>;
    })}
  </ol>;
}

function ServiceStep({ salon, services, selectedServiceId, selectedProvider, providerId, providers, setProviderId, setSelectedServiceId }: { salon: SalonSummary; services: Service[]; selectedServiceId: string; selectedProvider?: Provider; providerId: string; providers: Provider[]; setProviderId: (id: string) => void; setSelectedServiceId: (id: string) => void }) {
  return <>
    <section className="reservation-panel salon-summary-card">
      <div className="salon-thumb"><Image src={salon.imageUrl || fallbackSalon} alt={`${salon.name} interyeri`} width={84} height={84} /></div>
      <div>
        <h2>{salon.name}</h2>
        <p className="muted small"><MapPin size={14} aria-hidden="true" /> {salon.address}, {salon.city}</p>
        <p className="small"><Star size={14} fill="currentColor" aria-hidden="true" /> {salon.rating} (128 rəy)</p>
        <a href={`/salons/${salon.slug}`}>Salon profilinə bax</a>
      </div>
    </section>

    <fieldset className="reservation-panel">
      <legend><span>1</span> Xidmət seçin</legend>
      <div className="service-radio-list">
        {services.map((service, index) => {
          const checked = service.id === selectedServiceId;
          return <label className={`service-radio-card ${checked ? "selected" : ""}`} key={service.id}>
            <input type="radio" name="selectedService" checked={checked} onChange={() => setSelectedServiceId(service.id)} />
            <span className="service-art"><Image src={serviceImages[index % serviceImages.length]} alt="" width={52} height={52} /></span>
            <span className="service-copy"><b>{service.name}</b><small>{service.durationMinutes} dəq</small></span>
            <span className="service-price">{money(service.priceCents)}</span>
            <span className="radio-dot" aria-hidden="true" />
          </label>;
        })}
      </div>
      <p className="reservation-note"><Info size={16} aria-hidden="true" /> Qiymətlər ustaya görə dəyişə bilər.</p>
    </fieldset>

    <fieldset className="reservation-panel">
      <legend><span>2</span> Usta seçin</legend>
      <div className="service-radio-list">
        {providers.map((provider) => {
          const checked = provider.id === providerId;
          return <label className={`service-radio-card ${checked ? "selected" : ""}`} key={provider.id}>
            <input type="radio" name="selectedProvider" checked={checked} onChange={() => setProviderId(provider.id)} />
            <span className="service-art"><Image src={provider.imageUrl || fallbackAvatar} alt="" width={52} height={52} /></span>
            <span className="service-copy"><b>{provider.name}</b><small>{provider.bio ? "Saç stilisti" : "Gözəllik mütəxəssisi"}</small><em><Star size={12} fill="currentColor" aria-hidden="true" /> 4.9 (86)</em></span>
            <span className="radio-dot" aria-hidden="true" />
          </label>;
        })}
        {providers.length === 0 && <p className="empty-inline">Bu xidmət üçün usta tapılmadı.</p>}
      </div>
      {selectedProvider && <p className="reservation-note"><ShieldCheck size={16} aria-hidden="true" /> Seçilmiş usta: <b>{selectedProvider.name}</b></p>}
    </fieldset>
  </>;
}

function DateTimeStep({ selectedService, selectedProvider, date, setDate, calendarMonth, setCalendarMonth, slots, slot, setSlot, loading, onEdit }: { selectedService?: Service; selectedProvider?: Provider; date: string; setDate: (value: string) => void; calendarMonth: Date; setCalendarMonth: (value: Date) => void; slots: string[]; slot: string; setSlot: (value: string) => void; loading: boolean; onEdit: () => void }) {
  return <>
    <section className="reservation-panel specialist-summary-card">
      <span className="specialist-avatar"><Image src={selectedProvider?.imageUrl || fallbackAvatar} alt="" width={54} height={54} /></span>
      <span><b>{selectedProvider?.name ?? "Usta seçilməyib"}</b><small>{selectedService?.name ?? "Xidmət"} • {selectedService ? money(selectedService.priceCents) : "Seçilməyib"}</small></span>
      <button type="button" className="button secondary compact" onClick={onEdit}><Edit size={14} aria-hidden="true" /> Redaktə et</button>
    </section>

    <div className="reservation-panel date-time-grid">
      <div className="luxury-date-field">
        <b>Tarix seçin</b>
        <CalendarCard value={date} month={calendarMonth} setMonth={setCalendarMonth} onSelect={setDate} />
        <p className="selected-date"><CalendarDays size={15} aria-hidden="true" /> Seçilmiş tarix: {niceDate(date)}</p>
      </div>
      <div>
        <div className="slot-heading">
          <label><Clock3 size={15} aria-hidden="true" /> Saat seçin</label>
          <div className="slot-legend">
            <span><i className="available" /> Mövcuddur</span>
            <span><i className="selected" /> Seçilmiş</span>
            <span><i className="busy" /> Doludur</span>
          </div>
        </div>
        <div className="luxury-slots" aria-live="polite">
          {loading && <p className="empty-inline">Boş saatlar yoxlanılır…</p>}
          {!loading && slots.map((value) => <button type="button" className="slot" key={value} aria-pressed={slot === value} onClick={() => setSlot(value)}>{timeOnly(value)}</button>)}
          {!loading && date && slots.length === 0 && <p className="empty-inline">Bu tarix üçün boş saat yoxdur.</p>}
          {!loading && !date && <p className="empty-inline">Tarix seçdikdən sonra boş saatlar görünəcək.</p>}
        </div>
        <p className="reservation-note"><Clock3 size={15} aria-hidden="true" /> Seçilmiş saat 10 dəqiqəlik müddət üçün sizin üçün bloklanacaq.</p>
      </div>
    </div>
  </>;
}

function CalendarCard({ value, month, setMonth, onSelect }: { value: string; month: Date; setMonth: (value: Date) => void; onSelect: (value: string) => void }) {
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const startOffset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - startOffset);
    return Array.from({ length: 35 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [month]);
  const today = dateKey(new Date());
  return <section className="cal-grid">
    <div className="cal-head">
      <button type="button" aria-label="Əvvəlki ay" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={18} aria-hidden="true" /></button>
      <b>{monthTitle(month)}</b>
      <button type="button" aria-label="Növbəti ay" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={18} aria-hidden="true" /></button>
    </div>
    <div className="cal-weekdays">{weekdayShort.map((day) => <span key={day}>{day}</span>)}</div>
    <div className="cal-days">{days.map((day) => {
      const key = dateKey(day);
      const disabled = key < today;
      const other = day.getMonth() !== month.getMonth();
      return <button type="button" key={key} disabled={disabled} className={`${value === key ? "selected" : ""} ${key === today ? "today" : ""} ${other ? "muted" : ""}`} onClick={() => onSelect(key)}>{day.getDate()}</button>;
    })}</div>
  </section>;
}

function ConfirmStep({ salon, selectedService, selectedProvider, date, slot, contact, setContact, needsAuth }: { salon: SalonSummary; selectedService?: Service; selectedProvider?: Provider; date: string; slot: string; contact: { customerName: string; customerEmail: string; customerPhone: string }; setContact: (value: { customerName: string; customerEmail: string; customerPhone: string }) => void; needsAuth?: boolean }) {
  return <>
    {needsAuth && <p className="reservation-note auth-gate-note" role="status"><ShieldCheck size={16} aria-hidden="true" /> Rezervasiyanı təsdiqləmək üçün hesabınıza daxil olmalısınız. Bütün seçimləriniz saxlanılıb — daxil olduqdan sonra buraya geri qayıdacaqsınız.</p>}

    <fieldset className="reservation-panel">
      <legend><span>3</span> Rezervasiya məlumatları</legend>
      <ConfirmRow label="Salon" value={salon.name} />
      <ConfirmRow label="Usta" value={selectedProvider?.name ?? "Seçilməyib"} />
      <ConfirmRow label="Xidmət" value={selectedService?.name ?? "Seçilməyib"} />
      <ConfirmRow label="Qiymət" value={selectedService ? money(selectedService.priceCents) : "Seçilməyib"} />
      <ConfirmRow label="Tarix" value={niceDate(date)} />
      <ConfirmRow label="Saat" value={slot ? timeOnly(slot) : "Seçilməyib"} />
      <ConfirmRow label="Müddət" value={selectedService ? `${selectedService.durationMinutes} dəq` : "Seçilməyib"} />
    </fieldset>

    <fieldset className="reservation-panel">
      <legend><span>4</span> Əlaqə məlumatları</legend>
      <div className="booking-grid">
        <label className="field"><span>Ad və soyad</span><input aria-label="Ad və soyad" value={contact.customerName} onChange={(event) => setContact({ ...contact, customerName: event.target.value })} placeholder="Aysel Məmmədova" /></label>
        <label className="field"><span>E-poçt</span><input aria-label="E-poçt" type="email" value={contact.customerEmail} onChange={(event) => setContact({ ...contact, customerEmail: event.target.value })} placeholder="aysel@example.com" /></label>
        <label className="field" style={{ gridColumn: "1/-1" }}><span>Telefon</span><input aria-label="Telefon" type="tel" value={contact.customerPhone} onChange={(event) => setContact({ ...contact, customerPhone: event.target.value })} placeholder="+994 50 000 00 00" /></label>
      </div>
    </fieldset>

    <section className="reservation-panel policy-card">
      <div>
        <h2><ShieldCheck size={18} aria-hidden="true" /> Rezervasiya qaydaları</h2>
        <ul>
          <li>Rezervasiya təsdiqi salon admini tərəfindən ediləcək.</li>
          <li>Gözləmədə statusu ilə yaradılır.</li>
          <li>24 saat qalmış ləğv edilərsə qeyd edilə bilər.</li>
          <li>Gecikmə halında rezervasiya ləğv oluna bilər.</li>
        </ul>
      </div>
    </section>

    <p className="payment-highlight"><Clock3 size={18} aria-hidden="true" /> Ödəniş salon daxilində nağd və ya kartla həyata keçiriləcək.</p>
    <p className="reservation-note">Rezervasiya yaratmaqla qaydaları qəbul etmiş olursunuz.</p>
  </>;
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return <div className="summary-row"><span>{label}</span><b>{value}</b></div>;
}
