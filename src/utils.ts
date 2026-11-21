export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const now = () => new Date().toISOString();
export const uid = (p: string) => `${p}-${crypto.randomUUID().slice(0, 8)}`;
export const money = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(n)) + " đ";
export const compactMoney = (n: number) =>
  Math.abs(n) >= 1e6
    ? new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(
        n / 1e6,
      ) + " tr"
    : money(n);
export const dateLabel = (d: string) =>
  d ? d.slice(0, 10).split("-").reverse().join("/") : "—";
export const dateTime = (d: string) =>
  new Date(d).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
export function addDays(date: string, n: number) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function monthOffset(n: number) {
  const d = new Date(today() + "T12:00:00Z");
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 7);
}
export function sessionDates(start: string, days: number[], count: number) {
  const out: string[] = [];
  for (let i = 0; i < 900 && out.length < count; i++) {
    const date = addDays(start, i);
    if (days.includes(new Date(date + "T12:00:00Z").getUTCDay()))
      out.push(date);
  }
  return out;
}
export const schedule = (c: { days: number[]; time: string }) =>
  c.days.map((n) => (n === 0 ? "CN" : `Thứ ${n + 1}`)).join(", ") +
  " · " +
  c.time;
export const initials = (name: string) =>
  name
    .split(" ")
    .slice(-2)
    .map((s) => s[0])
    .join("");
export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();
export function ensure(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
