const monthShort = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avq", "sen", "okt", "noy", "dek"];
const monthLong = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
const weekdays = ["Bazar", "Bazar ertəsi", "Çərşənbə axşamı", "Çərşənbə", "Cümə axşamı", "Cümə", "Şənbə"];
const pad = (value: number) => String(value).padStart(2, "0");
const asDate = (value: Date | string) => value instanceof Date ? value : new Date(value);

export const money = (cents: number) => `${(cents / 100).toFixed(2).replace(".", ",")} ₼`;
export const timeOnly = (value: Date | string) => {
  const date = asDate(value);
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
};
export const dateLabelFromKey = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return `${weekdays[date.getUTCDay()]}, ${day} ${monthLong[month - 1]}`;
};
export const dateTime = (value: Date | string) => {
  const date = asDate(value);
  return `${date.getUTCDate()} ${monthShort[date.getUTCMonth()]} ${date.getUTCFullYear()}, ${timeOnly(date)}`;
};

// Single source of truth for AppointmentStatus labels (Azerbaijani), shared by every page/
// component that renders a reservation status badge. AUTO_REJECTED is intentionally kept
// distinct from REJECTED: same "rejection" family, but the customer/admin UI must be able
// to tell a salon admin's manual decision apart from the system auto-rejecting an overdue
// pending reservation.
export const appointmentStatusLabel: Record<string, string> = {
  PENDING: "Gözləmədə",
  CONFIRMED: "Təsdiqləndi",
  REJECTED: "Rədd edildi",
  AUTO_REJECTED: "Avtomatik rədd edildi",
  CANCELLED: "Ləğv edilib",
  COMPLETED: "Tamamlanıb",
  NO_SHOW: "Gəlmədi",
  NEEDS_REASSIGNMENT: "Yenidən təyinat",
};

export const appointmentStatusDescription: Record<string, string> = {
  PENDING: "Rezervasiya gözləmədədir",
  CONFIRMED: "Rezervasiya təsdiqləndi",
  REJECTED: "Rezervasiya salon tərəfindən rədd edildi",
  AUTO_REJECTED: "Vaxtında cavab verilmədiyi üçün rezervasiya sistem tərəfindən avtomatik rədd edildi",
  CANCELLED: "Rezervasiya ləğv edilib",
  COMPLETED: "Rezervasiya tamamlanıb",
  NO_SHOW: "Müştəri gəlmədi",
  NEEDS_REASSIGNMENT: "Yenidən təyinat gözləyir",
};

export const statusBadgeClass = (status: string) => `status-${status.toLowerCase()}`;
