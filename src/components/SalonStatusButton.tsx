"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function SalonStatusButton({ salonId, status }: { salonId: string; status: "ACTIVE" | "SUSPENDED" }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const next = status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  async function changeStatus() {
    if (!window.confirm(`${next === "SUSPENDED" ? "Salon dayandırılsın?" : "Salon aktivləşdirilsin?"}`)) return;
    setIsPending(true);
    const response = await fetch(`/api/platform/salons/${salonId}/status`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: next }) });
    setIsPending(false);
    if (response.ok) router.refresh();
  }
  return <button className="button secondary" type="button" disabled={isPending} onClick={changeStatus}>{isPending ? "Yenilənir…" : next === "SUSPENDED" ? "Dayandır" : "Aktiv et"}</button>;
}
