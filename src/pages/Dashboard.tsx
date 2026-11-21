import {
  Users,
  Wallet,
  AlertTriangle,
  BookOpen,
  CalendarDays,
  Plus,
  Sparkles,
  Database,
  GraduationCap,
  Check,
  RefreshCw,
  ShieldCheck,
  CalendarCheck,
  Clock,
  Layers,
  FileText,
  Phone,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useApp } from "../context";
import { PageHeader, Metric, Panel, Badge, Avatar, Empty } from "../components";
import {
  money,
  compactMoney,
  today,
  dateLabel,
  dateTime,
  schedule,
} from "../utils.ts";
import { invoiceBalance, operationalFacts, profitSummary } from "../finance.ts";
import { risks, warehouseProfit } from "../warehouse.ts";
import { minimumStudents, belongsToTeacher } from "../domain.ts";
export default function DashboardPage() {
  const { state, user, setPage, setModal, act } = useApp(),
    o = state.ops,
    w = state.warehouse;
  const month = today().slice(0, 7);
  const summary = profitSummary(
    operationalFacts(o),
    o.courses,
    o.lessons,
    month,
    o.settings.reserveRate,
  );
  const overdue = o.invoices.filter(
    (i) => i.due < today() && invoiceBalance(o, i) > 0,
  );
  const high = w ? risks(w).filter((r) => r.level === "Cao") : [];
  const planned = o.courses.filter((c) => c.status === "Dự kiến");
  const lessons = o.lessons
    .filter((l) => l.date >= today())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);
  const manager = user.role === "manager";
  if (!manager) {
    const assigned = o.lessons.filter((l) => l.teacherId === user.teacherId);
    const todayLessons = assigned.filter((l) => l.date === today());
    const checks = o.checkins.filter(
      (c) => c.teacherId === user.teacherId && c.date.startsWith(month),
    );
    const courses = o.courses.filter(
      (c) => belongsToTeacher(o, user, c.id) && c.status === "Đang mở",
    );
    const students = new Set(
      o.enrollments
        .filter((e) => courses.some((c) => c.id === e.courseId))
        .map((e) => e.studentId),
    );
    return (
      <>
        <PageHeader
          eyebrow="KHÔNG GIAN GIÁO VIÊN"
          title={`Chào ${user.name.split(" ").slice(-2).join(" ")}, sẵn sàng buổi học mới?`}
          description="Theo dõi lịch dạy, học viên và ghi nhận công sức của bạn."
        >
          <button className="btn primary" onClick={() => setPage("lessons")}>
            <CalendarCheck size={18} />
            Check-in & điểm danh
          </button>
        </PageHeader>
        <div className="metrics">
          <Metric
            label="Lớp đang dạy"
            value={courses.length}
            detail="Lớp chính hoặc có buổi dạy thay"
            icon={BookOpen}
            tone="blue"
          />
          <Metric
            label="Học viên trong lớp"
            value={students.size}
            detail="Hồ sơ thuộc phạm vi được phân công"
            icon={Users}
            tone="purple"
          />
          <Metric
            label="Check-in tháng này"
            value={checks.length}
            detail="Buổi dạy đã được ghi nhận"
            icon={CalendarCheck}
            tone="teal"
          />
          <Metric
            label="Lương cơ bản tích lũy"
            value={compactMoney(checks.reduce((a, c) => a + c.rate, 0))}
            detail="Chưa tính điều chỉnh thưởng/khấu trừ"
            icon={Wallet}
            tone="orange"
          />
        </div>
        <Panel
          title="Lịch dạy hôm nay"
          description={dateLabel(today())}
          action={
            <button className="text-btn" onClick={() => setPage("lessons")}>
              Mở buổi học
            </button>
          }
        >
          {todayLessons.length ? (
            <div className="dashboard-lessons">
              {todayLessons.map((l) => {
                const c = o.courses.find((c) => c.id === l.courseId)!;
                const checked = o.checkins.some((c) => c.lessonId === l.id);
                return (
                  <div key={l.id}>
                    <span className="icon-box blue">
                      <BookOpen size={22} />
                    </span>
                    <div>
                      <strong>{c.name}</strong>
                      <p>
                        {c.time} ·{" "}
                        {l.substituteNote ? "Buổi dạy thay" : "Giáo viên chính"}
                      </p>
                    </div>
                    {checked ? (
                      <Badge tone="green">Đã check-in</Badge>
                    ) : (
                      <button
                        className="btn primary small"
                        onClick={() =>
                          act(
                            "checkin",
                            { lessonId: l.id, simulate: false },
                            "Đã check-in buổi dạy hôm nay.",
                          )
                        }
                      >
                        Check-in
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty
              title="Hôm nay chưa có lịch dạy"
              description="Để trình diễn, mở Buổi học và bật Giả lập thời gian để chọn một buổi khác ngày."
            />
          )}
        </Panel>
        <div className="teacher-rights section-gap">
          <ShieldCheck size={24} />
          <div>
            <h3>Bạn có thể trả lời phụ huynh về học phí</h3>
            <p>
              Mở chi tiết lớp để xem phải thu, đã đóng và còn nợ; bấm Gửi lại
              thông báo để quản lý duyệt. Chỉ quản lý ghi nhận thu, tiền không
              đi qua tay giáo viên.
            </p>
          </div>
        </div>
        <div className="mini-course-grid section-gap">
          {courses.map((c) => (
            <button
              key={c.id}
              onClick={() => setModal({ type: "courseDetail", id: c.id })}
            >
              <span className="icon-box blue">
                <BookOpen size={21} />
              </span>
              <strong>{c.name}</strong>
              <span>{schedule(c)}</span>
            </button>
          ))}
        </div>
      </>
    );
  }
  const chart = w
    ? [-2, -1, 0].map((offset) => {
        const d = new Date(w.asOfDate + "T12:00:00Z");
        d.setUTCDate(1);
        d.setUTCMonth(d.getUTCMonth() + offset);
        const m = d.toISOString().slice(0, 7);
        const p = warehouseProfit(w, m);
        return {
          month: "Tháng " + m.slice(5),
          income: p.income / 1e6,
          expenses: p.expenses / 1e6,
        };
      })
    : [];
  return (
    <>
      <PageHeader
        eyebrow="KHÔNG GIAN QUẢN LÝ"
        title={`Chào ${user.name}, cùng tạo nên những tiến bộ mới.`}
        description="Một góc nhìn liền mạch về lớp học, dòng tiền và những học viên cần quan tâm."
      >
        <button
          className="btn primary"
          onClick={() => setModal({ type: "student" })}
        >
          <Plus size={18} />
          Thêm học viên
        </button>
      </PageHeader>
      <section className="dashboard-hero">
        <div>
          <span className="hero-label">
            <span />
            TRUNG TÂM TRI THỨC VIỆT
          </span>
          <h2>
            Một hệ thống.
            <br />
            Mọi kết nối.
          </h2>
          <p>
            Từ một lần nhập liệu đến những quyết định
            <br className="desktop" /> có cơ sở cho cả trung tâm.
          </p>
          <button onClick={() => setModal({ type: "guide" })}>
            <PlayCircle />
            Xem hành trình demo
          </button>
        </div>
        <div className="hero-flow">
          <div className="hero-flow-card">
            <span className="hero-icon">
              <Layers size={23} />
            </span>
            <strong>Nghiệp vụ</strong>
            <small>5 phân hệ liên thông</small>
          </div>
          <span className="hero-flow-line">ETL</span>
          <div className="hero-flow-card">
            <span className="hero-icon">
              <Database size={23} />
            </span>
            <strong>Kho dữ liệu</strong>
            <small>Một nguồn phân tích</small>
          </div>
          <span className="hero-flow-line">ĐỌC</span>
          <div className="hero-flow-card">
            <span className="hero-icon">
              <Sparkles size={23} />
            </span>
            <strong>Quyết định tốt hơn</strong>
            <small>Phân tích & chăm sóc</small>
          </div>
        </div>
        <span className="hero-orbit one" />
        <span className="hero-orbit two" />
      </section>
      <div className="metrics">
        <Metric
          label="Thực thu tháng này"
          value={compactMoney(summary.income)}
          detail={`${o.receipts.filter((r) => r.date.startsWith(month)).length} phiếu thu đã ghi nhận`}
          icon={Wallet}
          tone="blue"
        />
        <Metric
          label="Công nợ quá hạn"
          value={compactMoney(
            overdue.reduce((a, i) => a + invoiceBalance(o, i), 0),
          )}
          detail={`${overdue.length} khoản cần theo dõi`}
          icon={FileText}
          tone="orange"
        />
        <Metric
          label="Học viên của trung tâm"
          value={o.students.length}
          detail={`${o.students.filter((s) => s.status === "Chờ lớp").length} học viên chờ lớp`}
          icon={Users}
          tone="purple"
        />
        <Metric
          label="Rủi ro bỏ học cao"
          value={w ? high.length : "—"}
          detail={
            w ? "Theo dữ liệu kho lần ETL gần nhất" : "Chạy ETL để xem rủi ro"
          }
          icon={AlertTriangle}
          tone="rose"
        />
      </div>
      <div className="dashboard-main">
        <Panel
          title="Bức tranh tài chính"
          description={
            w
              ? `Dữ liệu kho · ${dateTime(w.loadedAt)} · Đơn vị triệu đồng`
              : "Chạy ETL để xem báo cáo"
          }
          action={
            <button className="text-btn" onClick={() => setPage("analysis")}>
              Xem phân tích
            </button>
          }
        >
          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={chart}
                barGap={7}
                margin={{ top: 20, right: 15, bottom: 0, left: -15 }}
              >
                <CartesianGrid
                  stroke="#e8edf5"
                  strokeDasharray="4 5"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#7e8ba2" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#7e8ba2" }}
                />
                <Tooltip
                  formatter={(v: any, n: any) => [
                    Number(v).toLocaleString("vi-VN", {
                      maximumFractionDigits: 2,
                    }) + " tr",
                    n,
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e5ecf5",
                    fontSize: 14,
                  }}
                />
                <Bar
                  name="Thực thu"
                  dataKey="income"
                  fill="#416bb9"
                  barSize={35}
                  radius={[5, 5, 0, 0]}
                />
                <Bar
                  name="Chi phí"
                  dataKey="expenses"
                  fill="#d5e0f1"
                  barSize={35}
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            <span>
              <i className="income" />
              Thực thu
            </span>
            <span>
              <i className="cost" />
              Chi phí
            </span>
            <small>Phân tích giữ nguyên đến lần ETL tiếp theo</small>
          </div>
        </Panel>
        <Panel
          title="Cần bạn quan tâm"
          description="Ưu tiên đúng việc, đúng thời điểm"
        >
          <div className="attention-list">
            <button onClick={() => setPage("courses")}>
              <span className="icon-box blue">
                <BookOpen size={21} />
              </span>
              <div>
                <strong>Lớp dự kiến</strong>
                <p>{planned.length} lớp đang tuyển sinh</p>
              </div>
              <b>{planned.length}</b>
            </button>
            <button onClick={() => setPage("agent")}>
              <span className="icon-box purple">
                <Sparkles size={21} />
              </span>
              <div>
                <strong>Chăm sóc học viên</strong>
                <p>
                  {w
                    ? risks(w).filter(
                        (r) => r.endingCourseId || r.level === "Cao",
                      ).length
                    : 0}{" "}
                  em cần được xem xét
                </p>
              </div>
              <b>
                {o.drafts.filter((d) => d.status === "Chờ duyệt").length}
                <small>nháp</small>
              </b>
            </button>
            <button onClick={() => setPage("teachers")}>
              <span className="icon-box orange">
                <GraduationCap size={21} />
              </span>
              <div>
                <strong>Lương cần duyệt</strong>
                <p>Kiểm tra buổi dạy & điều chỉnh</p>
              </div>
              <b>{o.payrolls.filter((p) => p.status === "Nháp").length}</b>
            </button>
          </div>
          <div className="attention-foot">
            <ShieldCheck size={18} />
            <p>
              Tác tử chuẩn bị đề xuất.
              <br />
              Quản lý duyệt trước khi gửi.
            </p>
          </div>
        </Panel>
      </div>
      <div className="dashboard-bottom">
        <Panel
          title="Từ danh sách chờ đến lớp học"
          description="Mở lớp đúng lúc, bắt đầu một hành trình mới"
          action={
            <button className="text-btn" onClick={() => setPage("courses")}>
              Tất cả lớp
            </button>
          }
        >
          <div className="planned-list">
            {planned.map((c) => {
              const count = o.enrollments.filter(
                  (e) => e.courseId === c.id,
                ).length,
                min = minimumStudents(o, c);
              return (
                <div key={c.id}>
                  <span className="icon-box blue">
                    <BookOpen size={21} />
                  </span>
                  <div>
                    <strong>{c.name}</strong>
                    <p>{schedule(c)}</p>
                    <span>
                      {count}/{min} học viên tối thiểu ·{" "}
                      {count >= min
                        ? "Đủ điều kiện"
                        : `Còn thiếu ${min - count} em`}
                    </span>
                  </div>
                  <button
                    className="btn secondary small"
                    onClick={() =>
                      setModal({ type: "student", data: { courseId: c.id } })
                    }
                  >
                    <Plus size={15} />
                    Thêm học viên
                  </button>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel title="Nhật ký gần đây" description="Những kết nối vừa được tạo">
          <div className="recent-activity">
            {o.audit.slice(0, 4).map((a) => (
              <div key={a.id}>
                <i />
                <div>
                  <strong>{a.action}</strong>
                  <p>
                    {a.actor} · {dateTime(a.created)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="recent-footer">
            <button className="text-btn" onClick={() => setPage("history")}>
              Mở nhật ký hoạt động
            </button>
          </div>
        </Panel>
      </div>
    </>
  );
}
function PlayCircle() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="m8 6 6 4-6 4V6Z" fill="currentColor" />
    </svg>
  );
}
