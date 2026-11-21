import type { Operations, Warehouse, Risk } from "./types.ts";
import { invoiceBalance, operationalFacts, profitSummary } from "./finance.ts";
import { today, now, addDays } from "./utils.ts";
// This module accepts a warehouse snapshot for every analytical operation.
// Student dimensions deliberately exclude names, contacts and parent details.
export function buildWarehouse(o: Operations, loadedAt = now()): Warehouse {
  const financial = operationalFacts(o);
  o.invoices.forEach((i) =>
    financial.push({
      id: i.id,
      date: i.created,
      kind: "Phải thu",
      amount: i.amount,
      courseId: i.courseId,
      studentId: i.studentId,
      teacherId: null,
      balance: invoiceBalance(o, i),
      due: i.due,
    }),
  );
  const learning = o.attendance.map((a) => {
    const l = o.lessons.find((l) => l.id === a.lessonId)!;
    return {
      id: a.id,
      date: l.date,
      studentId: a.studentId,
      courseId: l.courseId,
      teacherId: l.teacherId,
      status: a.status,
      score: a.score,
    };
  });
  const allDates = new Set([
    ...financial.map((f) => f.date),
    ...learning.map((f) => f.date),
    ...o.lessons.map((l) => l.date),
  ]);
  return {
    loadedAt,
    asOfDate: today(),
    sourceRevision: o.revision,
    financial,
    learning,
    dimTime: [...allDates]
      .sort()
      .map((d) => ({
        id: d,
        month: d.slice(0, 7),
        year: Number(d.slice(0, 4)),
      })),
    dimStudents: o.students.map((s) => ({
      id: s.id,
      grade: s.grade,
      status: s.status,
    })),
    dimTeachers: o.teachers.map((t) => ({
      id: t.id,
      name: t.name,
      subjectIds: [...t.subjectIds],
      rate: t.rate,
    })),
    dimCourses: o.courses.map((c) => ({
      ...structuredClone(c),
      lessonDates: o.lessons
        .filter((l) => l.courseId === c.id)
        .map((l) => l.date),
    })),
    dimSubjects: structuredClone(o.subjects),
    enrollments: structuredClone(o.enrollments),
    settings: { ...o.settings },
  };
}
export function academicStats(w: Warehouse, studentId: string) {
  const activeIds = new Set(
    w.enrollments
      .filter((e) => e.studentId === studentId && e.status === "Đang học")
      .map((e) => e.courseId),
  );
  const records = w.learning
    .filter(
      (l) =>
        l.studentId === studentId &&
        activeIds.has(l.courseId) &&
        l.date <= w.asOfDate,
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const present = records.filter((l) => l.status !== "Vắng").length;
  let consecutive = 0;
  for (let i = records.length - 1; i >= 0 && records[i].status === "Vắng"; i--)
    consecutive++;
  const scores = records.filter((l) => l.score !== null).map((l) => l.score!);
  const before = scores.slice(0, -1);
  const average = before.length
    ? before.reduce((a, b) => a + b, 0) / before.length
    : null;
  return {
    present,
    total: records.length,
    attendance: records.length
      ? Math.round((present / records.length) * 100)
      : null,
    consecutive,
    scores,
    declining: average !== null && scores.at(-1)! < average,
  };
}
export function risks(w: Warehouse): Risk[] {
  return w.dimStudents
    .filter((st) =>
      ["Đang học", "Sắp hết khóa", "Học tiếp"].includes(st.status),
    )
    .map<Risk>((st) => {
      const a = academicStats(w, st.id);
      const receivables = w.financial.filter(
        (f) => f.kind === "Phải thu" && f.studentId === st.id,
      );
      const debt = receivables.reduce((sum, f) => sum + (f.balance || 0), 0);
      const overdue = receivables
        .filter((f) => f.due! < w.asOfDate)
        .reduce((sum, f) => sum + (f.balance || 0), 0);
      const ending = w.enrollments
        .filter((e) => e.studentId === st.id && e.status === "Đang học")
        .map((e) => w.dimCourses.find((c) => c.id === e.courseId)!)
        .find((c) => c.end >= w.asOfDate && c.end <= addDays(w.asOfDate, 14));
      const hasNext =
        !!ending &&
        w.enrollments.some((e) => {
          const c = w.dimCourses.find((c) => c.id === e.courseId)!;
          return (
            e.studentId === st.id &&
            c.subjectId === ending.subjectId &&
            c.start > ending.end
          );
        });
      const reasons: { label: string; points: number }[] = [];
      if (a.attendance !== null && a.attendance < 80)
        reasons.push({
          label: `Chuyên cần ${a.attendance}% dưới 80%`,
          points: 30,
        });
      if (a.consecutive >= 2)
        reasons.push({
          label: `Vắng ${a.consecutive} buổi liên tiếp`,
          points: 25,
        });
      if (a.declining)
        reasons.push({
          label: "Điểm gần nhất thấp hơn trung bình các bài trước",
          points: 20,
        });
      if (overdue > 0)
        reasons.push({ label: "Còn nợ học phí quá hạn", points: 20 });
      if (ending && !hasNext)
        reasons.push({
          label: "Sắp hết khóa, chưa đăng ký khóa sau",
          points: 5,
        });
      const score = Math.min(
        100,
        reasons.reduce((a, r) => a + r.points, 0),
      );
      return {
        studentId: st.id,
        score,
        level: score >= 50 ? "Cao" : score >= 25 ? "Trung bình" : "Thấp",
        reasons,
        ...a,
        overdue,
        debt,
        endingCourseId: ending?.id || null,
        hasNext,
      };
    })
    .sort((a, b) => b.score - a.score);
}
export function warehouseProfit(w: Warehouse, month: string) {
  const sessions = w.dimCourses.flatMap((c) =>
    c.lessonDates.map((date) => ({ courseId: c.id, date })),
  );
  return profitSummary(
    w.financial,
    w.dimCourses,
    sessions,
    month,
    w.settings.reserveRate,
  );
}
export function suggestedClasses(w: Warehouse) {
  const rows: { title: string; detail: string; count: number; type: string }[] =
    [];
  for (const c of w.dimCourses.filter((c) => c.status === "Dự kiến")) {
    const waiting = w.enrollments.filter(
      (e) => e.courseId === c.id && e.status === "Chờ lớp",
    ).length;
    const teacher = w.dimTeachers.find((t) => t.id === c.teacherId)!;
    const min = Math.ceil(teacher.rate / c.price);
    rows.push({
      title: c.name,
      detail: `${waiting} học viên trong danh sách chờ; tối thiểu ${min} để bù lương mỗi buổi. ${waiting >= min ? "Đã đủ điều kiện mở lớp." : `Cần thêm ${min - waiting} học viên.`}`,
      count: waiting,
      type: waiting >= min ? "Đủ tối thiểu" : "Chờ tuyển sinh",
    });
  }
  const good = risks(w).filter(
    (r) =>
      r.endingCourseId &&
      r.attendance !== null &&
      r.attendance >= 80 &&
      (r.scores.at(-1) || 0) >= 7,
  );
  if (good.length)
    rows.push({
      title: "Lộ trình học tiếp cho học viên tiến bộ",
      detail: `${good.length} học viên sắp hết khóa, chuyên cần từ 80% và điểm gần nhất từ 7. Có thể khảo sát nhu cầu lớp nâng cao.`,
      count: good.length,
      type: "Cơ hội học tiếp",
    });
  return rows;
}
