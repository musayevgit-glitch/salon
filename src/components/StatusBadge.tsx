import { Bot } from "lucide-react";
import { appointmentStatusLabel, statusBadgeClass } from "@/lib/format";

/**
 * Shared status pill for AppointmentStatus values. Centralized so every list/detail view
 * (customer confirmation page, salon admin appointments, manager agenda, superadmin tenant
 * detail) renders the same 4 distinct labels with the same visual treatment — in particular
 * AUTO_REJECTED gets a bot icon + tooltip so it reads clearly as "rejected" while staying
 * visually distinguishable from a manual REJECTED decision.
 */
export function StatusBadge({ status }: { status: string }) {
  const label = appointmentStatusLabel[status] ?? status;
  const isAutoRejected = status === "AUTO_REJECTED";
  return (
    <span
      className={`status ${statusBadgeClass(status)}`}
      title={isAutoRejected ? "Sistem tərəfindən avtomatik rədd edilib: salon vaxtında cavab vermədi." : undefined}
    >
      {isAutoRejected && <Bot size={13} aria-hidden="true" />}
      {label}
    </span>
  );
}
