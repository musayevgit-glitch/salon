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

  return <section className="shot-reservation" aria-label="Rezervasiya axını">
    <div className="shot-phone">
      <header className="shot-topbar">
        <button type="button" aria-label="Geri" onClick={() => step > 1 ? setStep((step - 1) as Step) : router.push(`/salons/${salon.slug}`)}><ChevronLeft size={22} /></button>
        <h1>{step === 1 ? "Rezervasiya et" : step === 2 ? "Tarix və saat seçin" : "Rezervasiyanı təsdiqləyin"}</h1>
        <span aria-hidden="true" />
      </header>

      <div className="shot-screen">
        {step === 1 && <ServiceStep salon={salon} services={services} selectedServiceId={selectedService?.id ?? ""} selectedProvider={selectedProvider} providerId={providerId} providers={providers} setProviderId={setProviderId} setSelectedServiceId={setSelectedServiceId} />}
        {step === 2 && <DateTimeStep selectedService={selectedService} selectedProvider={selectedProvider} date={date} setDate={setDate} calendarMonth={calendarMonth} setCalendarMonth={setCalendarMonth} slots={slots} slot={slot} setSlot={setSlot} loading={loading} onEdit={() => setStep(1)} />}
        {step === 3 && <ConfirmStep salon={salon} selectedService={selectedService} selectedProvider={selectedProvider} date={date} slot={slot} contact={contact} setContact={setContact} needsAuth={needsAuth} />}
        {error && <p role="alert" className="shot-error">{error}</p>}
      </div>

      <footer className="shot-footer">
        <button type="button" className="shot-primary" disabled={!canContinue || pending} onClick={() => step === 3 ? void submit() : setStep((step + 1) as Step)}>{continueLabel}</button>
        <BottomStepper step={step} />
      </footer>
    </div>
  </section>;
}

function ServiceStep({ salon, services, selectedServiceId, selectedProvider, providerId, providers, setProviderId, setSelectedServiceId }: { salon: SalonSummary; services: Service[]; selectedServiceId: string; selectedProvider?: Provider; providerId: string; providers: Provider[]; setProviderId: (id: string) => void; setSelectedServiceId: (id: string) => void }) {
  return <>
    <section className="shot-salon-card">
      <Image src={salon.imageUrl || fallbackSalon} alt={`${salon.name} interyeri`} width={136} height={136} />
      <div>
        <h2>{salon.name}</h2>
        <p><MapPin size={14} /> {salon.address}, {salon.city}</p>
        <p><Star size={14} fill="currentColor" /> {salon.rating} (128)</p>
        <a href={`/salons/${salon.slug}`}>Salon profilinə bax</a>
      </div>
    </section>
    <h3 className="shot-section-title">Usta</h3>
    <label className="shot-master-card">
      <Image src={selectedProvider?.imageUrl || fallbackAvatar} alt="" width={62} height={62} />
      <span><b>{selectedProvider?.name ?? "Usta seçin"}</b><small>{selectedProvider?.bio ? "Saç stilisti" : "Gözəllik mütəxəssisi"}</small><em><Star size={13} fill="currentColor" /> 4.9 (86)</em></span>
      <select aria-label="Usta" value={providerId} onChange={(event) => setProviderId(event.target.value)}>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select>
      <ChevronRight size={20} aria-hidden="true" />
    </label>
    <h3 className="shot-section-title">Xidmət</h3>
    <div className="shot-service-list">{services.map((service, index) => {
      const checked = service.id === selectedServiceId;
      return <label className={`shot-service ${checked ? "selected" : ""}`} key={service.id}>
        <Image src={serviceImages[index % serviceImages.length]} alt="" width={62} height={62} />
        <span><b>{service.name}</b><small>{money(service.priceCents)}</small><em>{service.durationMinutes} dəq</em></span>
        <input type="radio" name="selectedService" checked={checked} onChange={() => setSelectedServiceId(service.id)} />
        <i aria-hidden="true" />
      </label>;
    })}</div>
    <p className="shot-note"><Info size={17} /> Qiymətlər ustaya görə dəyişə bilər.</p>
  </>;
}

function DateTimeStep({ selectedService, selectedProvider, date, setDate, calendarMonth, setCalendarMonth, slots, slot, setSlot, loading, onEdit }: { selectedService?: Service; selectedProvider?: Provider; date: string; setDate: (value: string) => void; calendarMonth: Date; setCalendarMonth: (value: Date) => void; slots: string[]; slot: string; setSlot: (value: string) => void; loading: boolean; onEdit: () => void }) {
  return <>
    <section className="shot-date-master">
      <Image src={selectedProvider?.imageUrl || fallbackAvatar} alt="" width={56} height={56} />
      <span><b>{selectedProvider?.name ?? "Usta seçilməyib"}</b><small>{selectedService?.name ?? "Xidmət"} • {selectedService ? money(selectedService.priceCents) : "Seçilməyib"}</small></span>
      <button type="button" onClick={onEdit}><Edit size={15} /> Edit</button>
    </section>
    <h3 className="shot-section-title">Tarix seçin</h3>
    <CalendarCard value={date} month={calendarMonth} setMonth={setCalendarMonth} onSelect={setDate} />
    <h3 className="shot-section-title">Saat seçin</h3>
    <div className="shot-times" aria-live="polite">
      {loading && <p className="shot-empty">Boş saatlar yoxlanılır…</p>}
      {!loading && slots.map((value) => <button type="button" key={value} aria-pressed={slot === value} onClick={() => setSlot(value)}>{timeOnly(value)}</button>)}
      {!loading && date && slots.length === 0 && <p className="shot-empty">Bu tarix üçün boş saat yoxdur.</p>}
      {!loading && !date && <p className="shot-empty">Tarix seçdikdən sonra boş saatlar görünəcək.</p>}
    </div>
    <div className="shot-legend"><span><i className="green" /> Mövcuddur</span><span><i className="gold" /> Seçilmiş</span><span><i /> Doludur</span></div>
    <p className="shot-note"><Clock3 size={17} /> Seçilmiş saat 10 dəqiqəlik müddət üçün sizin üçün bloklanacaq.</p>
    <input className="shot-hidden-date" aria-label="Tarix" value={date} onChange={(event) => setDate(event.target.value)} />
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
  return <section className="shot-calendar">
    <div className="shot-calendar-head">
      <button type="button" aria-label="Əvvəlki ay" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={20} /></button>
      <b>{monthTitle(month)}</b>
      <button type="button" aria-label="Növbəti ay" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={20} /></button>
    </div>
    <div className="shot-weekdays">{weekdayShort.map((day) => <span key={day}>{day}</span>)}</div>
    <div className="shot-days">{days.map((day) => {
      const key = dateKey(day);
      const disabled = key < today;
      const other = day.getMonth() !== month.getMonth();
      return <button type="button" key={key} disabled={disabled} className={`${value === key ? "selected" : ""} ${key === today ? "today" : ""} ${other ? "muted" : ""}`} onClick={() => onSelect(key)}>{day.getDate()}</button>;
    })}</div>
    <p><CalendarDays size={16} /> Seçilmiş tarix: {niceDate(value)}</p>
  </section>;
}

function ConfirmStep({ salon, selectedService, selectedProvider, date, slot, contact, setContact, needsAuth }: { salon: SalonSummary; selectedService?: Service; selectedProvider?: Provider; date: string; slot: string; contact: { customerName: string; customerEmail: string; customerPhone: string }; setContact: (value: { customerName: string; customerEmail: string; customerPhone: string }) => void; needsAuth?: boolean }) {
  return <>
    {needsAuth && <p className="shot-note" role="status"><ShieldCheck size={17} /> Rezervasiyanı təsdiqləmək üçün hesabınıza daxil olmalısınız. Bütün seçimləriniz saxlanılıb — daxil olduqdan sonra buraya geri qayıdacaqsınız.</p>}
    <section className="shot-confirm-card">
      <h2>Rezervasiya məlumatları</h2>
      <ConfirmRow label="Salon" value={salon.name} />
      <ConfirmRow label="Usta" value={selectedProvider?.name ?? "Seçilməyib"} />
      <ConfirmRow label="Xidmət" value={selectedService?.name ?? "Seçilməyib"} />
      <ConfirmRow label="Qiymət" value={selectedService ? money(selectedService.priceCents) : "Seçilməyib"} />
      <ConfirmRow label="Tarix" value={niceDate(date)} />
      <ConfirmRow label="Saat" value={slot ? timeOnly(slot) : "Seçilməyib"} />
      <ConfirmRow label="Müddət" value={selectedService ? `${selectedService.durationMinutes} dəq` : "Seçilməyib"} />
    </section>
    <section className="shot-contact-card">
      <label>Ad və soyad<input aria-label="Ad və soyad" value={contact.customerName} onChange={(event) => setContact({ ...contact, customerName: event.target.value })} placeholder="Aysel Məmmədova" /></label>
      <label>E-poçt<input aria-label="E-poçt" type="email" value={contact.customerEmail} onChange={(event) => setContact({ ...contact, customerEmail: event.target.value })} placeholder="aysel@example.com" /></label>
      <label>Telefon<input aria-label="Telefon" type="tel" value={contact.customerPhone} onChange={(event) => setContact({ ...contact, customerPhone: event.target.value })} placeholder="+994 50 000 00 00" /></label>
    </section>
    <section className="shot-rules">
      <h2><ShieldCheck size={20} /> Rezervasiya qaydaları</h2>
      <ul><li>Rezervasiya təsdiqi salon admini tərəfindən ediləcək.</li><li>Gözləmədə statusu ilə yaradılır.</li><li>24 saat qalmış ləğv edilərsə qeyd edilə bilər.</li><li>Gecikmə halında rezervasiya ləğv oluna bilər.</li></ul>
    </section>
    <div className="shot-total"><span>Ümumi məbləğ</span><b>{selectedService ? money(selectedService.priceCents) : "Seçilməyib"}</b></div>
    <p className="shot-pay-note"><Clock3 size={16} /> Ödəniş salon daxilində nağd və ya kartla həyata keçiriləcək.</p>
    <p className="shot-agree">Rezervasiya yaratmaqla qaydaları qəbul etmiş olursunuz.</p>
  </>;
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><b>{value}</b></div>;
}

function BottomStepper({ step }: { step: Step }) {
  const items = ["Xidmət", "Tarix və saat", "Təsdiq"];
  return <ol className="shot-bottom-stepper">{items.map((item, index) => {
    const current = index + 1;
    return <li className={current <= step ? "active" : ""} key={item}><span>{current < step ? <Check size={13} /> : current}</span><em>{item}</em></li>;
  })}</ol>;
}
