import test from "node:test";
import assert from "node:assert/strict";
import { seedState } from "../src/seed.ts";
import { applyAction, pendingCheckins } from "../src/domain.ts";
import { runCareAgent, saveCarePlan } from "../src/agent.ts";
import {
  invoiceBalance,
  operationalFacts,
  profitSummary,
} from "../src/finance.ts";
import { risks } from "../src/warehouse.ts";
import { today } from "../src/utils.ts";

test("an active learner joining a future waiting list remains active", () => {
  const initial = seedState();
  const result = applyAction(initial, "QL-MINH", "enroll", {
    studentId: "HV-001",
    courseId: "LOP-09",
  }).state;
  assert.equal(result.ops.students.find((s) => s.id === "HV-001").status, "Sắp hết khóa");
  assert.equal(result.ops.enrollments.at(-1).status, "Chờ lớp");
  assert.equal(result.ops.invoices.length, initial.ops.invoices.length);
});
test("complete the six-minute presentation workflow, serialize and reload the result", async () => {
  let state = seedState();
  const act = (action, payload = {}, user = "QL-MINH") => {
    const r = applyAction(state, user, action, payload);
    state = r.state;
    return r.value;
  };
  const teacherId = act("teacher", {
    name: "Giáo viên thêm trong buổi demo",
    subjectIds: ["TOAN"],
    rate: 300000,
    phone: "0901234567",
  });
  assert.equal(state.ops.teachers.find((t) => t.id === teacherId).rate, 300000);
  const studentId = act("student", {
    name: "Học viên mới trong buổi demo",
    parent: "Phụ huynh demo",
    zalo: "0907654321",
    birth: "2011-05-05",
    grade: 9,
    school: "THCS Nguyễn Du",
    courseId: "LOP-08",
  });
  assert.equal(
    state.ops.enrollments.filter((e) => e.courseId === "LOP-08").length,
    3,
  );
  act("openCourse", { id: "LOP-08" });
  const lesson = state.ops.lessons.find((l) => l.courseId === "LOP-08");
  const before = state.ops.checkins.filter(
    (c) => c.teacherId === "GV-1" && c.date.startsWith(today().slice(0, 7)),
  ).length;
  act("checkin", { lessonId: lesson.id, simulate: true }, "ND-GV-1");
  assert.equal(
    state.ops.checkins.filter(
      (c) => c.teacherId === "GV-1" && c.date.startsWith(today().slice(0, 7)),
    ).length,
    before + 1,
  );
  act(
    "attendance",
    {
      lessonId: lesson.id,
      simulate: true,
      records: [{ studentId, status: "Vắng", score: "" }],
    },
    "ND-GV-1",
  );
  assert.equal(state.ops.messages.at(-1).type, "Báo vắng tự động");
  const invoice = state.ops.invoices.find((i) => i.studentId === studentId);
  const messageCount = state.ops.messages.length;
  act("reminder", { invoiceId: invoice.id }, "ND-GV-1");
  assert.equal(
    state.ops.messages.length,
    messageCount,
    "Reminder requires manager approval",
  );
  const receiptId = act("payment", {
    invoiceId: invoice.id,
    amount: invoiceBalance(state.ops, invoice),
    method: "Chuyển khoản",
  });
  assert(state.ops.receipts.some((r) => r.id === receiptId));
  assert.equal(state.ops.messages.at(-1).type, "Xác nhận đã thu tự động");
  const payId = act("createPayroll", {
    teacherId: "GV-1",
    month: today().slice(0, 7),
    adjustment: 0,
  });
  act("approvePayroll", { id: payId });
  assert(state.ops.expenses.some((e) => e.payrollId === payId));
  const p = profitSummary(
    operationalFacts(state.ops),
    state.ops.courses,
    state.ops.lessons,
    today().slice(0, 7),
    10,
  );
  assert(p.rows.some((c) => c.profit < 0));
  assert(!state.warehouse.dimStudents.some((s) => s.id === studentId));
  act("etl");
  assert(state.warehouse.dimStudents.some((s) => s.id === studentId));
  const steps = [];
  await runCareAgent(
    state.warehouse,
    (s) => steps.push(s),
    (plan) => {
      state = saveCarePlan(state, plan);
    },
    0,
  );
  assert(steps.some((s) => s.summary));
  const draft = state.ops.drafts.find(
    (d) => d.studentId === "HV-001" && d.kind === "Mời học tiếp",
  );
  assert(draft.content.includes("16/16"));
  assert(draft.content.includes("Nguyễn Minh An"));
  act("saveDraft", {
    id: draft.id,
    content: draft.content + " Cảm ơn Anh/Chị.",
  });
  act("approveDraft", { id: draft.id });
  assert(state.ops.messages.at(-1).content.includes("Cảm ơn Anh/Chị."));
  assert(state.ops.audit.some((a) => a.actor === "Tác tử AI"));
  assert(
    state.ops.audit.some(
      (a) => a.actor === "Anh Minh" && a.action === "Duyệt và gửi tin",
    ),
  );
  const restored = JSON.parse(JSON.stringify(state));
  assert.equal(restored.ops.students.length, 41);
  assert.equal(restored.ops.teachers.length, 8);
  assert(restored.ops.receipts.some((r) => r.id === receiptId));
});
test("new multi-subject enrolment applies configured discount without changing previous invoice", () => {
  let state = seedState();
  const old = state.ops.invoices.find((i) => i.studentId === "HV-007");
  const amount = old.amount;
  state = applyAction(state, "QL-MINH", "enroll", {
    studentId: "HV-007",
    courseId: "LOP-07",
  }).state;
  const i = state.ops.invoices.at(-1);
  assert.equal(i.gross, 2400000);
  assert.equal(i.discount, 240000);
  assert.equal(i.amount, 2160000);
  assert.equal(state.ops.invoices.find((i) => i.id === old.id).amount, amount);
});
