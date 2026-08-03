"use client";

import { CheckCircle2, CircleAlert, LoaderCircle, MoreHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type AppointmentStatus = "CONFIRMED" | "COMPLETED" | "NO_SHOW" | "CANCELLED" | "REJECTED";

const labels: Record<AppointmentStatus, string> = {
  CONFIRMED: "Təsdiqlə",
  COMPLETED: "Tamamlandı et",
  NO_SHOW: "Gəlmədi kimi qeyd et",
  CANCELLED: "Ləğv et",
  REJECTED: "Rədd et",
};

const descriptions: Partial<Record<AppointmentStatus, string>> = {
  CONFIRMED: "Rezervasiya təsdiqlənmiş kimi görünəcək.",
  COMPLETED: "Bu əməliyyat rezervasiyanı tamamlanmış kimi qeyd edir.",
  NO_SHOW: "Müştəri gəlmədi kimi qeyd olunacaq.",
  CANCELLED: "Rezervasiya ləğv ediləcək. Bu əməliyyat geri qaytarılmaya bilər.",
  REJECTED: "Rezervasiya rədd edilmiş kimi görünəcək.",
};

function actionsFor(status: string): AppointmentStatus[] {
  if (status === "PENDING" || status === "NEEDS_REASSIGNMENT") return ["CONFIRMED", "REJECTED", "CANCELLED"];
  if (status === "CONFIRMED") return ["COMPLETED", "NO_SHOW", "CANCELLED"];
  return [];
}

function errorMessage(code?: string) {
  if (code === "DOUBLE_BOOKING_CONFLICT") return "Bu əməliyyat rezervasiya toqquşmasına görə tamamlanmadı.";
  if (code === "FORBIDDEN") return "Bu əməliyyatı yerinə yetirmək səlahiyyətiniz yoxdur.";
  return "Əməliyyat tamamlanmadı. Səhifəni yeniləyib yenidən cəhd edin.";
}

export function AppointmentActions({ appointmentId, currentStatus }: { appointmentId: string; currentStatus: string }) {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const interactionStarted = useRef(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [chosenAction, setChosenAction] = useState<AppointmentStatus | null>(null);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const actions = actionsFor(currentStatus);

  useEffect(() => {
    if (interactionStarted.current && !sheetOpen && !chosenAction) triggerRef.current?.focus();
  }, [sheetOpen, chosenAction]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) {
        setChosenAction(null);
        setSheetOpen(false);
      }
    };
    if (sheetOpen || chosenAction) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sheetOpen, chosenAction, pending]);

  async function update() {
    if (!chosenAction) return;
    setPending(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/salon/appointments/${appointmentId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: chosenAction }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setFeedback({ kind: "error", text: errorMessage(body.code) });
        return;
      }
      setFeedback({ kind: "success", text: `Rezervasiya: ${labels[chosenAction]}.` });
      setChosenAction(null);
      setSheetOpen(false);
      router.refresh();
    } catch {
      setFeedback({ kind: "error", text: "Şəbəkə xətası baş verdi. Yenidən cəhd edin." });
    } finally {
      setPending(false);
    }
  }

  if (!actions.length) return <span className="appointment-action-finished">Əməliyyat tamamlanıb</span>;

  return <div className="appointment-actions">
    {feedback && <p className={`action-feedback ${feedback.kind}`} role={feedback.kind === "error" ? "alert" : "status"}>
      {feedback.kind === "success" ? <CheckCircle2 size={15} aria-hidden="true" /> : <CircleAlert size={15} aria-hidden="true" />}
      {feedback.text}
    </p>}
    <button ref={triggerRef} type="button" className="appointment-action-trigger" onClick={() => { interactionStarted.current = true; setSheetOpen(true); }} aria-haspopup="dialog" aria-expanded={sheetOpen}>
      <MoreHorizontal size={19} aria-hidden="true" /><span>Əməliyyatlar</span>
    </button>

    {sheetOpen && <div className="action-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setSheetOpen(false); }}>
      <section className="appointment-action-sheet" role="dialog" aria-modal="true" aria-labelledby={`appointment-actions-${appointmentId}`}>
        <div className="sheet-handle" aria-hidden="true" />
        <div className="appointment-sheet-heading"><div><p className="eyebrow">Rezervasiya</p><h2 id={`appointment-actions-${appointmentId}`}>Əməliyyat seçin</h2></div><button type="button" className="icon-button" onClick={() => setSheetOpen(false)} disabled={pending} aria-label="Əməliyyat pəncərəsini bağla"><X size={19} /></button></div>
        <div className="appointment-action-list">
          {actions.map((action) => <button type="button" key={action} className={`appointment-action-option ${action === "CANCELLED" || action === "REJECTED" ? "danger" : ""}`} onClick={() => { setSheetOpen(false); setChosenAction(action); }}>
            <span>{labels[action]}</span><small>{descriptions[action]}</small>
          </button>)}
        </div>
      </section>
    </div>}

    {chosenAction && <div className="action-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setChosenAction(null); }}>
      <section className="appointment-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby={`confirm-action-${appointmentId}`} aria-describedby={`confirm-description-${appointmentId}`}>
        <CircleAlert className={chosenAction === "CANCELLED" || chosenAction === "REJECTED" ? "confirm-danger-icon" : "confirm-icon"} size={23} aria-hidden="true" />
        <h2 id={`confirm-action-${appointmentId}`}>{labels[chosenAction]}?</h2>
        <p id={`confirm-description-${appointmentId}`}>{descriptions[chosenAction]}</p>
        <div className="confirm-actions"><button type="button" className="button secondary" onClick={() => setChosenAction(null)} disabled={pending}>Geri</button><button type="button" className={`button ${chosenAction === "CANCELLED" || chosenAction === "REJECTED" ? "danger-button" : ""}`} onClick={update} disabled={pending}>{pending ? <><LoaderCircle className="spin" size={17} /> Saxlanılır…</> : "Təsdiqlə"}</button></div>
      </section>
    </div>}
  </div>;
}
