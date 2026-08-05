"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, Clock3, Eye, EyeOff, ImagePlus, Pencil, Plus, Trash2, UsersRound, WandSparkles, X } from "lucide-react";
import { money } from "@/lib/format";
import { MAX_PORTFOLIO_IMAGES } from "@/lib/portfolio";

type Service = { id: string; name: string; description: string | null; priceCents: number; durationMinutes: number; bufferMinutes: number; active: boolean; sortOrder: number };
type Provider = { id: string; name: string; bio: string | null; imageUrl: string | null; active: boolean; images?: { id: string; url: string; position: number }[] };
type Hour = { id: string; weekday: number; opensAt: string; closesAt: string; closed: boolean };
type Tab = "overview" | "services" | "team" | "hours";

const days = ["Bazar", "Bazar ertəsi", "Çərşənbə axşamı", "Çərşənbə", "Cümə axşamı", "Cümə", "Şənbə"];
const tabData: { key: Exclude<Tab, "overview">; href: string; label: string }[] = [
  { key: "services", href: "/salonadmin/services", label: "Xidmətlər" },
  { key: "team", href: "/salonadmin/team", label: "Komanda" },
  { key: "hours", href: "/salonadmin/hours", label: "İş saatları" },
];

export function CatalogManager({ services, providers, hours, tab = "overview" }: { services: Service[]; providers: Provider[]; hours: Hour[]; tab?: Tab }) {
  const router = useRouter();
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editing, setEditing] = useState<{ kind: "services"; row: Service } | { kind: "providers"; row: Provider } | null>(null);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body: Record<string, unknown> = Object.fromEntries(new FormData(form));
    if (typeof body.images === "string") { try { body.images = JSON.parse(body.images); } catch { delete body.images; } }
    const result = await fetch("/api/salon/catalog", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!result.ok) {
      const errorBody = await result.json().catch(() => ({}));
      setNotice({ type: "error", text: errorBody.code === "TOO_MANY_PORTFOLIO_IMAGES" ? `Maksimum ${MAX_PORTFOLIO_IMAGES} əl işi şəkilinə icazə verilir.` : "Yadda saxlamaq alınmadı. Məlumatları yoxlayın." });
      return;
    }
    form.reset(); setNotice({ type: "success", text: "Dəyişiklik yadda saxlanıldı." }); router.refresh();
  }
  async function patch(kind: "services" | "providers", id: string, data: Record<string, unknown>) {
    setNotice(null);
    const result = await fetch(`/api/salon/catalog/${kind}/${id}`, { method: "PATCH", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    if (!result.ok) {
      const errorBody = await result.json().catch(() => ({}));
      setNotice({ type: "error", text: errorBody.code === "TOO_MANY_PORTFOLIO_IMAGES" ? `Maksimum ${MAX_PORTFOLIO_IMAGES} əl işi şəkilinə icazə verilir.` : "Dəyişiklik yadda saxlanılmadı. Yenidən cəhd edin." });
      return false;
    }
    setNotice({ type: "success", text: "Dəyişiklik yadda saxlanıldı." }); router.refresh(); return true;
  }
  const activeServices = useMemo(() => services.filter((service) => service.active).length, [services]);
  const activeProviders = useMemo(() => providers.filter((provider) => provider.active).length, [providers]);

  if (tab === "overview") return <section className="catalog-hub" aria-labelledby="catalog-title">
    <div className="catalog-hub-heading"><div><p className="eyebrow">KATALOQ VƏ CƏDVƏL</p><h2 id="catalog-title">Salonunuzu idarə edin</h2><p className="muted">Xidmətləri, komandanı və qəbul saatlarını ayrı iş sahələrində yeniləyin.</p></div></div>
    <div className="catalog-hub-grid">
      <Link className="catalog-hub-card" href="/salonadmin/services"><span className="catalog-icon"><WandSparkles size={20} /></span><div><b>{activeServices} aktiv xidmət</b><p>Xidmətləri redaktə edin, gizlədin və sıralayın.</p></div><span aria-hidden="true">→</span></Link>
      <Link className="catalog-hub-card" href="/salonadmin/team"><span className="catalog-icon"><UsersRound size={20} /></span><div><b>{activeProviders} aktiv usta</b><p>Profil və işlək statuslarını idarə edin.</p></div><span aria-hidden="true">→</span></Link>
      <Link className="catalog-hub-card" href="/salonadmin/hours"><span className="catalog-icon"><Clock3 size={20} /></span><div><b>{hours.length}/7 gün təyin edilib</b><p>Həftəlik qəbul saatlarını yeniləyin.</p></div><span aria-hidden="true">→</span></Link>
    </div>
  </section>;

  return <section className="catalog-page" aria-labelledby="catalog-title">
    <div className="catalog-page-top"><div><p className="eyebrow">SALON KATALOQU</p><h1 id="catalog-title">{tab === "services" ? "Xidmətlər" : tab === "team" ? "Komanda" : "İş saatları"}</h1><p className="muted">{tab === "services" ? "Müştərilərə görünən xidmətləri və ardıcıllığını idarə edin." : tab === "team" ? "Usta profillərini və aktivlik statusunu idarə edin." : "Qəbul saatlarını gün-gün təyin edin."}</p></div></div>
    <nav className="catalog-tabs" aria-label="Salon kataloqu"><Link href="/salonadmin">Ümumi baxış</Link>{tabData.map((item) => <Link className={item.key === tab ? "active" : ""} key={item.key} href={item.href}>{item.label}</Link>)}</nav>
    {notice && <p className={`catalog-feedback ${notice.type}`} role="status">{notice.type === "success" ? <Check size={17} /> : <X size={17} />}{notice.text}</p>}
    {tab === "services" && <Services services={services} create={create} patch={patch} onEdit={(row) => setEditing({ kind: "services", row })} />}
    {tab === "team" && <Team providers={providers} create={create} patch={patch} onEdit={(row) => setEditing({ kind: "providers", row })} />}
    {tab === "hours" && <Hours hours={hours} create={create} />}
    {editing && <EditDialog item={editing} onClose={() => setEditing(null)} onSave={async (data) => { if (await patch(editing.kind, editing.row.id, data)) setEditing(null); }} />}
  </section>;
}

function Services({ services, create, patch, onEdit }: { services: Service[]; create: (event: FormEvent<HTMLFormElement>) => Promise<void>; patch: (kind: "services", id: string, data: Record<string, unknown>) => Promise<boolean>; onEdit: (row: Service) => void }) {
  const ordered = [...services].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  return <><details className="catalog-create"><summary><Plus size={18} /> Yeni xidmət əlavə et</summary><form onSubmit={create} className="catalog-form"><input type="hidden" name="kind" value="service" /><label>Xidmət adı<input name="name" required maxLength={80} placeholder="Məs. Saç kəsimi" /></label><label>Qiymət (qəpik)<input name="priceCents" required type="number" min="0" placeholder="3500" /></label><label>Müddət (dəqiqə)<input name="durationMinutes" required type="number" min="15" max="480" defaultValue="60" /></label><label>Buffer (dəqiqə)<input name="bufferMinutes" required type="number" min="0" max="120" defaultValue="0" /></label><button className="button" type="submit">Xidməti əlavə et</button></form></details>
    <div className="catalog-list">{ordered.length === 0 ? <Empty text="Hələ xidmət əlavə edilməyib." /> : ordered.map((service, index) => <article className="catalog-item" key={service.id}><div className="catalog-item-main"><span className="drag-order" aria-label={`Sıra ${index + 1}`}>{index + 1}</span><div><div className="catalog-title-line"><h2>{service.name}</h2><Status active={service.active} /></div><p>{money(service.priceCents)} <span>·</span> {service.durationMinutes} dəq {service.bufferMinutes ? <><span>·</span> +{service.bufferMinutes} dəq buffer</> : null}</p></div></div><div className="catalog-item-actions"><button className="icon-button" type="button" disabled={index === 0} onClick={() => patch("services", service.id, { sortOrder: Math.max(0, service.sortOrder - 1) })} aria-label={`${service.name} yuxarı`}><ArrowUp size={18} /></button><button className="icon-button" type="button" disabled={index === ordered.length - 1} onClick={() => patch("services", service.id, { sortOrder: service.sortOrder + 1 })} aria-label={`${service.name} aşağı`}><ArrowDown size={18} /></button><button className="icon-button" type="button" onClick={() => onEdit(service)} aria-label={`${service.name} redaktə et`}><Pencil size={17} /></button><button className="compact-action" type="button" onClick={() => patch("services", service.id, { active: !service.active })}>{service.active ? <><EyeOff size={16} /> Gizlət</> : <><Eye size={16} /> Aktiv et</>}</button></div></article>)}</div></>;
}

function Team({ providers, create, patch, onEdit }: { providers: Provider[]; create: (event: FormEvent<HTMLFormElement>) => Promise<void>; patch: (kind: "providers", id: string, data: Record<string, unknown>) => Promise<boolean>; onEdit: (row: Provider) => void }) {
  const [newImages, setNewImages] = useState<string[]>([]);
  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    await create(event);
    setNewImages([]);
  }
  return <><details className="catalog-create"><summary><Plus size={18} /> Yeni usta əlavə et</summary><form onSubmit={submitCreate} className="catalog-form catalog-form-two"><input type="hidden" name="kind" value="provider" /><input type="hidden" name="images" value={JSON.stringify(newImages)} /><label>Ad, soyad<input name="name" required maxLength={80} placeholder="Məs. Aysel Məmmədova" /></label><label>İxtisaslaşma<input name="bio" maxLength={500} placeholder="Məs. Rəngləmə və saç düzümü" /></label><label className="form-span">Əl işi şəkilləri (əl işi qalereyası){<ImageListManager images={newImages} onChange={setNewImages} />}</label><button className="button" type="submit">Ustanı əlavə et</button></form></details>
    <div className="team-grid">{providers.length === 0 ? <Empty text="Hələ komanda üzvü əlavə edilməyib." /> : providers.map((provider) => <article className="team-card" key={provider.id}><div className="provider-avatar" aria-hidden="true">{provider.imageUrl ? <Image src={provider.imageUrl} alt="" width={84} height={84} sizes="42px" /> : provider.name.slice(0, 1)}</div><div className="team-card-title"><div><h2>{provider.name}</h2><Status active={provider.active} /></div><p>{provider.bio || "İxtisaslaşma hələ əlavə edilməyib."}</p><p className="muted small">{(provider.images?.length ?? 0)}/{MAX_PORTFOLIO_IMAGES} əl işi şəkli</p></div><div className="team-card-actions"><button className="button secondary" type="button" onClick={() => onEdit(provider)}><Pencil size={16} /> Redaktə et</button><button className="compact-action" type="button" onClick={() => patch("providers", provider.id, { active: !provider.active })}>{provider.active ? <><EyeOff size={16} /> Deaktiv et</> : <><Eye size={16} /> Aktiv et</>}</button></div></article>)}</div></>;
}

function ImageListManager({ images, onChange }: { images: string[]; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const atCap = images.length >= MAX_PORTFOLIO_IMAGES;

  function addImage() {
    const url = draft.trim();
    if (!url) return;
    if (atCap) { setWarning(`Maksimum ${MAX_PORTFOLIO_IMAGES} şəkilə icazə verilir. Əlavə etmək üçün əvvəlcə bir şəkli silin.`); return; }
    try { new URL(url); } catch { setWarning("Düzgün şəkil linki (URL) daxil edin."); return; }
    onChange([...images, url]);
    setDraft("");
    setWarning(null);
  }
  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
    setWarning(null);
  }
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return <div className="portfolio-manager">
    <div className="portfolio-count"><span>{images.length}/{MAX_PORTFOLIO_IMAGES} şəkil</span></div>
    {images.length > 0 && <ul className="portfolio-list">{images.map((url, index) => <li className="portfolio-item" key={`${url}-${index}`}>
      <img src={url} alt="" />
      <div className="portfolio-item-actions">
        <button type="button" className="icon-button" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Yuxarı">↑</button>
        <button type="button" className="icon-button" disabled={index === images.length - 1} onClick={() => move(index, 1)} aria-label="Aşağı">↓</button>
        <button type="button" className="icon-button" onClick={() => removeImage(index)} aria-label="Şəkli sil"><Trash2 size={16} /></button>
      </div>
    </li>)}</ul>}
    {warning && <p className="form-error" role="alert">{warning}</p>}
    {!atCap ? <div className="portfolio-add">
      <input type="url" value={draft} placeholder="https://…" onChange={(event) => { setDraft(event.target.value); setWarning(null); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addImage(); } }} />
      <button type="button" className="button secondary compact" onClick={addImage}><ImagePlus size={16} /> Şəkil əlavə et</button>
    </div> : <p className="portfolio-limit-note">Maksimum say ({MAX_PORTFOLIO_IMAGES}) əldə edilib. Yeni şəkil əlavə etmək üçün əvvəlcə birini silin.</p>}
  </div>;
}

function Hours({ hours, create }: { hours: Hour[]; create: (event: FormEvent<HTMLFormElement>) => Promise<void> }) {
  const mapped = new Map(hours.map((hour) => [hour.weekday, hour]));
  return <div className="hours-list">{days.map((day, weekday) => { const hour = mapped.get(weekday); return <form key={day} className="hours-row" onSubmit={create}><input type="hidden" name="kind" value="hours" /><input type="hidden" name="weekday" value={weekday} /><div><h2>{day}</h2><p>{hour && !hour.closed ? "Qəbul üçün açıq" : "Saat təyin edilməyib"}</p></div><label>Açılış<input name="opensAt" type="time" defaultValue={hour?.opensAt ?? "10:00"} required /></label><label>Bağlanış<input name="closesAt" type="time" defaultValue={hour?.closesAt ?? "20:00"} required /></label><button className="button secondary" type="submit">Yadda saxla</button></form>; })}</div>;
}

function EditDialog({ item, onClose, onSave }: { item: { kind: "services"; row: Service } | { kind: "providers"; row: Provider }; onClose: () => void; onSave: (data: Record<string, unknown>) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>(item.kind === "providers" ? [...(item.row.images ?? [])].sort((a, b) => a.position - b.position).map((image) => image.url) : []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const raw = Object.fromEntries(new FormData(event.currentTarget));
    const data = item.kind === "services"
      ? { name: raw.name, priceCents: Number(raw.priceCents), durationMinutes: Number(raw.durationMinutes), bufferMinutes: Number(raw.bufferMinutes) }
      : { name: raw.name, bio: raw.bio || null, images };
    await onSave(data);
    setSaving(false);
  }
  const isService = item.kind === "services";
  return <div className="catalog-modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}><section className="catalog-modal" role="dialog" aria-modal="true" aria-labelledby="edit-catalog-title"><div className="catalog-modal-head"><div><p className="eyebrow">KATALOQU REDAKTƏ ET</p><h2 id="edit-catalog-title">{isService ? "Xidmət məlumatı" : "Usta məlumatı"}</h2></div><button className="icon-button" type="button" aria-label="Bağla" onClick={onClose} disabled={saving}><X size={20} /></button></div><form onSubmit={submit} className="catalog-form">{isService ? <><label>Xidmət adı<input name="name" defaultValue={item.row.name} required /></label><label>Qiymət (qəpik)<input name="priceCents" type="number" min="0" defaultValue={item.row.priceCents} required /></label><label>Müddət (dəqiqə)<input name="durationMinutes" type="number" min="15" defaultValue={item.row.durationMinutes} required /></label><label>Buffer (dəqiqə)<input name="bufferMinutes" type="number" min="0" defaultValue={item.row.bufferMinutes} required /></label></> : <><label>Ad, soyad<input name="name" defaultValue={item.row.name} required /></label><label className="form-span">İxtisaslaşma<textarea name="bio" defaultValue={item.row.bio ?? ""} rows={4} maxLength={500} /></label><label className="form-span">Əl işi qalereyası (maksimum {MAX_PORTFOLIO_IMAGES}){<ImageListManager images={images} onChange={setImages} />}</label></>}<div className="catalog-modal-actions"><button type="button" className="button secondary" onClick={onClose} disabled={saving}>İmtina et</button><button className="button" type="submit" disabled={saving}>{saving ? "Yadda saxlanır…" : "Dəyişiklikləri yadda saxla"}</button></div></form></section></div>;
}

function Status({ active }: { active: boolean }) { return <span className={`catalog-status ${active ? "active" : "inactive"}`}>{active ? "Aktiv" : "Gizlədilib"}</span>; }
function Empty({ text }: { text: string }) { return <div className="catalog-empty"><WandSparkles size={26} /><h2>Hələ məlumat yoxdur</h2><p>{text}</p></div>; }
