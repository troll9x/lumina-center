import { useState, useEffect } from "react";
import {
  BookOpen,
  LayoutDashboard,
  Users,
  CalendarDays,
  GraduationCap,
  Wallet,
  Database,
  BarChart3,
  Sparkles,
  Settings2,
  History,
  ChevronDown,
  MessageCircle,
  ShieldCheck,
  Menu,
  X,
  CheckCircle2,
  AlertCircle,
  Send,
  Phone,
  CheckCheck,
  Layers,
  FileText,
} from "lucide-react";
import { useApp, type Page } from "./context";
import { dateLabel, dateTime, today, money } from "./utils.ts";
import { belongsToTeacher } from "./domain.ts";
import { Badge } from "./components";
import DashboardPage from "./pages/Dashboard";
import {
  StudentsPage,
  CoursesPage,
  LessonsPage,
  TeachersPage,
} from "./pages/Operations";
import FinancePage from "./pages/Finance";
import { WarehousePage, AnalysisPage, AgentPage } from "./pages/Intelligence";
import { SettingsPage, HistoryPage } from "./pages/Settings";
import Dialogs from "./Dialogs";
const nav: {
  id: Page;
  name: string;
  icon: any;
  teacher: boolean;
  group?: string;
}[] = [
  { id: "dashboard", name: "Tổng quan", icon: LayoutDashboard, teacher: true },
  {
    id: "students",
    name: "Học viên",
    icon: Users,
    teacher: false,
    group: "NGHIỆP VỤ",
  },
  { id: "courses", name: "Lớp học", icon: BookOpen, teacher: true },
  { id: "lessons", name: "Buổi học", icon: CalendarDays, teacher: true },
  {
    id: "teachers",
    name: "Giáo viên & lương",
    icon: GraduationCap,
    teacher: true,
  },
  { id: "finance", name: "Tài chính", icon: Wallet, teacher: false },
  {
    id: "warehouse",
    name: "Kho dữ liệu",
    icon: Database,
    teacher: false,
    group: "KHO & PHÂN TÍCH",
  },
  { id: "analysis", name: "Phân tích", icon: BarChart3, teacher: false },
  { id: "agent", name: "Tác tử AI", icon: Sparkles, teacher: false },
  {
    id: "settings",
    name: "Cài đặt",
    icon: Settings2,
    teacher: false,
    group: "QUẢN TRỊ",
  },
  { id: "history", name: "Nhật ký hoạt động", icon: History, teacher: false },
];
export default function App() {
  const {
    state,
    user,
    userId,
    changeUser,
    page,
    setPage,
    modal,
    setModal,
    toast,
    clearToast,
    running,
    notify,
    phone,
    setPhone,
    phoneStudent,
    setPhoneStudent,
  } = useApp();
  const [mobile, setMobile] = useState(false);
  const manager = user.role === "manager";
  const visibleNav = nav.filter((n) =>
    manager ? n.id !== "lessons" : n.teacher,
  );
  const entry = nav.find((n) => n.id === page)!;
  useEffect(() => {
    setMobile(false);
    window.scrollTo({ top: 0 });
  }, [page]);
  function go(p: Page) {
    if (running) {
      notify(
        "Chờ quy trình đang chạy hoàn thành trước khi chuyển màn hình.",
        true,
      );
      return;
    }
    setPage(p);
  }
  return (
    <>
      <div className="app-layout">
        <aside className={`sidebar ${mobile ? "open" : ""}`}>
          <button className="brand" onClick={() => go("dashboard")}>
            <span className="brand-symbol">
              <BookOpen size={26} />
              <i />
            </span>
            <span>
              Tri Thức Việt<small>KHÔNG GIAN QUẢN LÝ</small>
            </span>
          </button>
          <div className="center-switch">
            <span className="center-icon">
              <GraduationCap size={21} />
            </span>
            <div>
              Trung tâm dạy học<small>1 cơ sở · Cùng nhau tiến bộ</small>
            </div>
            <ChevronDown size={15} />
          </div>
          <nav>
            {visibleNav.map((n) => (
              <div key={n.id}>
                {n.group && <p className="nav-label">{n.group}</p>}
                <button
                  className={`nav-link ${page === n.id ? "active" : ""}`}
                  onClick={() => go(n.id)}
                >
                  <n.icon size={19} />
                  <span>
                    {n.name === "Giáo viên & lương" && !manager
                      ? "Lương của tôi"
                      : n.name}
                  </span>
                  {n.id === "agent" && <b>AI</b>}
                  {n.id === "students" && (
                    <small>{state.ops.students.length}</small>
                  )}
                </button>
              </div>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-guide">
              <span>
                <Layers size={18} />
                BA TẦNG, MỘT DÒNG CHẢY
              </span>
              <p>
                Nghiệp vụ liên thông.
                <br />
                Quản lý bằng dữ liệu.
              </p>
              <button onClick={() => setModal({ type: "guide" })}>
                Xem kịch bản demo <FileText size={14} />
              </button>
            </div>
            <div className="sidebar-version">
              <span className="status-dot" />
              Phiên bản 2.0<span>DEMO</span>
            </div>
          </div>
          <button
            className="icon-btn sidebar-close"
            aria-label="Đóng menu"
            onClick={() => setMobile(false)}
          >
            <X size={22} />
          </button>
        </aside>
        {mobile && (
          <div className="sidebar-shade" onClick={() => setMobile(false)} />
        )}
        <div className="main-layout">
          <header className="topbar">
            <div className="breadcrumbs">
              <button
                className="icon-btn mobile-menu"
                aria-label="Mở menu"
                onClick={() => setMobile(true)}
              >
                <Menu size={22} />
              </button>
              <span>Không gian làm việc</span>
              <i>/</i>
              <strong>{entry.name}</strong>
            </div>
            <div className="top-actions">
              <span className="today-pill">
                <CalendarDays size={16} />
                {dateLabel(today())}
              </span>
              <button
                className="icon-btn header-phone"
                aria-label="Mở điện thoại phụ huynh"
                onClick={() => setPhone(true)}
              >
                <MessageCircle size={21} />
                {state.ops.messages.length > 0 && <i />}
              </button>
              <span className="top-divider" />
              <div className="user-symbol">
                {manager
                  ? user.name === "Chị Lan"
                    ? "LA"
                    : user.name === "Anh Tuấn"
                      ? "TU"
                      : "MI"
                  : "GV"}
              </div>
              <div className="user-picker">
                <small>{manager ? "Quản lý trung tâm" : "Giáo viên"}</small>
                <select
                  aria-label="Chọn người dùng"
                  value={userId}
                  disabled={running}
                  onChange={(e) => changeUser(e.target.value)}
                >
                  <optgroup label="Quản lý">
                    {state.ops.users
                      .filter((u) => u.role === "manager")
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Giáo viên">
                    {state.ops.users
                      .filter((u) => u.role === "teacher")
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>
            </div>
          </header>
          <main>
            {page === "dashboard" && <DashboardPage />}
            {manager && page === "students" && <StudentsPage />}
            {page === "courses" && <CoursesPage />}
            {!manager && page === "lessons" && <LessonsPage />}
            {page === "teachers" && <TeachersPage />}
            {manager && page === "finance" && <FinancePage />}
            {manager && page === "warehouse" && <WarehousePage />}
            {manager && page === "analysis" && <AnalysisPage />}
            {manager && page === "agent" && <AgentPage />}
            {manager && page === "settings" && <SettingsPage />}
            {manager && page === "history" && <HistoryPage />}
            <footer className="app-footer">
              <span>
                Tri Thức Việt <i>Học hôm nay, vững ngày mai.</i>
              </span>
              <span>
                <ShieldCheck size={14} />
                Dữ liệu demo lưu trên trình duyệt này
              </span>
            </footer>
          </main>
        </div>
        <button className="phone-launcher" onClick={() => setPhone(!phone)}>
          <MessageCircle size={20} />
          <span>Điện thoại phụ huynh</span>
          {state.ops.messages.length > 0 && <b>{state.ops.messages.length}</b>}
        </button>
      </div>
      {modal && <Dialogs key={modal.type + "-" + modal.id} />}
      <PhoneDrawer />
      {toast && (
        <div className={`toast ${toast.error ? "error" : ""}`} role="status">
          {toast.error ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{toast.text}</span>
          <button aria-label="Đóng thông báo" onClick={clearToast}>
            <X size={16} />
          </button>
        </div>
      )}
      <PrintReceipt />
    </>
  );
}
function PhoneDrawer() {
  const { state, user, phone, setPhone, phoneStudent, setPhoneStudent } =
    useApp();
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPhone(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  if (!phone) return null;
  const o = state.ops;
  const ids = new Set(
    o.enrollments
      .filter((e) => belongsToTeacher(o, user, e.courseId))
      .map((e) => e.studentId),
  );
  const students = o.students.filter(
    (s) => user.role === "manager" || ids.has(s.id),
  );
  const messages = o.messages.filter(
    (m) =>
      (user.role === "manager" || ids.has(m.studentId)) &&
      (!phoneStudent || m.studentId === phoneStudent),
  );
  return (
    <>
      <div className="phone-shade" onClick={() => setPhone(false)} />
      <aside className="phone-drawer">
        <header>
          <div>
            <span className="eyebrow">HỘP THƯ ZALO GIẢ LẬP</span>
            <h2>Điện thoại phụ huynh</h2>
          </div>
          <button
            className="icon-btn"
            aria-label="Đóng điện thoại"
            onClick={() => setPhone(false)}
          >
            <X size={22} />
          </button>
        </header>
        <select
          aria-label="Chọn phụ huynh"
          value={phoneStudent}
          onChange={(e) => setPhoneStudent(e.target.value)}
        >
          <option value="">Tất cả phụ huynh trong phạm vi</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              PH {s.name}
            </option>
          ))}
        </select>
        <div className="phone-screen">
          <div className="phone-contact">
            <span>
              <BookOpen size={24} />
            </span>
            <div>
              <strong>Trung tâm Tri Thức Việt</strong>
              <small>
                <CheckCircle2 size={12} />
                Thông báo từ trung tâm
              </small>
            </div>
            <Phone size={18} />
          </div>
          <div className="phone-messages">
            {messages.length ? (
              messages.map((m) => (
                <article key={m.id}>
                  <div className="phone-date">{dateTime(m.created)}</div>
                  <small>
                    Gửi PH {o.students.find((s) => s.id === m.studentId)?.name}
                  </small>
                  <p>
                    {m.content}
                    <span>
                      {m.type}
                      <CheckCheck size={13} />
                    </span>
                  </p>
                </article>
              ))
            ) : (
              <div className="phone-empty">
                <MessageCircle size={36} />
                <h3>Chưa có tin nhắn</h3>
                <p>
                  Tin báo vắng, xác nhận đã thu và tin chăm sóc đã được quản lý
                  duyệt sẽ xuất hiện tại đây.
                </p>
              </div>
            )}
          </div>
          <div className="phone-composer">
            <span>Tin nhắn minh họa từ trung tâm</span>
            <Send size={18} />
          </div>
        </div>
        <p className="phone-disclaimer">
          <ShieldCheck size={14} />
          Không kết nối Zalo hoặc gửi đến số thật.
        </p>
      </aside>
    </>
  );
}
function PrintReceipt() {
  const { state, printReceipt } = useApp();
  const r = state.ops.receipts.find((r) => r.id === printReceipt);
  if (!r) return null;
  const invoice = state.ops.invoices.find((i) => i.id === r.invoiceId)!,
    student = state.ops.students.find((s) => s.id === invoice.studentId)!,
    course = state.ops.courses.find((c) => c.id === invoice.courseId)!;
  return (
    <article className="print-receipt">
      <header>
        <BookOpen size={35} />
        <h1>TRUNG TÂM TRI THỨC VIỆT</h1>
        <p>Phiếu thu giả lập phục vụ bài demo — không phải hóa đơn điện tử</p>
      </header>
      <h2>PHIẾU THU HỌC PHÍ</h2>
      <p className="print-number">
        Số phiếu: {r.id} · Ngày {dateLabel(r.date)}
      </p>
      <dl>
        <dt>Họ tên người nộp</dt>
        <dd>{student.parent}</dd>
        <dt>Học viên</dt>
        <dd>
          {student.name} ({student.id})
        </dd>
        <dt>Nội dung</dt>
        <dd>Thu học phí {course.name}</dd>
        <dt>Mã khoản phải thu</dt>
        <dd>{invoice.id}</dd>
        <dt>Số tiền đã thu</dt>
        <dd>
          <strong>{money(r.amount)}</strong>
        </dd>
        <dt>Hình thức</dt>
        <dd>{r.method}</dd>
        <dt>Người ghi nhận</dt>
        <dd>{r.actor}</dd>
      </dl>
      <div className="print-signatures">
        <div>
          Người nộp tiền<small>(Ký, ghi rõ họ tên)</small>
        </div>
        <div>
          Người lập phiếu<small>(Ký, ghi rõ họ tên)</small>
        </div>
        <div>
          Quản lý trung tâm<small>(Ký, ghi rõ họ tên)</small>
        </div>
      </div>
    </article>
  );
}
