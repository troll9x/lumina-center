import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Users,
  BookOpen,
  CalendarDays,
  Clock,
  Check,
  CheckCheck,
  UserRound,
  Wallet,
  FileText,
  Phone,
  CalendarCheck,
  ShieldCheck,
  UserRoundPlus,
  SquarePen,
} from "lucide-react";
import { useApp } from "../context";
import { Badge, Avatar, Panel, PageHeader, Metric, Empty } from "../components";
import {
  money,
  compactMoney,
  today,
  dateLabel,
  schedule,
  normalize,
} from "../utils.ts";
import { invoiceBalance, invoiceStatus, payrollTotal } from "../finance.ts";
import {
  minimumStudents,
  pendingCheckins,
  belongsToTeacher,
} from "../domain.ts";

export function StudentsPage() {
  const { state, setModal } = useApp(),
    o = state.ops;
  const [q, setQ] = useState(""),
    [status, setStatus] = useState("Tất cả");
  const rows = o.students.filter(
    (s) =>
      normalize(s.name + " " + s.id + " " + s.parent).includes(normalize(q)) &&
      (status === "Tất cả" || s.status === status),
  );
  return (
    <>
      <PageHeader
        eyebrow="PHÂN HỆ HỌC VIÊN"
        title="Mỗi học viên, một hành trình"
        description="Hồ sơ, lớp học và phụ huynh được kết nối trong một nơi."
      >
        <button
          className="btn primary"
          onClick={() => setModal({ type: "student" })}
        >
          <Plus size={18} />
          Thêm học viên
        </button>
      </PageHeader>
      <div className="stat-strip">
        <span>
          <b>{o.students.length}</b> Tổng học viên
        </span>
        <span>
          <b>
            {
              o.students.filter((s) =>
                ["Đang học", "Sắp hết khóa", "Học tiếp"].includes(s.status),
              ).length
            }
          </b>{" "}
          Đang học
        </span>
        <span>
          <b>{o.students.filter((s) => s.status === "Chờ lớp").length}</b> Đang
          chờ lớp
        </span>
        <span>
          <b>{o.students.filter((s) => s.status === "Đã nghỉ").length}</b> Đã
          nghỉ
        </span>
      </div>
      <section className="panel">
        <div className="toolbar">
          <div className="search">
            <Search size={18} />
            <input
              aria-label="Tìm học viên"
              placeholder="Tìm tên, mã học viên hoặc phụ huynh..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            aria-label="Lọc trạng thái học viên"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {[
              "Tất cả",
              "Tiềm năng",
              "Chờ lớp",
              "Đang học",
              "Sắp hết khóa",
              "Học tiếp",
              "Đã nghỉ",
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <span className="toolbar-count">{rows.length} hồ sơ</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>HỌC VIÊN</th>
                <th>LỚP HỌC</th>
                <th>PHỤ HUYNH</th>
                <th>TRẠNG THÁI</th>
                <th>CÔNG NỢ</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.toReversed().map((s, i) => {
                const classes = o.enrollments
                  .filter(
                    (e) => e.studentId === s.id && e.status !== "Hoàn thành",
                  )
                  .map((e) => o.courses.find((c) => c.id === e.courseId)!);
                const debt = o.invoices
                  .filter((x) => x.studentId === s.id)
                  .reduce((a, x) => a + invoiceBalance(o, x), 0);
                return (
                  <tr key={s.id}>
                    <td>
                      <button
                        className="person"
                        onClick={() =>
                          setModal({ type: "studentDetail", id: s.id })
                        }
                      >
                        <Avatar name={s.name} index={i} />
                        <span>
                          <strong>{s.name}</strong>
                          <small>
                            {s.id} · Khối {s.grade}
                          </small>
                        </span>
                      </button>
                    </td>
                    <td>
                      {classes[0]?.name || "Chưa xếp lớp"}
                      {classes.length > 1 && (
                        <small>+{classes.length - 1} lớp khác</small>
                      )}
                    </td>
                    <td>
                      {s.parent}
                      <small>{s.zalo}</small>
                    </td>
                    <td>
                      <Badge>{s.status}</Badge>
                    </td>
                    <td className={debt ? "amount warning" : "muted"}>
                      {debt ? money(debt) : "Không còn nợ"}
                    </td>
                    <td>
                      <button
                        className="table-btn"
                        onClick={() => setModal({ type: "enroll", id: s.id })}
                      >
                        Xếp lớp
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <Empty
            title="Không tìm thấy học viên"
            description="Thử thay đổi từ khóa hoặc bộ lọc."
          />
        )}
        <footer className="table-footer">
          {rows.length} hồ sơ · Tự động liên thông với lớp học và tài chính
        </footer>
      </section>
    </>
  );
}

export function CoursesPage() {
  const { state, user, setModal, act } = useApp(),
    o = state.ops;
  const [status, setStatus] = useState("Tất cả"),
    [q, setQ] = useState("");
  const rows = o.courses.filter(
    (c) =>
      belongsToTeacher(o, user, c.id) &&
      (status === "Tất cả" || c.status === status) &&
      normalize(c.name).includes(normalize(q)),
  );
  const manager = user.role === "manager";
  return (
    <>
      <PageHeader
        eyebrow="PHÂN HỆ ĐÀO TẠO"
        title="Lớp học & lộ trình"
        description={
          manager
            ? "Từ danh sách chờ đến lớp học đủ điều kiện vận hành."
            : "Các lớp được phân công, học viên và tình trạng học phí."
        }
      >
        {manager && (
          <button
            className="btn primary"
            onClick={() => setModal({ type: "course" })}
          >
            <Plus size={18} />
            Tạo lớp dự kiến
          </button>
        )}
      </PageHeader>
      <div className="toolbar plain">
        <div className="search">
          <Search size={18} />
          <input
            aria-label="Tìm lớp học"
            placeholder="Tìm tên lớp học..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="segment">
          {["Tất cả", "Dự kiến", "Đang mở", "Đã kết thúc"].map((s) => (
            <button
              key={s}
              className={status === s ? "selected" : ""}
              onClick={() => setStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="course-grid">
        {rows.map((c, i) => {
          const count = o.enrollments.filter((e) => e.courseId === c.id).length,
            min = minimumStudents(o, c),
            ready = count >= min;
          return (
            <article
              key={c.id}
              className={`course-card ${c.status === "Dự kiến" ? "planned" : ""}`}
            >
              <div className="course-card-head">
                <span
                  className={`icon-box ${["blue", "purple", "teal", "orange"][i % 4]}`}
                >
                  <BookOpen size={24} />
                </span>
                <Badge>{c.status}</Badge>
              </div>
              <h2>{c.name}</h2>
              <p className="code-line">
                {c.id} · Khối {c.grade}
              </p>
              <div className="course-lines">
                <span>
                  <UserRound size={16} />
                  {o.teachers.find((t) => t.id === c.teacherId)?.name}
                </span>
                <span>
                  <CalendarDays size={16} />
                  {schedule(c)}
                </span>
                <span>
                  <Clock size={16} />
                  {dateLabel(c.start)} — {dateLabel(c.end)}
                </span>
                <span>
                  <Wallet size={16} />
                  {money(c.price)}/buổi · {c.sessions} buổi
                </span>
              </div>
              {c.status === "Dự kiến" ? (
                <div className={`break-even ${ready ? "ready" : ""}`}>
                  <div>
                    <Users size={17} />
                    <strong>
                      Đã có {count}/{min} tối thiểu
                    </strong>
                  </div>
                  <p>
                    {ready
                      ? "Đã đủ học viên để bù lương mỗi buổi."
                      : `Còn thiếu ${min - count} học viên để mở lớp.`}
                  </p>
                  <div className="progress">
                    <i
                      style={{
                        width: `${Math.min(100, (count / min) * 100)}%`,
                      }}
                    />
                  </div>
                  <small>
                    ⌈{money(o.teachers.find((t) => t.id === c.teacherId)!.rate)}{" "}
                    ÷ {money(c.price)}⌉ = {min} học viên
                  </small>
                </div>
              ) : (
                <div className="capacity">
                  <span>Sĩ số hiện tại</span>
                  <b>
                    {count}
                    <small> / {c.capacity}</small>
                  </b>
                  <div className="progress">
                    <i style={{ width: `${(count / c.capacity) * 100}%` }} />
                  </div>
                </div>
              )}
              <div className="course-actions">
                <button
                  className="text-btn"
                  onClick={() => setModal({ type: "courseDetail", id: c.id })}
                >
                  Xem chi tiết
                </button>
                {manager && c.status === "Dự kiến" && (
                  <>
                    <button
                      className="icon-btn"
                      aria-label={`Thêm học viên vào ${c.name}`}
                      onClick={() =>
                        setModal({ type: "student", data: { courseId: c.id } })
                      }
                    >
                      <UserRoundPlus size={18} />
                    </button>
                    <button
                      className="btn primary small"
                      disabled={!ready}
                      title={
                        ready
                          ? "Mở lớp và tự tạo lịch, học phí"
                          : "Chưa đủ số học viên tối thiểu"
                      }
                      onClick={() =>
                        act(
                          "openCourse",
                          { id: c.id },
                          "Đã mở lớp: sinh đủ buổi học và học phí cho danh sách chờ.",
                        )
                      }
                    >
                      Mở lớp
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {!rows.length && <Empty title="Chưa có lớp phù hợp" />}
    </>
  );
}

export function LessonsPage() {
  const { state, user, act } = useApp(),
    o = state.ops;
  const [simulate, setSimulate] = useState(true),
    [lessonId, setLessonId] = useState(""),
    [records, setRecords] = useState<
      Record<string, { status: string; score: string }>
    >({});
  const assigned = o.lessons
    .filter((l) => l.teacherId === user.teacherId)
    .toSorted((a, b) => a.date.localeCompare(b.date));
  const choices = assigned.filter((l) => simulate || l.date === today());
  const selected = choices.find((l) => l.id === lessonId);
  const c = o.courses.find((c) => c.id === selected?.courseId);
  const checked = o.checkins.find((x) => x.lessonId === selected?.id);
  const learners = o.enrollments
    .filter((e) => e.courseId === c?.id && e.status === "Đang học")
    .map((e) => o.students.find((s) => s.id === e.studentId)!);
  useEffect(() => {
    if (!choices.some((l) => l.id === lessonId)) {
      const next =
        choices.find(
          (l) =>
            !o.checkins.some((c) => c.lessonId === l.id) && l.date >= today(),
        ) ||
        choices.find((l) => l.date === today()) ||
        choices.at(-1);
      setLessonId(next?.id || "");
    }
  }, [user.id, simulate, state.ops.lessons.length]);
  useEffect(() => {
    const selected = o.lessons.find((l) => l.id === lessonId);
    const entries: Record<string, { status: string; score: string }> = {};
    o.enrollments
      .filter(
        (e) => e.courseId === selected?.courseId && e.status === "Đang học",
      )
      .forEach((e) => {
        const row = o.attendance.find(
          (a) => a.lessonId === lessonId && a.studentId === e.studentId,
        );
        entries[e.studentId] = {
          status: row?.status || "Có mặt",
          score: row?.score?.toString() || "",
        };
      });
    setRecords(entries);
  }, [lessonId]);
  return (
    <>
      <PageHeader
        eyebrow="KHÔNG GIAN GIÁO VIÊN"
        title="Sẵn sàng cho buổi học"
        description="Check-in, điểm danh và ghi nhận từng bước tiến của học viên."
      >
        <span className="date-pill">
          <CalendarDays size={16} />
          {dateLabel(today())}
        </span>
      </PageHeader>
      <div className="simulation-bar">
        <span>
          <Clock size={18} />
          <strong>Giả lập thời gian</strong>
          <span>Cho phép chọn buổi khác ngày để trình diễn liên tục.</span>
        </span>
        <label className="switch">
          <input
            type="checkbox"
            checked={simulate}
            onChange={(e) => {
              setSimulate(e.target.checked);
              setLessonId("");
            }}
          />
          <span />
        </label>
      </div>
      <Panel
        title="Buổi học được phân công"
        description={
          simulate
            ? "Ngày lương được ghi nhận là hôm nay; buổi giả lập có đánh dấu trong nhật ký."
            : "Chỉ hiển thị các buổi học hôm nay."
        }
      >
        <div className="lesson-picker">
          <select
            aria-label="Chọn buổi học"
            value={lessonId}
            onChange={(e) => setLessonId(e.target.value)}
          >
            <option value="">Chọn buổi học</option>
            {choices.toReversed().map((l) => (
              <option key={l.id} value={l.id}>
                {dateLabel(l.date)} ·{" "}
                {o.courses.find((c) => c.id === l.courseId)?.name}
                {o.checkins.some((c) => c.lessonId === l.id)
                  ? " · Đã check-in"
                  : ""}
              </option>
            ))}
          </select>
          {selected &&
            (checked ? (
              <span className="checked-label">
                <CheckCheck size={18} />
                Đã check-in · {money(checked.rate)}
              </span>
            ) : (
              <button
                className="btn primary"
                onClick={() =>
                  act(
                    "checkin",
                    { lessonId: selected.id, simulate },
                    "Đã check-in. Buổi dạy đã được tính vào lương của bạn.",
                  )
                }
              >
                <Check size={18} />
                Check-in đầu buổi
              </button>
            ))}
        </div>
      </Panel>
      {selected && c ? (
        <section className="panel lesson-panel">
          <header className="panel-header">
            <div>
              <h2>{c.name}</h2>
              <p>
                {dateLabel(selected.date)} · {c.time} · {learners.length} học
                viên{selected.substituteNote ? " · Buổi dạy thay" : ""}
              </p>
            </div>
            <button
              className="text-btn"
              onClick={() =>
                setRecords((r) =>
                  Object.fromEntries(
                    Object.entries(r).map(([id, x]) => [
                      id,
                      { ...x, status: "Có mặt" },
                    ]),
                  ),
                )
              }
            >
              <CheckCheck size={16} />
              Tất cả có mặt
            </button>
          </header>
          {!checked && (
            <div className="inline-notice">
              <ShieldCheck size={17} />
              Check-in trước khi lưu điểm danh. Giáo viên chỉ xem học phí, không
              ghi nhận thu.
            </div>
          )}
          <div className="attendance-list">
            {learners.map((st, i) => (
              <div className="attendance-row" key={st.id}>
                <div className="person">
                  <Avatar name={st.name} index={i} />
                  <span>
                    <strong>{st.name}</strong>
                    <small>{st.id}</small>
                  </span>
                </div>
                <div className="attendance-options">
                  {["Có mặt", "Vắng", "Muộn"].map((status) => (
                    <button
                      key={status}
                      className={
                        records[st.id]?.status === status
                          ? `selected ${status === "Vắng" ? "absent" : status === "Muộn" ? "late" : "present"}`
                          : ""
                      }
                      onClick={() =>
                        setRecords((r) => ({
                          ...r,
                          [st.id]: { ...r[st.id], status },
                        }))
                      }
                    >
                      {status === "Có mặt" && <Check size={14} />} {status}
                    </button>
                  ))}
                </div>
                <label className="score-field">
                  Điểm
                  <input
                    type="number"
                    aria-label={`Điểm ${st.name}`}
                    min="0"
                    max="10"
                    step="0.1"
                    placeholder="—"
                    value={records[st.id]?.score ?? ""}
                    onChange={(e) =>
                      setRecords((r) => ({
                        ...r,
                        [st.id]: { ...r[st.id], score: e.target.value },
                      }))
                    }
                  />
                </label>
              </div>
            ))}
          </div>
          <footer className="lesson-footer">
            <span>
              <Phone size={16} />
              Báo vắng tự động hiện trong điện thoại phụ huynh.
            </span>
            <button
              className="btn primary"
              disabled={!checked || !learners.length}
              onClick={() =>
                act(
                  "attendance",
                  {
                    lessonId: selected.id,
                    simulate,
                    records: Object.entries(records).map(([studentId, r]) => ({
                      studentId,
                      ...r,
                    })),
                  },
                  "Đã lưu điểm danh và điểm; thông báo vắng đã được gửi giả lập.",
                )
              }
            >
              <Check size={18} />
              Lưu điểm danh
            </button>
          </footer>
        </section>
      ) : (
        <Empty
          title="Chưa có buổi học để hiển thị"
          description="Bật giả lập thời gian để chọn một buổi trong lịch đã phân công."
        />
      )}
    </>
  );
}

export function TeachersPage() {
  const { state, user, setModal, act } = useApp(),
    o = state.ops;
  const [month, setMonth] = useState(today().slice(0, 7));
  const manager = user.role === "manager";
  const teachers = o.teachers.filter((t) => manager || t.id === user.teacherId);
  const payrolls = o.payrolls.filter(
    (p) => p.month === month && (manager || p.teacherId === user.teacherId),
  );
  const checks = o.checkins.filter(
    (c) =>
      c.date.startsWith(month) && (manager || c.teacherId === user.teacherId),
  );
  const base = checks.reduce((a, c) => a + c.rate, 0);
  return (
    <>
      <PageHeader
        eyebrow="PHÂN HỆ GIÁO VIÊN & LƯƠNG"
        title={
          manager
            ? "Ghi nhận đúng, trả lương rõ ràng"
            : "Buổi dạy & thu nhập của tôi"
        }
        description="Check-in là căn cứ tính lương. Mỗi buổi dạy đều truy vết được người thực hiện."
      >
        {manager && (
          <button
            className="btn primary"
            onClick={() => setModal({ type: "teacher" })}
          >
            <Plus size={18} />
            Thêm giáo viên
          </button>
        )}
      </PageHeader>
      <div className="metrics three">
        <Metric
          label={manager ? "Giáo viên" : "Lương theo buổi"}
          value={manager ? teachers.length : money(teachers[0]?.rate || 0)}
          detail={
            manager
              ? "Đội ngũ đang được phân công"
              : "Đơn giá được chốt khi check-in"
          }
          icon={UserRound}
          tone="blue"
        />
        <Metric
          label="Buổi đã check-in"
          value={checks.length}
          detail={`Tháng ${month.split("-").reverse().join("/")}`}
          icon={CalendarCheck}
          tone="teal"
        />
        <Metric
          label="Lương theo buổi đã dạy"
          value={compactMoney(base)}
          detail="Chưa gồm thưởng hoặc khấu trừ"
          icon={Wallet}
          tone="purple"
        />
      </div>
      <div className="toolbar plain">
        <h3>{manager ? "Đội ngũ giáo viên" : "Giáo viên được chọn"}</h3>
        <label className="month-picker">
          Kỳ lương
          <input
            aria-label="Chọn tháng lương"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
      </div>
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>GIÁO VIÊN</th>
                <th>MÔN DẠY</th>
                <th>LƯƠNG / BUỔI</th>
                <th>CHECK-IN THÁNG</th>
                <th>CHƯA LẬP LƯƠNG</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {teachers.map((t, i) => {
                const count = checks.filter((c) => c.teacherId === t.id).length;
                const pending = pendingCheckins(o, t.id, month);
                return (
                  <tr key={t.id}>
                    <td>
                      <button
                        className="person"
                        onClick={() =>
                          setModal({
                            type: "teacherDetail",
                            id: t.id,
                            data: { month },
                          })
                        }
                      >
                        <Avatar name={t.name} index={i} />
                        <span>
                          <strong>{t.name}</strong>
                          <small>{t.id}</small>
                        </span>
                      </button>
                    </td>
                    <td>
                      {t.subjectIds
                        .map((id) => o.subjects.find((s) => s.id === id)?.name)
                        .join(", ")}
                    </td>
                    <td className="amount">{money(t.rate)}</td>
                    <td>{count} buổi</td>
                    <td>{pending.length} buổi</td>
                    <td>
                      {manager ? (
                        <button
                          className="table-btn"
                          disabled={!pending.length}
                          onClick={() =>
                            setModal({
                              type: "payroll",
                              id: t.id,
                              data: { month },
                            })
                          }
                        >
                          Lập bảng lương
                        </button>
                      ) : (
                        <button
                          className="table-btn"
                          onClick={() =>
                            setModal({
                              type: "teacherDetail",
                              id: t.id,
                              data: { month },
                            })
                          }
                        >
                          Xem từng buổi
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <Panel
        title="Bảng lương trong kỳ"
        description="Nháp → Đã duyệt → Đã trả. Duyệt bảng lương tự tạo khoản chi tương ứng."
        className="section-gap"
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>GIÁO VIÊN / MÃ BẢNG</th>
                <th>SỐ BUỔI</th>
                <th>ĐIỀU CHỈNH</th>
                <th>TỔNG LƯƠNG</th>
                <th>TRẠNG THÁI</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {payrolls.toReversed().map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>
                      {o.teachers.find((t) => t.id === p.teacherId)?.name}
                    </strong>
                    <small>{p.id}</small>
                    {p.note && <small>{p.note}</small>}
                  </td>
                  <td>{p.checkinIds.length}</td>
                  <td>{money(p.adjustment)}</td>
                  <td className="amount">{money(payrollTotal(o, p))}</td>
                  <td>
                    <Badge>{p.status}</Badge>
                  </td>
                  <td>
                    {manager && p.status === "Nháp" && (
                      <button
                        className="btn primary small"
                        onClick={() =>
                          act(
                            "approvePayroll",
                            { id: p.id },
                            "Đã duyệt lương và tự tạo khoản chi bên Tài chính.",
                          )
                        }
                      >
                        Duyệt lương
                      </button>
                    )}
                    {manager && p.status === "Đã duyệt" && (
                      <button
                        className="btn secondary small"
                        onClick={() =>
                          act(
                            "payPayroll",
                            { id: p.id },
                            "Đã xác nhận trả lương, không tạo thêm khoản chi.",
                          )
                        }
                      >
                        Đã trả lương
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!payrolls.length && (
          <Empty
            title="Chưa lập bảng lương trong kỳ"
            description="Buổi đã check-in được cập nhật ngay ở bảng trên. Quản lý có thể lập bảng lương để duyệt."
          />
        )}
      </Panel>
    </>
  );
}
