import type {
  AppState,
  Operations,
  User,
  Course,
  Invoice,
  Payroll,
} from "./types.ts";
import {
  uid,
  now,
  today,
  addDays,
  sessionDates,
  ensure,
  money,
} from "./utils.ts";
import { invoiceBalance, payrollTotal, payrollAllocations } from "./finance.ts";
import { buildWarehouse } from "./warehouse.ts";
export function log(
  o: Operations,
  actor: string,
  action: string,
  detail: string,
) {
  o.audit.unshift({ id: uid("NK"), actor, action, detail, created: now() });
}
export function minimumStudents(o: Operations, c: Course) {
  return Math.ceil(
    o.teachers.find((t) => t.id === c.teacherId)!.rate / c.price,
  );
}
export function pendingCheckins(
  o: Operations,
  teacherId: string,
  month: string,
) {
  const used = new Set(o.payrolls.flatMap((p) => p.checkinIds));
  return o.checkins.filter(
    (c) =>
      c.teacherId === teacherId && c.date.startsWith(month) && !used.has(c.id),
  );
}
export function belongsToTeacher(o: Operations, user: User, courseId: string) {
  return (
    user.role === "manager" ||
    o.courses.some(
      (c) => c.id === courseId && c.teacherId === user.teacherId,
    ) ||
    o.lessons.some(
      (l) => l.courseId === courseId && l.teacherId === user.teacherId,
    )
  );
}
function manager(user: User) {
  ensure(user.role === "manager", "Chỉ quản lý được thực hiện thao tác này.");
}
function createInvoice(
  o: Operations,
  studentId: string,
  course: Course,
  enrollmentId: string,
) {
  ensure(
    !o.invoices.some((i) => i.enrollmentId === enrollmentId),
    "Khoản học phí đã tồn tại.",
  );
  const subjects = new Set(
    o.enrollments
      .filter((e) => e.studentId === studentId && e.status === "Đang học")
      .map((e) => o.courses.find((c) => c.id === e.courseId)!.subjectId),
  );
  const gross = course.sessions * course.price;
  const discount =
    subjects.size >= 2
      ? Math.round((gross * o.settings.discountRate) / 100)
      : 0;
  const invoice: Invoice = {
    id: uid("HP"),
    enrollmentId,
    studentId,
    courseId: course.id,
    gross,
    discount,
    amount: gross - discount,
    due: addDays(course.start, 7),
    created: today(),
  };
  o.invoices.push(invoice);
  return invoice;
}
function enroll(o: Operations, studentId: string, courseId: string) {
  const st = o.students.find((s) => s.id === studentId),
    c = o.courses.find((c) => c.id === courseId);
  ensure(st && c, "Không tìm thấy học viên hoặc lớp.");
  ensure(c.status !== "Đã kết thúc", "Lớp đã kết thúc.");
  ensure(st.grade === c.grade, "Khối học viên không phù hợp với lớp.");
  ensure(
    !o.enrollments.some((e) => e.studentId === st.id && e.courseId === c.id),
    "Học viên đã được xếp vào lớp này.",
  );
  ensure(
    o.enrollments.filter((e) => e.courseId === c.id).length < c.capacity,
    "Lớp đã đủ sĩ số.",
  );
  const hadActive = o.enrollments.some(
    (e) => e.studentId === st.id && e.status === "Đang học",
  );
  const status = c.status === "Dự kiến" ? "Chờ lớp" : "Đang học";
  const e = {
    id: uid("DK"),
    studentId,
    courseId,
    status,
    created: today(),
  } as const;
  o.enrollments.push(e);
  if (status !== "Chờ lớp" || !hadActive) st.status = status;
  st.leaveReason = "";
  if (c.status === "Đang mở") createInvoice(o, studentId, c, e.id);
  return e.id;
}
function checkSchedule(
  o: Operations,
  course: Course,
  dates: string[],
  teacherId = course.teacherId,
  ignoreLesson?: string,
) {
  const [start, end] = course.time.split("–");
  for (const l of o.lessons.filter(
    (l) =>
      l.teacherId === teacherId &&
      l.id !== ignoreLesson &&
      dates.includes(l.date),
  )) {
    const other = o.courses.find((c) => c.id === l.courseId)!;
    const [a, b] = other.time.split("–");
    ensure(
      !(start < b && end > a),
      `Giáo viên trùng lịch ${other.name} ngày ${l.date.split("-").reverse().join("/")}.`,
    );
  }
}
export function applyAction(
  state: AppState,
  userId: string,
  action: string,
  p: Record<string, any> = {},
): { state: AppState; value: string } {
  // Clone before validation: failed actions cannot partially create charges,
  // lesson rows, payroll expenses or messages in the shared data model.
  const next = structuredClone(state),
    o = next.ops;
  const user = o.users.find((u) => u.id === userId);
  ensure(user, "Người dùng không hợp lệ.");
  let value = "",
    detail = "",
    label = "";
  if (action === "student") {
    manager(user);
    ensure(
      String(p.name || "").trim() && String(p.parent || "").trim(),
      "Nhập họ tên học viên và phụ huynh.",
    );
    ensure(/^0\d{9}$/.test(p.zalo), "Số Zalo cần 10 chữ số, bắt đầu bằng 0.");
    ensure(
      Number.isInteger(+p.grade) && +p.grade >= 1 && +p.grade <= 12,
      "Khối phải từ 1 đến 12.",
    );
    ensure(
      /^\d{4}-\d{2}-\d{2}$/.test(p.birth) && p.birth < today(),
      "Ngày sinh không hợp lệ.",
    );
    const id = uid("HV");
    o.students.push({
      id,
      name: String(p.name).trim(),
      birth: p.birth,
      grade: +p.grade,
      school: String(p.school || ""),
      parent: String(p.parent).trim(),
      zalo: p.zalo,
      status: "Tiềm năng",
      leaveReason: "",
      created: today(),
    });
    if (p.courseId) enroll(o, id, p.courseId);
    value = id;
    label = "Thêm học viên";
    detail = `${p.name}${p.courseId ? " · Xếp lớp và liên thông học phí" : ""}`;
  } else if (action === "enroll") {
    manager(user);
    value = enroll(o, p.studentId, p.courseId);
    label = "Xếp lớp";
    detail = `${p.studentId} · ${p.courseId}`;
  } else if (action === "studentStatus") {
    manager(user);
    const st = o.students.find((s) => s.id === p.id);
    ensure(st, "Không tìm thấy học viên.");
    ensure(
      [
        "Tiềm năng",
        "Chờ lớp",
        "Đang học",
        "Sắp hết khóa",
        "Học tiếp",
        "Đã nghỉ",
      ].includes(p.status),
      "Trạng thái không hợp lệ.",
    );
    ensure(
      p.status !== "Đã nghỉ" || String(p.reason || "").trim(),
      "Cần ghi lý do nghỉ học.",
    );
    st.status = p.status;
    st.leaveReason = p.status === "Đã nghỉ" ? p.reason : "";
    value = st.id;
    label = "Cập nhật trạng thái học viên";
    detail = `${st.name} · ${st.status}${st.leaveReason ? " · " + st.leaveReason : ""}`;
  } else if (action === "teacher") {
    manager(user);
    ensure(String(p.name || "").trim(), "Nhập họ tên giáo viên.");
    ensure(
      Array.isArray(p.subjectIds) &&
        p.subjectIds.length &&
        p.subjectIds.every((id: string) => o.subjects.some((s) => s.id === id)),
      "Chọn môn được phân công.",
    );
    ensure(
      Number.isSafeInteger(+p.rate) && +p.rate > 0,
      "Lương mỗi buổi phải là số nguyên dương.",
    );
    const id = uid("GV");
    o.teachers.push({
      id,
      name: p.name,
      subjectIds: p.subjectIds,
      rate: +p.rate,
      phone: String(p.phone || ""),
    });
    o.users.push({
      id: uid("ND"),
      name: p.name,
      role: "teacher",
      teacherId: id,
    });
    value = id;
    label = "Thêm giáo viên";
    detail = `${p.name} · ${money(+p.rate)}/buổi`;
  } else if (action === "course") {
    manager(user);
    const teacher = o.teachers.find((t) => t.id === p.teacherId);
    ensure(
      teacher && teacher.subjectIds.includes(p.subjectId),
      "Giáo viên phải được phân công đúng môn.",
    );
    ensure(String(p.name || "").trim(), "Nhập tên lớp học.");
    ensure(
      Number.isInteger(+p.grade) && +p.grade >= 1 && +p.grade <= 12,
      "Khối không hợp lệ.",
    );
    const days = [...new Set<number>((p.days || []).map(Number))];
    ensure(
      days.length && days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6),
      "Chọn ngày học hợp lệ.",
    );
    const times = String(p.time).replace("-", "–").split("–");
    ensure(
      times.length === 2 &&
        times.every((t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t)) &&
        times[0] < times[1],
      "Giờ học dạng 18:00-19:30.",
    );
    ensure(
      Number.isInteger(+p.sessions) && +p.sessions >= 1 && +p.sessions <= 100,
      "Số buổi từ 1 đến 100.",
    );
    ensure(
      Number.isInteger(+p.capacity) && +p.capacity >= 1 && +p.capacity <= 100,
      "Sĩ số từ 1 đến 100.",
    );
    ensure(
      Number.isSafeInteger(+p.price) && +p.price > 0,
      "Đơn giá phải là số nguyên dương.",
    );
    ensure(
      /^\d{4}-\d{2}-\d{2}$/.test(p.start) && p.start >= today(),
      "Ngày bắt đầu phải từ hôm nay.",
    );
    const dates = sessionDates(p.start, days, +p.sessions);
    ensure(dates.length === +p.sessions, "Không sinh được đủ buổi học.");
    const c: Course = {
      id: uid("LOP"),
      name: p.name,
      subjectId: p.subjectId,
      grade: +p.grade,
      teacherId: teacher.id,
      days,
      time: times.join("–"),
      sessions: +p.sessions,
      capacity: +p.capacity,
      price: +p.price,
      start: dates[0],
      end: dates.at(-1)!,
      status: "Dự kiến",
    };
    o.courses.push(c);
    value = c.id;
    label = "Tạo lớp dự kiến";
    detail = c.name;
  } else if (action === "openCourse") {
    manager(user);
    const c = o.courses.find((c) => c.id === p.id);
    ensure(c && c.status === "Dự kiến", "Lớp không còn ở trạng thái dự kiến.");
    const waiting = o.enrollments.filter(
      (e) => e.courseId === c.id && e.status === "Chờ lớp",
    );
    ensure(
      waiting.length >= minimumStudents(o, c),
      `Cần tối thiểu ${minimumStudents(o, c)} học viên để mở lớp.`,
    );
    ensure(waiting.length <= c.capacity, "Vượt sĩ số tối đa.");
    const dates = sessionDates(c.start, c.days, c.sessions);
    checkSchedule(o, c, dates);
    c.start = dates[0];
    c.end = dates.at(-1)!;
    c.status = "Đang mở";
    dates.forEach((date) =>
      o.lessons.push({
        id: uid("BUOI"),
        courseId: c.id,
        date,
        teacherId: c.teacherId,
        substituteNote: "",
      }),
    );
    for (const e of waiting) {
      e.status = "Đang học";
      o.students.find((st) => st.id === e.studentId)!.status = "Đang học";
      createInvoice(o, e.studentId, c, e.id);
    }
    value = c.id;
    label = "Mở lớp và liên thông";
    detail = `${c.name} · ${dates.length} buổi · ${waiting.length} học viên và khoản phải thu`;
  } else if (action === "substitute") {
    manager(user);
    const l = o.lessons.find((l) => l.id === p.lessonId),
      t = o.teachers.find((t) => t.id === p.teacherId);
    ensure(l && t, "Không tìm thấy buổi học hoặc giáo viên.");
    const c = o.courses.find((c) => c.id === l.courseId)!;
    ensure(
      t.subjectIds.includes(c.subjectId),
      "Giáo viên dạy thay phải đúng môn.",
    );
    ensure(
      !o.checkins.some((check) => check.lessonId === l.id),
      "Buổi đã check-in; không đổi người để tránh sai lương.",
    );
    ensure(String(p.note || "").trim(), "Ghi lý do dạy thay.");
    checkSchedule(o, c, [l.date], t.id, l.id);
    l.teacherId = t.id;
    l.substituteNote = p.note;
    value = l.id;
    label = "Phân công dạy thay";
    detail = `${c.name} · ${l.date} · ${t.name}`;
  } else if (action === "checkin") {
    ensure(user.role === "teacher", "Chỉ giáo viên được check-in.");
    const l = o.lessons.find((l) => l.id === p.lessonId);
    ensure(
      l && l.teacherId === user.teacherId,
      "Bạn không được phân công buổi này.",
    );
    ensure(
      p.simulate === true || l.date === today(),
      "Chỉ check-in hôm nay, hoặc bật giả lập thời gian.",
    );
    ensure(
      !o.checkins.some((c) => c.lessonId === l.id),
      "Buổi học đã được check-in.",
    );
    const t = o.teachers.find((t) => t.id === user.teacherId)!;
    const check = {
      id: uid("CK"),
      lessonId: l.id,
      teacherId: t.id,
      date: today(),
      time: now(),
      rate: t.rate,
      simulated: l.date !== today(),
    };
    o.checkins.push(check);
    value = check.id;
    label = "Check-in buổi dạy";
    detail = `${o.courses.find((c) => c.id === l.courseId)!.name} · ${l.date}${check.simulated ? " · Giả lập, ghi nhận lương ngày hôm nay" : ""}`;
  } else if (action === "attendance") {
    ensure(user.role === "teacher", "Chỉ giáo viên được điểm danh.");
    const l = o.lessons.find((l) => l.id === p.lessonId);
    ensure(
      l && l.teacherId === user.teacherId,
      "Bạn không được phân công buổi này.",
    );
    ensure(p.simulate === true || l.date <= today(), "Buổi học chưa diễn ra.");
    ensure(
      o.checkins.some((c) => c.lessonId === l.id),
      "Hãy check-in trước khi điểm danh.",
    );
    ensure(
      Array.isArray(p.records) && p.records.length > 0,
      "Chưa có học viên để điểm danh.",
    );
    for (const r of p.records) {
      ensure(
        o.enrollments.some(
          (e) =>
            e.courseId === l.courseId &&
            e.studentId === r.studentId &&
            e.status === "Đang học",
        ),
        "Học viên không thuộc lớp đang học.",
      );
      ensure(
        ["Có mặt", "Vắng", "Muộn"].includes(r.status),
        "Trạng thái điểm danh không hợp lệ.",
      );
      const score = r.score === "" || r.score === null ? null : Number(r.score);
      ensure(
        score === null || (Number.isFinite(score) && score >= 0 && score <= 10),
        "Điểm phải từ 0 đến 10.",
      );
      const previous = o.attendance.find(
        (a) => a.lessonId === l.id && a.studentId === r.studentId,
      );
      const wasAbsent = previous?.status === "Vắng";
      if (previous) {
        previous.status = r.status;
        previous.score = score;
      } else
        o.attendance.push({
          id: uid("DD"),
          studentId: r.studentId,
          lessonId: l.id,
          status: r.status,
          score,
        });
      if (r.status === "Vắng" && !wasAbsent) {
        const st = o.students.find((s) => s.id === r.studentId)!;
        o.messages.push({
          id: uid("TIN"),
          studentId: st.id,
          type: "Báo vắng tự động",
          content: `Trung tâm Tri Thức Việt thông báo Anh/Chị: ${st.name} vắng buổi ${o.courses.find((c) => c.id === l.courseId)!.name} ngày ${l.date.split("-").reverse().join("/")}. Anh/Chị vui lòng liên hệ Trung tâm để được hỗ trợ.`,
          created: now(),
        });
      }
    }
    value = l.id;
    label = "Lưu điểm danh và điểm";
    detail = `${p.records.length} học viên · ${l.id}`;
  } else if (action === "payment") {
    manager(user);
    const i = o.invoices.find((i) => i.id === p.invoiceId);
    ensure(i, "Khoản thu không tồn tại.");
    const amount = +p.amount;
    ensure(
      Number.isSafeInteger(amount) &&
        amount > 0 &&
        amount <= invoiceBalance(o, i),
      "Số tiền phải dương và không vượt công nợ.",
    );
    ensure(
      ["Tiền mặt", "Chuyển khoản"].includes(p.method),
      "Chọn hình thức thu hợp lệ.",
    );
    const r = {
      id: uid("PT"),
      invoiceId: i.id,
      amount,
      method: p.method,
      date: today(),
      actor: user.name,
    };
    o.receipts.push(r);
    const st = o.students.find((s) => s.id === i.studentId)!;
    o.messages.push({
      id: uid("TIN"),
      studentId: st.id,
      type: "Xác nhận đã thu tự động",
      content: `Trung tâm Tri Thức Việt xác nhận đã thu ${money(amount)} học phí của ${st.name}. Phiếu thu ${r.id}, khoản thu ${i.id}. Còn phải đóng: ${money(invoiceBalance(o, i))}. Cảm ơn Anh/Chị.`,
      created: now(),
    });
    value = r.id;
    label = "Ghi nhận thu và lập phiếu";
    detail = `${st.name} · ${money(amount)} · ${r.id}`;
  } else if (action === "reminder") {
    const i = o.invoices.find((i) => i.id === p.invoiceId);
    ensure(
      i && belongsToTeacher(o, user, i.courseId),
      "Khoản thu không nằm trong lớp được phân công.",
    );
    ensure(invoiceBalance(o, i) > 0, "Khoản học phí đã được thu đủ.");
    const existing = o.drafts.find(
      (d) =>
        d.studentId === i.studentId &&
        d.kind === "Nhắc học phí" &&
        d.status === "Chờ duyệt",
    );
    if (existing) value = existing.id;
    else {
      const st = o.students.find((s) => s.id === i.studentId)!;
      const d = {
        id: uid("NHAP"),
        studentId: st.id,
        kind: "Nhắc học phí",
        content: `Trung tâm Tri Thức Việt xin chào Anh/Chị. Học phí của ${st.name} còn ${money(invoiceBalance(o, i))}, mã khoản thu ${i.id}, hạn đóng ${i.due.split("-").reverse().join("/")}. Anh/Chị vui lòng kiểm tra và phản hồi để Trung tâm hỗ trợ nhé.`,
        reason: `Yêu cầu gửi lại thông báo từ ${user.name}. Giáo viên không nhận tiền và không sửa học phí.`,
        courseId: i.courseId,
        status: "Chờ duyệt" as const,
        created: now(),
        warehouseAt: "",
      };
      o.drafts.push(d);
      value = d.id;
    }
    label = "Yêu cầu gửi lại thông báo";
    detail = `${i.id} · Chờ quản lý duyệt`;
  } else if (action === "createPayroll") {
    manager(user);
    const teacher = o.teachers.find((t) => t.id === p.teacherId);
    ensure(teacher, "Giáo viên không tồn tại.");
    ensure(/^\d{4}-\d{2}$/.test(p.month), "Tháng không hợp lệ.");
    const checks = pendingCheckins(o, teacher.id, p.month);
    ensure(
      checks.length,
      "Không còn buổi check-in chưa được lập lương trong tháng.",
    );
    const adjustment = Number(p.adjustment || 0);
    ensure(Number.isSafeInteger(adjustment), "Điều chỉnh phải là số nguyên.");
    ensure(
      adjustment === 0 || String(p.note || "").trim(),
      "Thưởng/khấu trừ phải có ghi chú.",
    );
    ensure(
      checks.reduce((a, c) => a + c.rate, 0) + adjustment >= 0,
      "Tổng lương không được âm.",
    );
    const pay: Payroll = {
      id: uid("LUONG"),
      teacherId: teacher.id,
      month: p.month,
      checkinIds: checks.map((c) => c.id),
      adjustment,
      note: p.note || "",
      status: "Nháp",
    };
    o.payrolls.push(pay);
    value = pay.id;
    label = "Lập bảng lương nháp";
    detail = `${teacher.name} · ${p.month} · ${checks.length} buổi`;
  } else if (action === "approvePayroll") {
    manager(user);
    const pay = o.payrolls.find((pw) => pw.id === p.id);
    ensure(pay && pay.status === "Nháp", "Bảng lương không còn là nháp.");
    ensure(
      !o.expenses.some((e) => e.payrollId === pay.id),
      "Khoản chi lương đã tồn tại.",
    );
    pay.status = "Đã duyệt";
    pay.approvedAt = now();
    o.expenses.push({
      id: uid("CHI"),
      category: "Lương giáo viên",
      description: `Lương ${o.teachers.find((t) => t.id === pay.teacherId)!.name} · ${pay.month}`,
      amount: payrollTotal(o, pay),
      date: pay.month + "-01",
      payrollId: pay.id,
      allocations: payrollAllocations(o, pay),
      paid: false,
    });
    value = pay.id;
    label = "Duyệt lương và tạo khoản chi";
    detail = `${pay.id} · ${money(payrollTotal(o, pay))}`;
  } else if (action === "payPayroll") {
    manager(user);
    const pay = o.payrolls.find((pw) => pw.id === p.id);
    ensure(
      pay && pay.status === "Đã duyệt",
      "Chỉ xác nhận trả bảng lương đã duyệt.",
    );
    pay.status = "Đã trả";
    o.expenses.find((e) => e.payrollId === pay.id)!.paid = true;
    value = pay.id;
    label = "Xác nhận đã trả lương";
    detail = pay.id;
  } else if (action === "expense") {
    manager(user);
    ensure(
      ["Mặt bằng", "Điện nước", "Quảng cáo", "Thiết bị", "Khác"].includes(
        p.category,
      ),
      "Loại chi phí không hợp lệ.",
    );
    ensure(
      Number.isSafeInteger(+p.amount) && +p.amount > 0,
      "Số tiền chi phải là số nguyên dương.",
    );
    ensure(
      /^\d{4}-\d{2}-\d{2}$/.test(p.date) && p.date <= today(),
      "Ngày chi phải hợp lệ và không sau hôm nay.",
    );
    ensure(String(p.description || "").trim(), "Nhập nội dung chi.");
    const id = uid("CHI");
    o.expenses.push({
      id,
      category: p.category,
      amount: +p.amount,
      date: p.date,
      description: p.description,
      paid: true,
    });
    value = id;
    label = "Ghi nhận khoản chi";
    detail = `${p.category} · ${money(+p.amount)}`;
  } else if (
    action === "approveDraft" ||
    action === "skipDraft" ||
    action === "saveDraft"
  ) {
    manager(user);
    const d = o.drafts.find((d) => d.id === p.id);
    ensure(d && d.status === "Chờ duyệt", "Bản nháp không còn chờ duyệt.");
    if (action === "skipDraft") d.status = "Bỏ qua";
    else {
      const text = String(p.content || d.content).trim();
      ensure(text && text.length <= 2500, "Nội dung tin từ 1 đến 2.500 ký tự.");
      d.content = text;
      if (action === "approveDraft") {
        d.status = "Đã gửi";
        o.messages.push({
          id: uid("TIN"),
          studentId: d.studentId,
          content: d.content,
          type: `${d.kind} · Đã duyệt`,
          created: now(),
        });
      }
    }
    value = d.id;
    label =
      action === "approveDraft"
        ? "Duyệt và gửi tin"
        : action === "saveDraft"
          ? "Lưu sửa bản nháp"
          : "Bỏ qua bản nháp";
    detail = d.id;
  } else if (action === "completeTask") {
    manager(user);
    const t = o.tasks.find((t) => t.id === p.id);
    ensure(
      t && t.status !== "Hoàn thành",
      "Công việc đã hoàn thành hoặc không tồn tại.",
    );
    t.status = "Hoàn thành";
    value = t.id;
    label = "Hoàn thành gọi hỏi thăm";
    detail = t.studentId;
  } else if (action === "settings") {
    manager(user);
    ensure(
      Number.isFinite(+p.discountRate) &&
        +p.discountRate >= 0 &&
        +p.discountRate <= 100 &&
        Number.isFinite(+p.reserveRate) &&
        +p.reserveRate >= 0 &&
        +p.reserveRate <= 100,
      "Tỷ lệ phải từ 0 đến 100%.",
    );
    o.settings = { discountRate: +p.discountRate, reserveRate: +p.reserveRate };
    value = "settings";
    label = "Cập nhật cài đặt";
    detail = `Ưu đãi ${p.discountRate}% · Quỹ dự phòng ${p.reserveRate}%`;
  } else if (action === "subject") {
    manager(user);
    const sub = o.subjects.find((s) => s.id === p.id);
    ensure(
      sub && Number.isSafeInteger(+p.price) && +p.price > 0,
      "Đơn giá không hợp lệ.",
    );
    sub.price = +p.price;
    value = sub.id;
    label = "Cập nhật danh mục môn";
    detail = `${sub.name} · ${money(sub.price)}/buổi; áp dụng lớp tạo mới`;
  } else if (action === "etl") {
    manager(user);
    value = "etl";
    label = "Chạy ETL";
    detail = "Nạp hai bảng sự kiện và năm bảng chiều; ẩn tên học viên.";
  } else throw new Error("Thao tác không được hỗ trợ.");
  o.revision++;
  log(o, user.name, label, detail);
  if (action === "etl") next.warehouse = buildWarehouse(o);
  return { state: next, value };
}
