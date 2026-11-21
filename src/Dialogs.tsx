import { useState, useEffect, type FormEvent, type ReactNode } from "react";
import {
  Plus,
  Check,
  BookOpen,
  Phone,
  Info,
  ShieldCheck,
  Wallet,
  Printer,
  Send,
  CalendarDays,
  Users,
  RefreshCw,
  UserRound,
  ReceiptText,
  SquarePen,
  Clock,
} from "lucide-react";
import QRCode from "qrcode";
import { useApp } from "./context";
import { Modal, Field, Avatar, Badge, Empty } from "./components";
import {
  today,
  dateLabel,
  dateTime,
  money,
  schedule,
  addDays,
} from "./utils.ts";
import { invoiceBalance, invoiceStatus, payrollTotal } from "./finance.ts";
import { pendingCheckins, minimumStudents } from "./domain.ts";
export default function Dialogs() {
  const { state, user, modal, setModal, act, reset, setPrintReceipt } =
    useApp();
  const o = state.ops;
  const initialCourse = o.courses.find((c) => c.id === modal?.data?.courseId);
  const [grade, setGrade] = useState(initialCourse?.grade || 9),
    [subject, setSubject] = useState("TOAN"),
    [price, setPrice] = useState(120000),
    [teacherId, setTeacherId] = useState("GV-1"),
    [adjust, setAdjust] = useState(0),
    [qr, setQr] = useState("");
  const currentInvoice = o.invoices.find((i) => i.id === modal?.id);
  useEffect(() => {
    if (modal?.type === "payment" && currentInvoice)
      QRCode.toDataURL(
        `DEMO TRI THUC VIET | ${currentInvoice.id} | ${invoiceBalance(o, currentInvoice)} VND`,
        { width: 220, margin: 1, color: { dark: "#243e67", light: "#ffffff" } },
      ).then(setQr);
  }, [modal?.id, o.receipts.length]);
  if (!modal) return null;
  let title = "",
    description = "",
    wide = false,
    body: ReactNode = null;
  const id = modal.id,
    data = modal.data;
  const close = () => setModal(null);
  function submit(
    e: FormEvent<HTMLFormElement>,
    action: string,
    transform?: (p: Record<string, any>, f: FormData) => Record<string, any>,
    message = "Đã lưu thay đổi.",
    onDone?: (value: string) => void,
  ) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      p = Object.fromEntries(f);
    const value = act(action, transform ? transform(p, f) : p, message);
    if (value) {
      if (onDone) onDone(value);
      else close();
    }
  }
  const buttons = (label = "Lưu thay đổi") => (
    <div className="modal-buttons">
      <button type="button" className="btn secondary" onClick={close}>
        Hủy
      </button>
      <button className="btn primary">
        <Check size={17} />
        {label}
      </button>
    </div>
  );
  if (modal.type === "student") {
    title = "Thêm hồ sơ học viên";
    description = "Thông tin nhập một lần, tự chảy sang lớp học và tài chính.";
    body = (
      <form
        onSubmit={(e) =>
          submit(
            e,
            "student",
            undefined,
            "Đã tạo hồ sơ và xếp lớp. Học phí tự sinh nếu lớp đang mở.",
          )
        }
      >
        <div className="form-grid">
          <Field label="Họ tên học viên *">
            <input
              name="name"
              required
              placeholder="Nguyễn Minh Khang"
              maxLength={100}
            />
          </Field>
          <Field label="Ngày sinh *">
            <input
              name="birth"
              type="date"
              required
              max={today()}
              defaultValue={`${Number(today().slice(0, 4)) - grade - 6}-08-08`}
            />
          </Field>
          <Field label="Khối lớp">
            <select
              name="grade"
              value={grade}
              onChange={(e) => setGrade(+e.target.value)}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i + 1}>
                  Khối {i + 1}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Trường đang học">
            <input name="school" placeholder="THCS Nguyễn Du" />
          </Field>
          <Field label="Họ tên phụ huynh *">
            <input name="parent" required placeholder="Nguyễn Thị Mai" />
          </Field>
          <Field label="Số Zalo phụ huynh *">
            <input
              name="zalo"
              type="tel"
              inputMode="tel"
              pattern="0[0-9]{9}"
              required
              placeholder="0901234567"
            />
          </Field>
          <Field label="Xếp lớp hoặc danh sách chờ" wide>
            <select
              name="courseId"
              key={grade}
              defaultValue={
                initialCourse?.grade === grade ? initialCourse.id : ""
              }
            >
              <option value="">Tạo hồ sơ trước, xếp lớp sau</option>
              {o.courses
                .filter((c) => c.grade === grade && c.status !== "Đã kết thúc")
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.status} · {schedule(c)}
                  </option>
                ))}
            </select>
          </Field>
        </div>
        <div className="form-note">
          <BookOpen size={18} />
          <p>
            Lớp dự kiến: chỉ thêm vào danh sách chờ. Khi đủ số tối thiểu và bấm
            Mở lớp, hệ thống mới sinh các buổi học và học phí.
          </p>
        </div>
        {buttons("Lưu hồ sơ & xếp lớp")}
      </form>
    );
  } else if (modal.type === "enroll") {
    const st = o.students.find((s) => s.id === id)!;
    title = "Xếp học viên vào lớp";
    description = `${st.name} · ${st.id} · Khối ${st.grade}`;
    const available = o.courses.filter(
      (c) =>
        c.grade === st.grade &&
        c.status !== "Đã kết thúc" &&
        !o.enrollments.some(
          (e) => e.studentId === st.id && e.courseId === c.id,
        ),
    );
    body = available.length ? (
      <form
        onSubmit={(e) =>
          submit(
            e,
            "enroll",
            (p) => ({ ...p, studentId: st.id }),
            "Đã xếp lớp. Danh sách lớp và học phí đã tự liên thông.",
          )
        }
      >
        <Field label="Lớp cùng khối">
          <select name="courseId" required>
            {available.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.status} ·{" "}
                {o.enrollments.filter((e) => e.courseId === c.id).length}/
                {c.capacity} học viên
              </option>
            ))}
          </select>
        </Field>
        <div className="form-note">
          <Info size={18} />
          <p>
            Ưu đãi nhiều môn {o.settings.discountRate}% áp dụng cho khoản thu
            mới khi học viên đang học từ hai môn. Lớp dự kiến chưa tạo khoản
            thu.
          </p>
        </div>
        {buttons("Xác nhận xếp lớp")}
      </form>
    ) : (
      <Empty
        title="Chưa có lớp cùng khối còn phù hợp"
        description="Học viên đã có trong các lớp hiện tại, hoặc cần tạo một lớp dự kiến mới."
      />
    );
  } else if (modal.type === "studentDetail") {
    const st = o.students.find((s) => s.id === id)!;
    title = st.name;
    description = `${st.id} · Khối ${st.grade} · Sinh ngày ${dateLabel(st.birth)}`;
    wide = true;
    const enrollments = o.enrollments.filter((e) => e.studentId === st.id);
    const attendance = o.attendance.filter((a) => a.studentId === st.id);
    const present = attendance.filter((a) => a.status !== "Vắng").length;
    const scores = attendance
      .filter((a) => a.score !== null)
      .map((a) => a.score!);
    const debt = o.invoices
      .filter((i) => i.studentId === st.id)
      .reduce((a, i) => a + invoiceBalance(o, i), 0);
    body = (
      <>
        <div className="profile-head">
          <Avatar name={st.name} />
          <div>
            <strong>{st.parent}</strong>
            <p>
              <Phone size={14} />
              {st.zalo} · {st.school || "Chưa cập nhật trường"}
            </p>
          </div>
          <Badge>{st.status}</Badge>
        </div>
        <div className="profile-metrics">
          <div>
            <strong>
              {attendance.length
                ? Math.round((present / attendance.length) * 100) + "%"
                : "—"}
            </strong>
            <span>Chuyên cần đã ghi nhận</span>
          </div>
          <div>
            <strong>{scores.at(-1) ?? "—"}</strong>
            <span>Điểm gần nhất</span>
          </div>
          <div>
            <strong>{money(debt)}</strong>
            <span>Còn nợ học phí</span>
          </div>
        </div>
        <h3 className="section-title">Lớp đã đăng ký</h3>
        {enrollments.map((e) => {
          const c = o.courses.find((c) => c.id === e.courseId)!;
          return (
            <div className="profile-class" key={e.id}>
              <span className="icon-box blue">
                <BookOpen size={20} />
              </span>
              <div>
                <strong>{c.name}</strong>
                <p>
                  {schedule(c)} · Đến {dateLabel(c.end)}
                </p>
              </div>
              <Badge>{e.status}</Badge>
            </div>
          );
        })}
        <button
          className="btn secondary full"
          onClick={() => setModal({ type: "enroll", id: st.id })}
        >
          <Plus size={16} />
          Xếp thêm lớp
        </button>
        <h3 className="section-title">Trạng thái & chăm sóc</h3>
        <form
          onSubmit={(e) =>
            submit(
              e,
              "studentStatus",
              (p) => ({ ...p, id: st.id }),
              "Đã cập nhật trạng thái học viên.",
            )
          }
        >
          <div className="form-grid">
            <Field label="Trạng thái">
              <select name="status" defaultValue={st.status}>
                {[
                  "Tiềm năng",
                  "Chờ lớp",
                  "Đang học",
                  "Sắp hết khóa",
                  "Học tiếp",
                  "Đã nghỉ",
                ].map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </Field>
            <Field label="Lý do nghỉ (bắt buộc nếu đã nghỉ)">
              <input
                name="reason"
                defaultValue={st.leaveReason}
                placeholder="Ghi rõ lý do để theo dõi"
              />
            </Field>
          </div>
          <div className="modal-buttons">
            <button className="btn secondary small">Cập nhật trạng thái</button>
          </div>
        </form>
        <h3 className="section-title">Lịch sử tin nhắn</h3>
        {o.messages
          .filter((m) => m.studentId === st.id)
          .toReversed()
          .map((m) => (
            <div className="history-note" key={m.id}>
              <Badge>{m.type}</Badge>
              <small>{dateTime(m.created)}</small>
              <p>{m.content}</p>
            </div>
          ))}
        {!o.messages.some((m) => m.studentId === st.id) && (
          <p className="muted">Chưa có tin nhắn đã gửi.</p>
        )}
      </>
    );
  } else if (modal.type === "teacher") {
    title = "Thêm giáo viên";
    description =
      "Người dùng giáo viên được tạo cùng hồ sơ để chuyển vai trò ngay.";
    body = (
      <form
        onSubmit={(e) =>
          submit(
            e,
            "teacher",
            (p, f) => ({ ...p, subjectIds: f.getAll("subjectIds") }),
            "Đã thêm giáo viên. Có thể chọn người này ở thanh trên.",
          )
        }
      >
        <div className="form-grid">
          <Field label="Họ tên giáo viên *" wide>
            <input name="name" required placeholder="Nguyễn Văn Hòa" />
          </Field>
          <Field label="Lương mỗi buổi (đ) *">
            <input
              name="rate"
              type="number"
              min="1"
              step="1"
              defaultValue="300000"
              required
            />
          </Field>
          <Field label="Số điện thoại">
            <input name="phone" type="tel" placeholder="0901234567" />
          </Field>
          <div className="field wide">
            <span>Môn được phân công *</span>
            <div className="checkbox-row">
              {o.subjects.map((s, i) => (
                <label key={s.id}>
                  <input
                    name="subjectIds"
                    type="checkbox"
                    value={s.id}
                    defaultChecked={i === 0}
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </div>
        </div>
        {buttons("Thêm giáo viên")}
      </form>
    );
  } else if (modal.type === "teacherDetail") {
    const t = o.teachers.find((t) => t.id === id)!;
    const month = data.month;
    const checks = o.checkins.filter(
      (c) => c.teacherId === t.id && c.date.startsWith(month),
    );
    title = t.name;
    description = `${t.id} · ${money(t.rate)}/buổi · Tháng ${month.split("-").reverse().join("/")}`;
    wide = true;
    body = (
      <>
        <div className="profile-metrics">
          <div>
            <strong>{checks.length}</strong>
            <span>Buổi check-in trong tháng</span>
          </div>
          <div>
            <strong>{money(checks.reduce((a, c) => a + c.rate, 0))}</strong>
            <span>Lương cơ bản theo buổi</span>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>BUỔI HỌC</th>
                <th>LỚP</th>
                <th>NGÀY TÍNH LƯƠNG</th>
                <th>LƯƠNG BUỔI</th>
              </tr>
            </thead>
            <tbody>
              {checks.toReversed().map((c) => {
                const l = o.lessons.find((l) => l.id === c.lessonId)!;
                return (
                  <tr key={c.id}>
                    <td>
                      {dateLabel(l.date)}
                      {c.simulated && <small>Giả lập thời gian</small>}
                      {l.substituteNote && (
                        <small>Dạy thay: {l.substituteNote}</small>
                      )}
                    </td>
                    <td>
                      {
                        o.courses.find((course) => course.id === l.courseId)
                          ?.name
                      }
                    </td>
                    <td>{dateLabel(c.date)}</td>
                    <td className="amount">{money(c.rate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!checks.length && (
          <Empty title="Chưa có buổi đã check-in trong tháng" />
        )}
      </>
    );
  } else if (modal.type === "payroll") {
    const t = o.teachers.find((t) => t.id === id)!;
    const checks = pendingCheckins(o, t.id, data.month);
    const base = checks.reduce((a, c) => a + c.rate, 0);
    title = "Lập bảng lương tháng";
    description = `${t.name} · ${data.month.split("-").reverse().join("/")}`;
    body = (
      <form
        onSubmit={(e) =>
          submit(
            e,
            "createPayroll",
            (p) => ({ ...p, teacherId: t.id, month: data.month }),
            "Đã lập bảng lương nháp. Duyệt để tạo khoản chi tự động.",
          )
        }
      >
        <div className="payroll-preview">
          <div>
            <span>Buổi check-in chưa lập lương</span>
            <b>{checks.length} buổi</b>
          </div>
          <div>
            <span>Lương cơ bản</span>
            <b>{money(base)}</b>
          </div>
          <div className="total">
            <span>Tổng lương dự kiến</span>
            <strong>{money(base + adjust)}</strong>
          </div>
        </div>
        <div className="form-grid">
          <Field label="Điều chỉnh thưởng / khấu trừ (đ)">
            <input
              name="adjustment"
              type="number"
              step="1"
              min={-base}
              value={adjust}
              onChange={(e) => setAdjust(+e.target.value)}
            />
          </Field>
          <Field label="Ghi chú điều chỉnh">
            <input
              name="note"
              required={adjust !== 0}
              placeholder="Bắt buộc nếu có điều chỉnh"
            />
          </Field>
        </div>
        <div className="form-note">
          <ShieldCheck size={18} />
          <p>
            Mỗi check-in chỉ được đưa vào một bảng lương. Bảng bổ sung có thể
            lập cho các buổi mới phát sinh sau đó.
          </p>
        </div>
        {buttons("Tạo bảng lương nháp")}
      </form>
    );
  } else if (modal.type === "course") {
    title = "Tạo lớp dự kiến";
    description =
      "Chưa sinh buổi học hoặc khoản thu cho đến khi đủ điều kiện và bấm Mở lớp.";
    const teacher = o.teachers.find((t) => t.id === teacherId);
    body = (
      <form
        onSubmit={(e) =>
          submit(
            e,
            "course",
            (p, f) => ({ ...p, days: f.getAll("days") }),
            "Đã tạo lớp dự kiến để tiếp nhận danh sách chờ.",
          )
        }
      >
        <div className="form-grid">
          <Field label="Tên lớp *" wide>
            <input name="name" required placeholder="Toán 9 · Khóa mới" />
          </Field>
          <Field label="Môn học">
            <select
              name="subjectId"
              value={subject}
              onChange={(e) => {
                const id = e.target.value;
                setSubject(id);
                setPrice(o.subjects.find((s) => s.id === id)!.price);
                setTeacherId(
                  o.teachers.find((t) => t.subjectIds.includes(id))!.id,
                );
              }}
            >
              {o.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Khối lớp">
            <select name="grade" defaultValue="9">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i + 1}>
                  Khối {i + 1}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Giáo viên phụ trách" wide>
            <select
              name="teacherId"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
            >
              {o.teachers
                .filter((t) => t.subjectIds.includes(subject))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} · {money(t.rate)}/buổi
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Đơn giá mỗi buổi (đ)">
            <input
              name="price"
              type="number"
              required
              min="1"
              step="1"
              value={price}
              onChange={(e) => setPrice(+e.target.value)}
            />
          </Field>
          <Field label="Số buổi">
            <input
              name="sessions"
              type="number"
              min="1"
              max="100"
              required
              defaultValue="16"
            />
          </Field>
          <Field label="Sĩ số tối đa">
            <input
              name="capacity"
              type="number"
              min="1"
              max="100"
              required
              defaultValue="16"
            />
          </Field>
          <Field label="Ngày bắt đầu dự kiến">
            <input
              name="start"
              type="date"
              min={today()}
              required
              defaultValue={addDays(today(), 2)}
            />
          </Field>
          <Field label="Giờ học" wide>
            <input name="time" required defaultValue="18:00-19:30" />
          </Field>
          <div className="field wide">
            <span>Ngày học trong tuần</span>
            <div className="weekday-options">
              {[1, 2, 3, 4, 5, 6, 0].map((n) => (
                <label key={n}>
                  <input
                    type="checkbox"
                    name="days"
                    value={n}
                    defaultChecked={n === 2 || n === 4}
                  />
                  <span>{n === 0 ? "CN" : `T${n + 1}`}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="form-note">
          <Users size={18} />
          <p>
            Tối thiểu để bù lương:{" "}
            <strong>
              {price > 0 && teacher ? Math.ceil(teacher.rate / price) : "—"} học
              viên
            </strong>
            . Kiểm tra trùng lịch khi mở lớp.
          </p>
        </div>
        {buttons("Tạo lớp dự kiến")}
      </form>
    );
  } else if (modal.type === "courseDetail") {
    const c = o.courses.find((c) => c.id === id)!;
    const e = o.enrollments.filter((e) => e.courseId === c.id);
    const lessons = o.lessons.filter((l) => l.courseId === c.id);
    title = c.name;
    description = `${schedule(c)} · ${dateLabel(c.start)} — ${dateLabel(c.end)}`;
    wide = true;
    body = (
      <>
        <div className="course-detail-info">
          <span>
            <UserRound size={17} />
            {o.teachers.find((t) => t.id === c.teacherId)?.name}
          </span>
          <span>
            <Users size={17} />
            {e.length}/{c.capacity} học viên
          </span>
          <span>
            <Wallet size={17} />
            {money(c.price)}/buổi
          </span>
          <Badge>{c.status}</Badge>
        </div>
        {c.status === "Dự kiến" && (
          <div className="form-note">
            <Info size={18} />
            <p>
              Đã có {e.length}/{minimumStudents(o, c)} học viên tối thiểu. Chờ
              quản lý bấm Mở lớp để sinh lịch và học phí.
            </p>
          </div>
        )}
        <h3 className="section-title">Học viên & tình trạng học phí</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>HỌC VIÊN</th>
                <th>PHẢI THU</th>
                <th>ĐÃ ĐÓNG</th>
                <th>CÒN NỢ</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {e.map((en, i) => {
                const st = o.students.find((s) => s.id === en.studentId)!;
                const inv = o.invoices.find((x) => x.enrollmentId === en.id);
                const debt = inv ? invoiceBalance(o, inv) : 0;
                return (
                  <tr key={en.id}>
                    <td>
                      <div className="person">
                        <Avatar name={st.name} index={i} />
                        <span>
                          <strong>{st.name}</strong>
                          <small>{st.id}</small>
                        </span>
                      </div>
                    </td>
                    <td>{inv ? money(inv.amount) : "Chưa phát sinh"}</td>
                    <td>{inv ? money(inv.amount - debt) : "—"}</td>
                    <td>
                      {inv ? (
                        <>
                          <span className={debt ? "warning" : ""}>
                            {money(debt)}
                          </span>
                          <small>
                            <Badge>{invoiceStatus(o, inv)}</Badge>
                          </small>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {inv && debt > 0 && (
                        <button
                          className="table-btn"
                          onClick={() =>
                            act(
                              "reminder",
                              { invoiceId: inv.id },
                              "Đã tạo tin nhắc học phí chờ quản lý duyệt ở Tác tử AI.",
                            )
                          }
                        >
                          Gửi lại thông báo
                        </button>
                      )}
                      {inv && user.role === "manager" && (
                        <button
                          className="text-btn"
                          onClick={() =>
                            setModal({ type: "payment", id: inv.id })
                          }
                        >
                          Chi tiết khoản thu
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {user.role === "teacher" && (
          <div className="form-note">
            <ShieldCheck size={18} />
            <p>
              Giáo viên được xem học phí và yêu cầu gửi lại thông báo. Chỉ quản
              lý được ghi nhận thu và duyệt tin; tiền không đi qua tay giáo
              viên.
            </p>
          </div>
        )}
        {lessons.length > 0 && (
          <>
            <h3 className="section-title">Lịch từng buổi & người dạy</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>NGÀY</th>
                    <th>GIÁO VIÊN</th>
                    <th>CHECK-IN</th>
                    {user.role === "manager" && <th />}
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((l) => {
                    const ck = o.checkins.find((ck) => ck.lessonId === l.id);
                    return (
                      <tr key={l.id}>
                        <td>{dateLabel(l.date)}</td>
                        <td>
                          {o.teachers.find((t) => t.id === l.teacherId)?.name}
                          {l.substituteNote && (
                            <small>Dạy thay · {l.substituteNote}</small>
                          )}
                        </td>
                        <td>
                          <Badge tone={ck ? "green" : "gray"}>
                            {ck ? "Đã check-in" : "Chưa check-in"}
                          </Badge>
                        </td>
                        {user.role === "manager" && (
                          <td>
                            <button
                              className="table-btn"
                              disabled={!!ck}
                              onClick={() =>
                                setModal({ type: "substitute", id: l.id })
                              }
                            >
                              Dạy thay
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </>
    );
  } else if (modal.type === "substitute") {
    const lesson = o.lessons.find((l) => l.id === id)!;
    const c = o.courses.find((c) => c.id === lesson.courseId)!;
    title = "Phân công dạy thay";
    description = `${c.name} · ${dateLabel(lesson.date)} · ${c.time}`;
    body = (
      <form
        onSubmit={(e) =>
          submit(
            e,
            "substitute",
            (p) => ({ ...p, lessonId: lesson.id }),
            "Đã đổi người dạy. Buổi này sẽ tính lương cho người check-in được phân công.",
          )
        }
      >
        <div className="form-grid">
          <Field label="Giáo viên thay" wide>
            <select name="teacherId">
              {o.teachers
                .filter(
                  (t) =>
                    t.subjectIds.includes(c.subjectId) &&
                    t.id !== lesson.teacherId,
                )
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} · {money(t.rate)}/buổi
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Lý do dạy thay *" wide>
            <input
              name="note"
              required
              placeholder="Giáo viên chính bận công tác"
            />
          </Field>
        </div>
        {buttons("Xác nhận dạy thay")}
      </form>
    );
  } else if (modal.type === "payment") {
    const inv = currentInvoice!;
    const st = o.students.find((s) => s.id === inv.studentId)!;
    const remaining = invoiceBalance(o, inv);
    title = "Chi tiết học phí & ghi nhận thu";
    description = `${st.name} · ${inv.id}`;
    body = (
      <>
        <div className="payment-grid">
          <div className="payment-breakdown">
            <h3>{o.courses.find((c) => c.id === inv.courseId)?.name}</h3>
            <p>
              <span>Học phí gốc</span>
              <strong>{money(inv.gross)}</strong>
            </p>
            <p>
              <span>Ưu đãi</span>
              <strong>− {money(inv.discount)}</strong>
            </p>
            <p>
              <span>Phải thu</span>
              <strong>{money(inv.amount)}</strong>
            </p>
            <p>
              <span>Đã thu</span>
              <strong>{money(inv.amount - remaining)}</strong>
            </p>
            <p className="total">
              <span>Còn phải thu</span>
              <strong>{money(remaining)}</strong>
            </p>
            <small>Hạn đóng {dateLabel(inv.due)}</small>
          </div>
          <div className="qr-box">
            {qr && (
              <img
                src={qr}
                alt={`QR minh họa ${inv.id}`}
                width="180"
                height="180"
              />
            )}
            <Badge tone="amber">QR thanh toán giả lập</Badge>
            <p>
              {inv.id}
              <br />
              Không chuyển khoản thật
            </p>
          </div>
        </div>
        {remaining > 0 && user.role === "manager" && (
          <form
            onSubmit={(e) =>
              submit(
                e,
                "payment",
                (p) => ({ ...p, invoiceId: inv.id }),
                "Đã lập phiếu thu và gửi xác nhận giả lập cho phụ huynh.",
                (value) => {
                  setModal({ type: "payment", id: inv.id });
                },
              )
            }
          >
            <div className="form-grid">
              <Field label="Số tiền thu (đ) *">
                <input
                  name="amount"
                  key={remaining}
                  type="number"
                  step="1"
                  required
                  min="1"
                  max={remaining}
                  defaultValue={remaining}
                />
              </Field>
              <Field label="Hình thức">
                <select name="method">
                  <option>Chuyển khoản</option>
                  <option>Tiền mặt</option>
                </select>
              </Field>
            </div>
            <div className="modal-buttons">
              <button className="btn primary">
                <ReceiptText size={17} />
                Xác nhận & lập phiếu thu
              </button>
            </div>
          </form>
        )}
        <h3 className="section-title">Phiếu thu đã ghi nhận</h3>
        {o.receipts
          .filter((r) => r.invoiceId === inv.id)
          .map((r) => (
            <div className="receipt-line" key={r.id}>
              <ReceiptText size={18} />
              <span>
                <strong>{r.id}</strong>
                <small>
                  {dateLabel(r.date)} · {r.method}
                </small>
              </span>
              <b>{money(r.amount)}</b>
              <button
                className="icon-btn"
                aria-label={`In phiếu ${r.id}`}
                onClick={() => {
                  setPrintReceipt(r.id);
                  setTimeout(() => window.print(), 60);
                }}
              >
                <Printer size={18} />
              </button>
            </div>
          ))}
        {!o.receipts.some((r) => r.invoiceId === inv.id) && (
          <p className="muted">Chưa có phiếu thu.</p>
        )}
      </>
    );
  } else if (modal.type === "expense") {
    title = "Thêm khoản chi";
    description =
      "Khoản chi lương được sinh từ bảng lương. Biểu mẫu này dành cho chi phí chung.";
    body = (
      <form
        onSubmit={(e) =>
          submit(
            e,
            "expense",
            undefined,
            "Đã ghi nhận khoản chi và cập nhật lãi lỗ nghiệp vụ.",
          )
        }
      >
        <div className="form-grid">
          <Field label="Loại chi">
            <select name="category">
              {["Mặt bằng", "Điện nước", "Quảng cáo", "Thiết bị", "Khác"].map(
                (s) => (
                  <option key={s}>{s}</option>
                ),
              )}
            </select>
          </Field>
          <Field label="Số tiền (đ) *">
            <input name="amount" type="number" min="1" step="1" required />
          </Field>
          <Field label="Ngày chi">
            <input
              name="date"
              type="date"
              defaultValue={today()}
              max={today()}
              required
            />
          </Field>
          <Field label="Nội dung chi *" wide>
            <textarea
              name="description"
              rows={3}
              required
              placeholder="Ghi rõ mục đích khoản chi"
            />
          </Field>
        </div>
        {buttons("Ghi nhận khoản chi")}
      </form>
    );
  } else if (modal.type === "draft") {
    const draft = o.drafts.find((d) => d.id === id)!;
    title = "Xem lại lời nhắn trước khi gửi";
    description = `Phụ huynh ${o.students.find((s) => s.id === draft.studentId)?.name} · ${draft.kind}`;
    body = (
      <form
        onSubmit={(e) =>
          submit(
            e,
            "approveDraft",
            (p) => ({ ...p, id: draft.id }),
            "Đã duyệt và gửi tin vào điện thoại phụ huynh giả lập.",
          )
        }
      >
        <Field label="Nội dung tin nhắn">
          <textarea
            name="content"
            rows={8}
            required
            maxLength={2500}
            defaultValue={draft.content}
          />
        </Field>
        <div className="form-note">
          <ShieldCheck size={18} />
          <p>
            Đây là điểm kiểm soát của quản lý. Dữ liệu trong bản nháp theo thời
            điểm ETL; bạn kiểm tra và chỉnh sửa trước khi duyệt.
          </p>
        </div>
        <div className="modal-buttons">
          <button type="button" className="btn secondary" onClick={close}>
            Quay lại
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={(e) => {
              const form = e.currentTarget.form!;
              const text = new FormData(form).get("content");
              if (
                act(
                  "saveDraft",
                  { id: draft.id, content: text },
                  "Đã lưu chỉnh sửa, tin vẫn chờ duyệt.",
                )
              )
                close();
            }}
          >
            <SquarePen size={16} />
            Lưu nháp
          </button>
          <button className="btn primary">
            <Send size={16} />
            Duyệt và gửi
          </button>
        </div>
      </form>
    );
  } else if (modal.type === "subject") {
    const sub = o.subjects.find((s) => s.id === id)!;
    title = `Đơn giá mặc định môn ${sub.name}`;
    description =
      "Chỉ áp dụng cho lớp tạo mới. Không tự sửa số tiền các khoản phải thu hiện có.";
    body = (
      <form
        onSubmit={(e) =>
          submit(
            e,
            "subject",
            (p) => ({ ...p, id: sub.id }),
            "Đã cập nhật đơn giá mặc định.",
          )
        }
      >
        <Field label="Đơn giá mỗi buổi (đ)">
          <input
            name="price"
            type="number"
            min="1"
            step="1"
            required
            defaultValue={sub.price}
          />
        </Field>
        {buttons()}
      </form>
    );
  } else if (modal.type === "reset") {
    title = "Khôi phục dữ liệu mẫu phiên bản 2?";
    description =
      "Thao tác này thay thế dữ liệu demo của phiên bản 2 đang lưu trong trình duyệt.";
    body = (
      <>
        <div className="form-note">
          <RefreshCw size={22} />
          <p>
            Hồ sơ, phiếu thu, lớp mới, bảng lương, bản nháp và tin nhắn bạn đã
            tạo trong bản demo này sẽ được thay bằng dữ liệu mẫu mới theo ngày
            hôm nay. Dữ liệu bản Lumina dùng khóa lưu trữ riêng.
          </p>
        </div>
        <div className="modal-buttons">
          <button className="btn secondary" onClick={close}>
            Giữ dữ liệu hiện tại
          </button>
          <button className="btn primary" onClick={reset}>
            Khôi phục dữ liệu mẫu
          </button>
        </div>
      </>
    );
  } else if (modal.type === "guide") {
    title = "Kịch bản bảo vệ · Khoảng 6 phút";
    description =
      "Đổi người dùng ở thanh trên để đi trọn luồng, không cần đăng nhập.";
    wide = true;
    body = (
      <ol className="demo-guide">
        <li>
          <strong>Anh Minh — Giáo viên & lương:</strong> thêm giáo viên mới, môn
          Toán, lương 300.000 đ/buổi. Vào Lớp học, tìm “Toán 9 · Khóa mới”, hiện
          2/3 tối thiểu.
        </li>
        <li>
          <strong>Học viên:</strong> thêm hồ sơ kèm phụ huynh, chọn lớp trên.
          Quay lại Lớp học: đủ 3/3, bấm Mở lớp. Xem 16 buổi và ba khoản phải thu
          tự sinh.
        </li>
        <li>
          <strong>Chọn Nguyễn Thu Hà:</strong> vào Buổi học, bật Giả lập thời
          gian và chọn buổi đầu của Toán 9 · Khóa mới. Check-in, đánh vắng một
          em rồi lưu. Mở Điện thoại phụ huynh để xem tin.
        </li>
        <li>
          <strong>Giáo viên mở chi tiết lớp:</strong> xem học phí, bấm Gửi lại
          thông báo (tạo nháp chờ duyệt). Chuyển Anh Minh, vào Tài chính ghi
          nhận thu và in phiếu; phụ huynh nhận xác nhận tự động.
        </li>
        <li>
          <strong>Giáo viên & lương:</strong> số buổi check-in đã tăng. Lập bảng
          lương, duyệt; Tài chính tự có khoản chi. Mở Lãi lỗ & phân chia để xem
          lớp lỗ, quỹ dự phòng và phần ba người chủ.
        </li>
        <li>
          <strong>Kho dữ liệu:</strong> bấm Chạy ETL, xem Phân tích và rủi ro.
          Vào Tác tử AI, chạy chăm sóc và xem từng bước. Sửa bản nháp của Nguyễn
          Minh An rồi duyệt; tin hiện trong điện thoại. Mở Nhật ký để thấy tên
          người và Tác tử AI.
        </li>
      </ol>
    );
  }
  return (
    <Modal title={title} description={description} wide={wide}>
      {body}
    </Modal>
  );
}
