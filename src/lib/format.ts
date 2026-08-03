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
