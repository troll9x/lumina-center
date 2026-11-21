import type {
  Operations,
  Invoice,
  Payroll,
  Course,
  FactFinance,
} from "./types.ts";
import { today } from "./utils.ts";
export const invoiceBalance = (o: Operations, i: Invoice) =>
  i.amount -
  o.receipts
    .filter((r) => r.invoiceId === i.id)
    .reduce((sum, r) => sum + r.amount, 0);
export function invoiceStatus(o: Operations, i: Invoice) {
  const remaining = invoiceBalance(o, i);
  return remaining === 0
    ? "Đã thu"
    : i.due < today()
      ? "Quá hạn"
      : remaining < i.amount
        ? "Thu một phần"
        : "Chưa thu";
}
export function payrollTotal(o: Operations, p: Payroll) {
  return (
    p.checkinIds.reduce(
      (a, id) => a + (o.checkins.find((c) => c.id === id)?.rate || 0),
      0,
    ) + p.adjustment
  );
}
export function payrollAllocations(o: Operations, p: Payroll) {
  const groups = new Map<string, number>();
  for (const id of p.checkinIds) {
    const c = o.checkins.find((c) => c.id === id)!;
    const l = o.lessons.find((l) => l.id === c.lessonId)!;
    groups.set(l.courseId, (groups.get(l.courseId) || 0) + c.rate);
  }
  const base = [...groups.values()].reduce((a, b) => a + b, 0);
  const total = payrollTotal(o, p);
  const entries = [...groups.entries()];
  let assigned = 0;
  return entries.map(([courseId, n], index) => {
    const amount =
      index === entries.length - 1
        ? total - assigned
        : Math.round(base ? (total * n) / base : 0);
    assigned += amount;
    return { courseId, amount };
  });
}
export function operationalFacts(o: Operations): FactFinance[] {
  const rows: FactFinance[] = [];
  for (const r of o.receipts) {
    const i = o.invoices.find((i) => i.id === r.invoiceId)!;
    rows.push({
      id: r.id,
      date: r.date,
      kind: "Thu học phí",
      amount: r.amount,
      courseId: i.courseId,
      studentId: i.studentId,
      teacherId: null,
    });
  }
  for (const e of o.expenses) {
    const p = o.payrolls.find((p) => p.id === e.payrollId);
    if (e.allocations?.length)
      e.allocations.forEach((a, j) =>
        rows.push({
          id: `${e.id}-${j}`,
          date: e.date,
          kind: "Lương",
          amount: a.amount,
          courseId: a.courseId,
          studentId: null,
          teacherId: p?.teacherId || null,
          category: e.category,
        }),
      );
    else
      rows.push({
        id: e.id,
        date: e.date,
        kind: e.payrollId ? "Lương" : "Chi phí",
        amount: e.amount,
        courseId: null,
        studentId: null,
        teacherId: p?.teacherId || null,
        category: e.category,
      });
  }
  return rows;
}
export function profitSummary(
  facts: FactFinance[],
  courses: Course[],
  lessonRows: { courseId: string; date: string }[],
  month: string,
  reserveRate: number,
) {
  const financial = facts.filter(
    (f) => f.date.startsWith(month) && f.kind !== "Phải thu",
  );
  const income = financial
    .filter((f) => f.kind === "Thu học phí")
    .reduce((a, f) => a + f.amount, 0);
  const expenses = financial
    .filter((f) => f.kind !== "Thu học phí")
    .reduce((a, f) => a + f.amount, 0);
  const general = financial
    .filter((f) => f.courseId === null && f.kind !== "Thu học phí")
    .reduce((a, f) => a + f.amount, 0);
  const counts = new Map<string, number>();
  lessonRows
    .filter((l) => l.date.startsWith(month))
    .forEach((l) => counts.set(l.courseId, (counts.get(l.courseId) || 0) + 1));
  const totalLessons = [...counts.values()].reduce((a, b) => a + b, 0);
  const weighted = courses.filter((c) => (counts.get(c.id) || 0) > 0);
  let allocated = 0;
  const allocations = new Map<string, number>();
  weighted.forEach((c, i) => {
    const value =
      i === weighted.length - 1
        ? general - allocated
        : Math.round((general * (counts.get(c.id) || 0)) / totalLessons);
    allocations.set(c.id, value);
    allocated += value;
  });
  const rows = courses
    .map((c) => {
      const revenue = financial
        .filter((f) => f.courseId === c.id && f.kind === "Thu học phí")
        .reduce((a, f) => a + f.amount, 0);
      const salary = financial
        .filter((f) => f.courseId === c.id && f.kind === "Lương")
        .reduce((a, f) => a + f.amount, 0);
      const shared = allocations.get(c.id) || 0;
      return {
        courseId: c.id,
        name: c.name,
        revenue,
        salary,
        shared,
        profit: revenue - salary - shared,
        sessions: counts.get(c.id) || 0,
      };
    })
    .filter((r) => r.revenue || r.salary || r.shared || r.sessions);
  const net = income - expenses;
  const reserve = Math.max(0, Math.round((net * reserveRate) / 100));
  const distributable = Math.max(0, net - reserve);
  return {
    income,
    expenses,
    net,
    reserve,
    distributable,
    each: Math.floor(distributable / 3),
    remainder: distributable % 3,
    general,
    unallocated: general - allocated,
    rows,
  };
}
