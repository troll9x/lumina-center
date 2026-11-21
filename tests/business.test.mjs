import test from "node:test";
import assert from "node:assert/strict";
import { seedState } from "../src/seed.ts";
import { applyAction, minimumStudents } from "../src/domain.ts";
import {
  invoiceBalance,
  invoiceStatus,
  payrollTotal,
  operationalFacts,
  profitSummary,
} from "../src/finance.ts";
import { risks, academicStats, warehouseProfit } from "../src/warehouse.ts";
import { careSteps, saveCarePlan } from "../src/agent.ts";
import { today } from "../src/utils.ts";
const run = (s, a, p = {}, u = "QL-MINH") => applyAction(s, u, a, p);
function openDemo() {
  let s = seedState();
  const r = run(s, "student", {
    name: "Học viên demo",
    parent: "Phụ huynh mẫu",
    zalo: "0901234567",
    birth: "2011-08-08",
    grade: 9,
    school: "THCS Nguyễn Du",
    courseId: "LOP-08",
  });
  s = r.state;
  return {
    state: run(s, "openCourse", { id: "LOP-08" }).state,
    studentId: r.value,
  };
}
test("seed: 40 learners, seven teachers, ten courses, all invoice states and 16/16 An", () => {
  const s = seedState(),
    o = s.ops;
  assert.equal(o.students.length, 40);
  assert.equal(o.teachers.length, 7);
  assert.equal(o.courses.length, 10);
  assert.equal(o.courses.filter((c) => c.status === "Đang mở").length, 7);
  assert.equal(o.courses.filter((c) => c.status === "Dự kiến").length, 2);
  assert.equal(o.courses.filter((c) => c.status === "Đã kết thúc").length, 1);
  assert.deepEqual(
    new Set(o.invoices.map((i) => invoiceStatus(o, i))),
    new Set(["Đã thu", "Quá hạn", "Chưa thu", "Thu một phần"]),
  );
  const a = academicStats(s.warehouse, "HV-001");
  assert.equal(a.present, 16);
  assert.equal(a.total, 16);
  assert.deepEqual(a.scores, [6, 7, 8]);
});
test("planned class rejects early opening; third waiting student opens 16 sessions and three invoices atomically", () => {
  const seed = seedState();
  const c = seed.ops.courses.find((c) => c.id === "LOP-08");
  assert.equal(minimumStudents(seed.ops, c), 3);
  assert.throws(() => run(seed, "openCourse", { id: c.id }), /tối thiểu 3/);
  assert.equal(seed.ops.invoices.filter((i) => i.courseId === c.id).length, 0);
  const { state: s } = openDemo();
  assert.equal(s.ops.lessons.filter((l) => l.courseId === c.id).length, 16);
  assert.equal(s.ops.invoices.filter((i) => i.courseId === c.id).length, 3);
  assert(
    s.ops.enrollments
      .filter((e) => e.courseId === c.id)
      .every((e) => e.status === "Đang học"),
  );
  assert.throws(() => run(s, "openCourse", { id: c.id }), /không còn/);
});
test("teacher sees fee data for their class but cannot collect money or change charges", () => {
  const { state: s, studentId } = openDemo();
  const inv = s.ops.invoices.find((i) => i.studentId === studentId);
  assert.equal(inv.amount, 1920000);
  assert.throws(
    () =>
      run(
        s,
        "payment",
        { invoiceId: inv.id, amount: 1, method: "Tiền mặt" },
        "ND-GV-1",
      ),
    /Chỉ quản lý/,
  );
  const r = run(s, "reminder", { invoiceId: inv.id }, "ND-GV-1");
  assert.equal(r.state.ops.messages.length, 0);
  assert.equal(r.state.ops.drafts.at(-1).status, "Chờ duyệt");
});
test("check-in creates one wage entry; absence notification is idempotent", () => {
  const { state: s, studentId } = openDemo();
  const lesson = s.ops.lessons.find((l) => l.courseId === "LOP-08");
  const r = run(
    s,
    "checkin",
    { lessonId: lesson.id, simulate: true },
    "ND-GV-1",
  );
  assert.equal(r.state.ops.checkins.length, s.ops.checkins.length + 1);
  assert.throws(
    () =>
      run(
        r.state,
        "checkin",
        { lessonId: lesson.id, simulate: true },
        "ND-GV-1",
      ),
    /đã được check-in/,
  );
  const p = {
    lessonId: lesson.id,
    simulate: true,
    records: [{ studentId, status: "Vắng", score: "" }],
  };
  const a = run(r.state, "attendance", p, "ND-GV-1").state;
  const b = run(a, "attendance", p, "ND-GV-1").state;
  assert.equal(a.ops.messages.length, 1);
  assert.equal(b.ops.messages.length, 1);
});
test("substitute check-in and salary belong to the substitute, not original teacher", () => {
  let { state: s } = openDemo();
  const lesson = s.ops.lessons.find((l) => l.courseId === "LOP-08");
  assert.throws(
    () =>
      run(s, "substitute", {
        lessonId: lesson.id,
        teacherId: "GV-2",
        note: "Thử trùng lịch",
      }),
    /trùng lịch/,
  );
  const added = run(s, "teacher", {
    name: "Giáo viên thay",
    subjectIds: ["TOAN"],
    rate: 300000,
  });
  s = added.state;
  const teacherId = added.value;
  const account = s.ops.users.find((u) => u.teacherId === teacherId).id;
  s = run(s, "substitute", {
    lessonId: lesson.id,
    teacherId,
    note: "Giáo viên chính bận họp",
  }).state;
  assert.throws(
    () => run(s, "checkin", { lessonId: lesson.id, simulate: true }, "ND-GV-1"),
    /không được phân công/,
  );
  s = run(s, "checkin", { lessonId: lesson.id, simulate: true }, account).state;
  assert.equal(s.ops.checkins.at(-1).teacherId, teacherId);
  assert.equal(s.ops.checkins.at(-1).rate, 300000);
});
test("payroll approval creates exactly one expense with complete class allocation", () => {
  let { state: s } = openDemo();
  const lesson = s.ops.lessons.find((l) => l.courseId === "LOP-08");
  s = run(
    s,
    "checkin",
    { lessonId: lesson.id, simulate: true },
    "ND-GV-1",
  ).state;
  const r = run(s, "createPayroll", {
    teacherId: "GV-1",
    month: today().slice(0, 7),
    adjustment: 50000,
    note: "Thưởng hỗ trợ lớp mới",
  });
  s = r.state;
  const p = s.ops.payrolls.find((p) => p.id === r.value);
  const total = payrollTotal(s.ops, p);
  s = run(s, "approvePayroll", { id: p.id }).state;
  const expense = s.ops.expenses.find((e) => e.payrollId === p.id);
  assert.equal(expense.amount, total);
  assert.equal(
    expense.allocations.reduce((a, x) => a + x.amount, 0),
    total,
  );
  assert.throws(
    () => run(s, "approvePayroll", { id: p.id }),
    /không còn là nháp/,
  );
  const before = s.ops.expenses.length;
  s = run(s, "payPayroll", { id: p.id }).state;
  assert.equal(s.ops.expenses.length, before);
  assert.equal(s.ops.payrolls.find((x) => x.id === p.id).status, "Đã trả");
});
test("partial payment updates balance and automatic confirmation; no overpayment", () => {
  const s = seedState(),
    i = s.ops.invoices.find((i) => i.studentId === "HV-005");
  const old = invoiceBalance(s.ops, i);
  const r = run(s, "payment", {
    invoiceId: i.id,
    amount: 100000,
    method: "Chuyển khoản",
  }).state;
  assert.equal(invoiceBalance(r.ops, i), old - 100000);
  assert.equal(r.ops.messages.at(-1).type, "Xác nhận đã thu tự động");
  assert.throws(
    () =>
      run(r, "payment", { invoiceId: i.id, amount: old, method: "Tiền mặt" }),
    /không vượt/,
  );
});
test("snapshot anonymity, frozen risk and reports until ETL; exact operational/warehouse reconciliation", () => {
  const s = seedState();
  assert(!JSON.stringify(s.warehouse).includes("Nguyễn Minh An"));
  assert(!JSON.stringify(s.warehouse).includes("0902000000"));
  const before = risks(s.warehouse).find(
    (r) => r.studentId === "HV-005",
  ).overdue;
  const i = s.ops.invoices.find((i) => i.studentId === "HV-005");
  const live = run(s, "payment", {
    invoiceId: i.id,
    amount: invoiceBalance(s.ops, i),
    method: "Tiền mặt",
  }).state;
  assert.equal(
    risks(live.warehouse).find((r) => r.studentId === "HV-005").overdue,
    before,
  );
  assert.equal(live.warehouse.sourceRevision, s.ops.revision);
  const etl = run(live, "etl").state;
  assert.equal(
    risks(etl.warehouse).find((r) => r.studentId === "HV-005").overdue,
    0,
  );
  assert.equal(etl.warehouse.sourceRevision, etl.ops.revision);
  const m = today().slice(0, 7);
  const op = profitSummary(
    operationalFacts(etl.ops),
    etl.ops.courses,
    etl.ops.lessons,
    m,
    etl.ops.settings.reserveRate,
  );
  const wh = warehouseProfit(etl.warehouse, m);
  assert.equal(wh.income, op.income);
  assert.equal(wh.expenses, op.expenses);
  assert.deepEqual(wh.rows, op.rows);
  assert.equal(
    op.rows.reduce((a, r) => a + r.profit, 0) - op.unallocated,
    op.net,
  );
  assert(op.rows.some((r) => r.profit < 0));
  assert.equal(op.each * 3 + op.remainder, op.distributable);
});
test("risk formula and simulated care produce four result types without sending; only manager approval sends", () => {
  const s = seedState();
  const high = risks(s.warehouse).find((r) => r.studentId === "HV-003");
  assert.equal(high.score, 80);
  assert.equal(high.level, "Cao");
  const plans = [...careSteps(s.warehouse)]
    .filter((s) => s.plan)
    .map((s) => s.plan);
  assert.equal(plans.length, 6);
  assert.equal(plans.filter((p) => p.kind === "Mời học tiếp").length, 2);
  assert.equal(plans.filter((p) => p.kind === "Gọi điện hỏi thăm").length, 2);
  assert.equal(plans.filter((p) => p.kind === "Nhắc học phí").length, 1);
  assert.equal(plans.filter((p) => p.kind === "Chờ lớp mới").length, 1);
  let next = plans.reduce((state, plan) => saveCarePlan(state, plan), s);
  assert.equal(next.ops.messages.length, 0);
  assert.equal(next.ops.drafts.length, 4);
  assert.equal(next.ops.tasks.length, 2);
  const draft = next.ops.drafts.find((d) => d.studentId === "HV-001");
  assert(draft.content.includes("Nguyễn Minh An"));
  next = run(next, "approveDraft", { id: draft.id }).state;
  assert.equal(next.ops.messages.length, 1);
  assert.throws(
    () => run(next, "approveDraft", { id: draft.id }),
    /không còn chờ/,
  );
  const again = plans.reduce((state, plan) => saveCarePlan(state, plan), next);
  assert.equal(again.ops.drafts.length, 4);
});
