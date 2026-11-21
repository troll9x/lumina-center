import type { Warehouse, AppState } from "./types.ts";
import { risks, academicStats } from "./warehouse.ts";
import { dateLabel, money, schedule, uid, now, ensure } from "./utils.ts";
export type CarePlan = {
  studentId: string;
  kind: "Mời học tiếp" | "Gọi điện hỏi thăm" | "Nhắc học phí" | "Chờ lớp mới";
  reason: string;
  template: string;
  courseId: string | null;
  warehouseAt: string;
};
export type AgentStep = {
  tool: string;
  message: string;
  plan?: CarePlan;
  summary?: boolean;
};
export function* careSteps(w: Warehouse): Generator<AgentStep> {
  const all = risks(w)
    .filter((r) => r.endingCourseId || r.level === "Cao")
    .sort((a, b) => a.studentId.localeCompare(b.studentId));
  const counts: Record<string, number> = {};
  yield {
    tool: "lay_hoc_vien_can_cham_soc",
    message: `${all.length} học viên sắp hết khóa hoặc rủi ro Cao · Nguồn: kho ETL ${w.loadedAt}`,
  };
  for (const r of all) {
    const stats = academicStats(w, r.studentId);
    yield {
      tool: "lay_chuyen_can_va_diem",
      message: `${r.studentId} → ${stats.attendance ?? "chưa có"}% · ${stats.present}/${stats.total} buổi · Điểm ${stats.scores.join(" → ") || "chưa có"}`,
    };
    yield {
      tool: "lay_cong_no",
      message: `${r.studentId} → Còn nợ ${money(r.debt)}, quá hạn ${money(r.overdue)}`,
    };
    yield {
      tool: "lay_diem_rui_ro",
      message: `${r.studentId} → ${r.score}/100 (${r.level})${r.reasons.length ? " · " + r.reasons.map((x) => `${x.label} (+${x.points})`).join("; ") : ""}`,
    };
    let plan: CarePlan;
    const c = w.dimCourses.find((c) => c.id === r.endingCourseId);
    if (r.overdue > 0) {
      plan = {
        studentId: r.studentId,
        kind: "Nhắc học phí",
        reason: `Công nợ quá hạn ${money(r.overdue)}. Ưu tiên xử lý học phí, chưa mời học tiếp.`,
        template: `Trung tâm Tri Thức Việt xin chào Anh/Chị. Học phí của {HOC_VIEN} còn quá hạn ${money(r.overdue)}. Anh/Chị vui lòng kiểm tra và phản hồi để Trung tâm hỗ trợ đối chiếu. Trung tâm cảm ơn Anh/Chị.`,
        courseId: null,
        warehouseAt: w.loadedAt,
      };
    } else if (
      r.level === "Cao" ||
      stats.attendance === null ||
      stats.attendance < 80 ||
      stats.declining ||
      stats.scores.length < 2
    ) {
      plan = {
        studentId: r.studentId,
        kind: "Gọi điện hỏi thăm",
        reason: r.reasons.length
          ? r.reasons.map((x) => x.label).join("; ")
          : "Chưa đủ dữ liệu học tập; quản lý cần xác minh trước khi mời học tiếp.",
        template: "",
        courseId: null,
        warehouseAt: w.loadedAt,
      };
    } else {
      const options = c
        ? w.dimCourses.filter(
            (next) =>
              next.subjectId === c.subjectId &&
              next.grade === c.grade &&
              next.start > c.end &&
              next.status !== "Đã kết thúc" &&
              w.enrollments.filter((e) => e.courseId === next.id).length <
                next.capacity,
          )
        : [];
      yield {
        tool: "tim_lop_tiep_theo",
        message: `${r.studentId} → ${options[0] ? options[0].name + ", còn " + (options[0].capacity - w.enrollments.filter((e) => e.courseId === options[0].id).length) + " chỗ" : "Chưa có lớp tiếp theo phù hợp"}`,
      };
      const next = options[0];
      const first = stats.scores[0],
        last = stats.scores.at(-1);
      const assessment =
        last! > first
          ? `điểm kiểm tra tăng từ ${first} lên ${last}`
          : `điểm kiểm tra ổn định ở ${last}`;
      plan = next
        ? {
            studentId: r.studentId,
            kind: "Mời học tiếp",
            reason: `Chuyên cần ${stats.attendance}%, học tập ổn định hoặc tiến bộ; không có học phí quá hạn. Lớp tiếp theo còn chỗ theo kho dữ liệu.`,
            template: `Trung tâm Tri Thức Việt xin chào Anh/Chị. Khóa ${w.dimSubjects.find((s) => s.id === c!.subjectId)!.name} của {HOC_VIEN} kết thúc ngày ${dateLabel(c!.end)}. {HOC_VIEN} đi học ${stats.present}/${stats.total} buổi, ${assessment}. Trung tâm mời {HOC_VIEN} học tiếp lớp ${next.name}, ${schedule(next)}${next.status === "Dự kiến" ? " (dự kiến)" : ""}. Anh/Chị phản hồi để Trung tâm giữ chỗ nhé.`,
            courseId: next.id,
            warehouseAt: w.loadedAt,
          }
        : {
            studentId: r.studentId,
            kind: "Chờ lớp mới",
            reason:
              "Học tập ổn định, không nợ quá hạn; chưa có lớp tiếp theo phù hợp trong kho dữ liệu.",
            template: `Trung tâm Tri Thức Việt cảm ơn Anh/Chị đã đồng hành cùng {HOC_VIEN}. Em có chuyên cần ${stats.attendance}%, điểm gần nhất ${last}. Hiện chưa có lớp tiếp theo phù hợp. Trung tâm sẽ thông báo Anh/Chị khi có lịch lớp mới nhé.`,
            courseId: null,
            warehouseAt: w.loadedAt,
          };
    }
    yield {
      tool: "phan_loai_cham_soc",
      message: `${r.studentId} → ${plan.kind}. ${plan.reason}`,
    };
    counts[plan.kind] = (counts[plan.kind] || 0) + 1;
    yield {
      tool:
        plan.kind === "Gọi điện hỏi thăm"
          ? "tao_viec_cho_quan_ly"
          : "tao_ban_nhap_tin_nhan",
      message: `${r.studentId} → ${plan.kind} · Chưa gửi tin nhắn`,
      plan,
    };
  }
  yield {
    tool: "tong_ket",
    message: `Đã xét ${all.length} học viên. ${Object.entries(counts)
      .map(([k, n]) => `${k}: ${n}`)
      .join(" · ")}. Mọi tin nhắn đang chờ quản lý duyệt.`,
    summary: true,
  };
}
// Deliberately simulated: deterministic data-backed rules, visible 550ms steps.
// Replacing this adapter later does not require changing the review interface.
export async function runCareAgent(
  w: Warehouse,
  onStep: (step: AgentStep) => void,
  onPlan: (plan: CarePlan) => void,
  delayMs = 550,
) {
  for (const step of careSteps(structuredClone(w))) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    if (step.plan) onPlan(step.plan);
    onStep(step);
  }
}
export function saveCarePlan(state: AppState, plan: CarePlan): AppState {
  const next = structuredClone(state);
  const o = next.ops;
  ensure(
    next.warehouse?.loadedAt === plan.warehouseAt,
    "Kho đã thay đổi; hãy chạy lại tác tử.",
  );
  // Identity resolution is a delivery boundary. Classification and all numbers
  // were obtained solely from the anonymized warehouse, never live operations.
  const student = o.students.find((s) => s.id === plan.studentId);
  ensure(student, "Học viên không còn tồn tại.");
  if (plan.kind === "Gọi điện hỏi thăm") {
    if (
      o.tasks.some(
        (t) => t.studentId === plan.studentId && t.status === "Cần xử lý",
      )
    )
      return state;
    o.tasks.push({
      id: uid("VIEC"),
      studentId: plan.studentId,
      reason: plan.reason,
      status: "Cần xử lý",
      created: now(),
      warehouseAt: plan.warehouseAt,
    });
  } else {
    if (
      o.drafts.some(
        (d) =>
          d.studentId === plan.studentId &&
          d.kind === plan.kind &&
          (d.status === "Chờ duyệt" ||
            (d.warehouseAt === plan.warehouseAt && d.status === "Đã gửi")),
      )
    )
      return state;
    o.drafts.push({
      id: uid("NHAP"),
      studentId: plan.studentId,
      kind: plan.kind,
      content: plan.template.replaceAll("{HOC_VIEN}", student.name),
      reason: plan.reason,
      courseId: plan.courseId,
      status: "Chờ duyệt",
      created: now(),
      warehouseAt: plan.warehouseAt,
    });
  }
  o.audit.unshift({
    id: uid("NK"),
    actor: "Tác tử AI",
    action:
      plan.kind === "Gọi điện hỏi thăm"
        ? "Tạo việc gọi điện hỏi thăm"
        : "Tạo bản nháp tin nhắn",
    detail: `${plan.studentId} · ${plan.kind} · ${plan.reason}`,
    created: now(),
  });
  o.revision++;
  return next;
}
