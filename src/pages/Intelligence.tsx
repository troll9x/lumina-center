import { useState, useEffect, useRef } from "react";
import {
  Database,
  RefreshCw,
  ShieldCheck,
  Layers,
  CalendarDays,
  Users,
  BookOpen,
  GraduationCap,
  Wallet,
  ClipboardCheck,
  Check,
  CheckCheck,
  Sparkles,
  Play,
  FileText,
  Phone,
  Send,
  SquarePen,
  Info,
  TrendingUp,
  AlertTriangle,
  LoaderCircle,
  Inbox,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useApp } from "../context";
import {
  PageHeader,
  Panel,
  Metric,
  Badge,
  Empty,
  SnapshotNote,
  Avatar,
} from "../components";
import { risks, warehouseProfit, suggestedClasses } from "../warehouse.ts";
import { runCareAgent, type AgentStep } from "../agent.ts";
import { money, compactMoney, dateLabel, dateTime } from "../utils.ts";
import { ProfitTable } from "./Finance";
export function WarehousePage() {
  const { state, act, running, setRunning, notify } = useApp();
  const w = state.warehouse;
  const [phase, setPhase] = useState(-1),
    [table, setTable] = useState("financial");
  const tables = w
    ? [
        {
          id: "financial",
          label: "Sự kiện Tài chính",
          count: w.financial.length,
          kind: "Sự kiện",
          icon: Wallet,
        },
        {
          id: "learning",
          label: "Sự kiện Học tập",
          count: w.learning.length,
          kind: "Sự kiện",
          icon: ClipboardCheck,
        },
        {
          id: "dimTime",
          label: "Chiều Thời gian",
          count: w.dimTime.length,
          kind: "Chiều",
          icon: CalendarDays,
        },
        {
          id: "dimStudents",
          label: "Chiều Học viên",
          count: w.dimStudents.length,
          kind: "Chiều",
          icon: Users,
        },
        {
          id: "dimTeachers",
          label: "Chiều Giáo viên",
          count: w.dimTeachers.length,
          kind: "Chiều",
          icon: GraduationCap,
        },
        {
          id: "dimCourses",
          label: "Chiều Lớp",
          count: w.dimCourses.length,
          kind: "Chiều",
          icon: BookOpen,
        },
        {
          id: "dimSubjects",
          label: "Chiều Môn",
          count: w.dimSubjects.length,
          kind: "Chiều",
          icon: Layers,
        },
      ]
    : [];
  const count = tables.reduce((a, t) => a + t.count, 0);
  async function etl() {
    if (running) return;
    setRunning(true);
    try {
      for (let i = 0; i < 3; i++) {
        setPhase(i);
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
      act("etl", {}, "ETL hoàn tất. Dữ liệu phân tích đã cập nhật.");
      setPhase(3);
    } finally {
      setRunning(false);
    }
  }
  const raw = w ? (w as unknown as Record<string, any[]>)[table] || [] : [];
  const preview = raw.slice(0, 8);
  const fields: Record<string, string[]> = {
    financial: ["id", "date", "kind", "amount", "studentId", "courseId"],
    learning: ["studentId", "courseId", "date", "status", "score"],
    dimStudents: ["id", "grade", "status"],
    dimTeachers: ["id", "name", "rate"],
    dimCourses: ["id", "name", "subjectId", "status"],
    dimSubjects: ["id", "name", "price"],
    dimTime: ["id", "month", "year"],
  };
  return (
    <>
      <PageHeader
        eyebrow="TẦNG 2 · KHO DỮ LIỆU"
        title="Một nguồn dữ liệu cho mọi góc nhìn"
        description="Trích xuất nghiệp vụ, chuẩn hóa dữ liệu và nạp vào kho hình sao riêng biệt."
      >
        <button className="btn primary" disabled={running} onClick={etl}>
          {running ? (
            <LoaderCircle className="spin" size={18} />
          ) : (
            <RefreshCw size={18} />
          )}
          Chạy ETL
        </button>
      </PageHeader>
      <div className="metrics three">
        <Metric
          label="Bản ghi trong kho"
          value={count.toLocaleString("vi-VN")}
          detail="Hai bảng sự kiện và năm bảng chiều"
          icon={Database}
          tone="blue"
        />
        <Metric
          label="Lần nạp gần nhất"
          value={
            <span className="metric-date">
              {w ? dateTime(w.loadedAt) : "Chưa nạp"}
            </span>
          }
          detail={
            w?.sourceRevision === state.ops.revision
              ? "Đang đồng bộ với nghiệp vụ"
              : "Có thay đổi nghiệp vụ chưa được nạp"
          }
          icon={RefreshCw}
          tone="teal"
        />
        <Metric
          label="Học viên đã ẩn tên"
          value={w?.dimStudents.length || 0}
          detail="Chỉ còn mã, khối và trạng thái"
          icon={ShieldCheck}
          tone="purple"
        />
      </div>
      <section className="etl-pipeline">
        <div className="pipeline-step">
          <span className={`icon-box ${phase === 0 ? "blue" : "gray"}`}>
            <Layers size={23} />
          </span>
          <div>
            <small>TRÍCH XUẤT</small>
            <h3>Dữ liệu nghiệp vụ</h3>
            <p>Học phí · Lương · Học tập</p>
          </div>
          {phase > 0 && <Check size={18} />}
        </div>
        <div className="pipeline-connector" />
        <div className="pipeline-step">
          <span className={`icon-box ${phase === 1 ? "blue" : "gray"}`}>
            <ShieldCheck size={23} />
          </span>
          <div>
            <small>CHUYỂN ĐỔI</small>
            <h3>Chuẩn hóa & ẩn tên</h3>
            <p>Gán khóa chiều, kiểm tra dữ liệu</p>
          </div>
          {phase > 1 && <Check size={18} />}
        </div>
        <div className="pipeline-connector" />
        <div className="pipeline-step">
          <span className={`icon-box ${phase >= 2 ? "blue" : "gray"}`}>
            <Database size={23} />
          </span>
          <div>
            <small>NẠP DỮ LIỆU</small>
            <h3>Kho dữ liệu riêng</h3>
            <p>Phục vụ phân tích và tác tử</p>
          </div>
          {phase === 3 && <Check size={18} />}
        </div>
      </section>
      <div className="warehouse-grid">
        <Panel
          title="Mô hình hình sao"
          description="Các bảng chiều dùng chung cho hai nhóm sự kiện."
        >
          <div className="star-model">
            <svg
              viewBox="0 0 600 360"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M130 70 300 180 470 70M100 180H500M130 290 300 180 470 290"
                fill="none"
                stroke="#d2dff0"
                strokeWidth="2"
                strokeDasharray="5 5"
              />
            </svg>
            <button
              className="star-node time"
              onClick={() => setTable("dimTime")}
            >
              <CalendarDays size={19} />
              Thời gian
            </button>
            <button
              className="star-node student"
              onClick={() => setTable("dimStudents")}
            >
              <Users size={19} />
              Học viên<span>Chỉ mã học viên</span>
            </button>
            <button
              className="star-node teacher"
              onClick={() => setTable("dimTeachers")}
            >
              <GraduationCap size={19} />
              Giáo viên
            </button>
            <div className="star-center">
              <button onClick={() => setTable("financial")}>
                <Wallet size={19} />
                <span>
                  Sự kiện Tài chính<small>{w?.financial.length} bản ghi</small>
                </span>
              </button>
              <button onClick={() => setTable("learning")}>
                <ClipboardCheck size={19} />
                <span>
                  Sự kiện Học tập<small>{w?.learning.length} bản ghi</small>
                </span>
              </button>
            </div>
            <button
              className="star-node course"
              onClick={() => setTable("dimCourses")}
            >
              <BookOpen size={19} />
              Lớp học
            </button>
            <button
              className="star-node subject"
              onClick={() => setTable("dimSubjects")}
            >
              <Layers size={19} />
              Môn học
            </button>
          </div>
        </Panel>
        <Panel
          title="Bảng đã nạp"
          description="Bấm một bảng để xem bản ghi mẫu."
        >
          <div className="warehouse-tables">
            {tables.map((t) => (
              <button
                key={t.id}
                className={table === t.id ? "selected" : ""}
                onClick={() => setTable(t.id)}
              >
                <span
                  className={`icon-box small ${t.kind === "Sự kiện" ? "blue" : "gray"}`}
                >
                  <t.icon size={16} />
                </span>
                <span>
                  {t.label}
                  <small>{t.kind}</small>
                </span>
                <b>{t.count.toLocaleString("vi-VN")}</b>
              </button>
            ))}
          </div>
        </Panel>
      </div>
      <Panel
        title={`Dữ liệu mẫu · ${tables.find((t) => t.id === table)?.label || ""}`}
        description="Hiển thị tối đa 8 bản ghi. Không chứa tên, số Zalo hoặc tên phụ huynh của học viên."
        className="section-gap"
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {fields[table]?.map((f) => (
                  <th key={f}>
                    {(
                      {
                        id: "MÃ",
                        date: "NGÀY",
                        kind: "LOẠI",
                        amount: "SỐ TIỀN",
                        studentId: "MÃ HỌC VIÊN",
                        courseId: "MÃ LỚP",
                        status: "TRẠNG THÁI",
                        score: "ĐIỂM",
                        grade: "KHỐI",
                        name: "TÊN",
                        rate: "LƯƠNG / BUỔI",
                        price: "ĐƠN GIÁ",
                        month: "THÁNG",
                        year: "NĂM",
                        subjectId: "MÔN",
                      } as Record<string, string>
                    )[f] || f}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i}>
                  {fields[table]?.map((f) => (
                    <td key={f}>
                      {row[f] === null || row[f] === undefined
                        ? "—"
                        : ["amount", "rate", "price"].includes(f)
                          ? money(row[f])
                          : String(row[f])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="inline-notice section-gap">
        <Info size={18} />
        Thay đổi nghiệp vụ không tự thay đổi kho. Báo cáo, dự đoán, gợi ý và tác
        tử chỉ đọc bản nạp gần nhất.
      </div>
    </>
  );
}

export function AnalysisPage() {
  const { state } = useApp();
  const [tab, setTab] = useState("reports"),
    [level, setLevel] = useState("Tất cả");
  const w = state.warehouse;
  const [selectedMonth, setSelectedMonth] = useState(
    w?.asOfDate.slice(0, 7) || "",
  );
  if (!w)
    return (
      <>
        <PageHeader
          title="Phân tích quản trị"
          description="Chạy ETL để tạo nguồn dữ liệu phân tích."
        />
        <SnapshotNote />
      </>
    );
  const month = w.asOfDate.slice(0, 7);
  const riskList = risks(w),
    high = riskList.filter((r) => r.level === "Cao"),
    summary = warehouseProfit(w, selectedMonth);
  const months = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(w.asOfDate + "T12:00:00Z");
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - 2 + i);
    return d.toISOString().slice(0, 7);
  });
  const chart = months.map((m) => {
    const p = warehouseProfit(w, m);
    return {
      name: m.slice(5) + "/" + m.slice(0, 4),
      income: p.income / 1e6,
      expenses: p.expenses / 1e6,
      net: p.net / 1e6,
    };
  });
  const overdue = w.financial.filter(
    (f) => f.kind === "Phải thu" && f.due! < w.asOfDate && (f.balance || 0) > 0,
  );
  return (
    <>
      <PageHeader
        eyebrow="TẦNG 3 · PHÂN TÍCH NÂNG CAO"
        title="Hiểu trung tâm từ dữ liệu"
        description="Nhìn rõ kết quả vận hành, nhận diện rủi ro và tìm cơ hội học tiếp."
      />
      <SnapshotNote />
      <div className="tabs page-tabs">
        {[
          ["reports", "Báo cáo quản trị"],
          ["risks", "Rủi ro bỏ học"],
          ["suggestions", "Gợi ý mở lớp"],
        ].map(([id, name]) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            {name}
            {id === "risks" && <b>{high.length} cao</b>}
          </button>
        ))}
      </div>
      {tab === "reports" && (
        <>
          <div className="metrics three">
            <Metric
              label="Thực thu trong kỳ"
              value={compactMoney(summary.income)}
              detail={`Tháng ${selectedMonth.split("-").reverse().join("/")}`}
              icon={Wallet}
              tone="blue"
            />
            <Metric
              label="Chi phí trong kỳ"
              value={compactMoney(summary.expenses)}
              detail="Từ sự kiện lương và chi phí"
              icon={FileText}
              tone="orange"
            />
            <Metric
              label="Lãi / lỗ trong kỳ"
              value={
                <span className={summary.net < 0 ? "negative" : ""}>
                  {compactMoney(summary.net)}
                </span>
              }
              detail="Dữ liệu giữ nguyên trước lần ETL tiếp theo"
              icon={TrendingUp}
              tone="teal"
            />
          </div>
          <Panel
            title="Bức tranh tài chính ba tháng"
            description="Đơn vị: triệu đồng · Tính theo tiền thực thu và chi phí ghi nhận"
          >
            <div className="financial-chart">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart
                  data={chart}
                  margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="4 5"
                    stroke="#e8edf5"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 13, fill: "#7e8ba2" }}
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
                      border: "1px solid #e6edf6",
                      fontSize: 14,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 13, paddingTop: 15 }} />
                  <Bar
                    name="Thực thu"
                    dataKey="income"
                    fill="#426dc0"
                    radius={[5, 5, 0, 0]}
                    barSize={40}
                  />
                  <Bar
                    name="Chi phí"
                    dataKey="expenses"
                    fill="#c3d3ee"
                    radius={[5, 5, 0, 0]}
                    barSize={40}
                  />
                  <Line
                    name="Lãi / lỗ"
                    type="monotone"
                    dataKey="net"
                    stroke="#28a392"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#fff", strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel
            title="Lãi lỗ theo lớp"
            description="Phân bổ chi phí theo số buổi trong lịch đã nạp."
            action={
              <input
                type="month"
                aria-label="Tháng báo cáo trong kho"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            }
            className="section-gap"
          >
            <ProfitTable summary={summary} showCodes />
          </Panel>
          <div className="two-columns section-gap">
            <Panel
              title="Chuyên cần theo lớp"
              description="Có mặt và muộn / số lượt đã điểm danh"
            >
              <div className="attendance-bars">
                {w.dimCourses
                  .filter((c) => c.status === "Đang mở")
                  .map((c) => {
                    const entries = w.learning.filter(
                      (l) => l.courseId === c.id && l.date <= w.asOfDate,
                    );
                    const rate = entries.length
                      ? Math.round(
                          (entries.filter((l) => l.status !== "Vắng").length /
                            entries.length) *
                            100,
                        )
                      : null;
                    return (
                      <div key={c.id}>
                        <span>
                          {c.name}
                          <small>{entries.length} lượt điểm danh</small>
                        </span>
                        <b>{rate === null ? "—" : rate + "%"}</b>
                        <div className="progress">
                          <i style={{ width: `${rate || 0}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Panel>
            <Panel
              title="Công nợ quá hạn"
              description={`${overdue.length} khoản · ${money(overdue.reduce((a, f) => a + (f.balance || 0), 0))}`}
            >
              <div className="overdue-list">
                {overdue.slice(0, 8).map((f) => (
                  <div key={f.id}>
                    <span className="icon-box orange small">
                      <Wallet size={17} />
                    </span>
                    <div>
                      <strong>{f.studentId}</strong>
                      <small>Hạn {dateLabel(f.due!)}</small>
                    </div>
                    <b>{money(f.balance || 0)}</b>
                  </div>
                ))}
              </div>
              {!overdue.length && <Empty title="Không có khoản quá hạn" />}
            </Panel>
          </div>
        </>
      )}
      {tab === "risks" && (
        <>
          <div className="risk-explainer">
            <div>
              <AlertTriangle size={22} />
              <h3>Nhận diện sớm để quan tâm đúng lúc</h3>
            </div>
            <p>
              Giai đoạn đầu dùng quy tắc; khi đủ dữ liệu sẽ dùng mô hình học
              máy.
            </p>
            <div className="risk-rules">
              {[
                ["Chuyên cần <80%", 30],
                ["Vắng ≥2 buổi liên tiếp", 25],
                ["Điểm giảm so với TB trước", 20],
                ["Nợ quá hạn", 20],
                ["Sắp hết khóa, chưa học tiếp", 5],
              ].map(([label, n]) => (
                <span key={label}>
                  <b>+{n}</b>
                  {label}
                </span>
              ))}
            </div>
          </div>
          <section className="panel">
            <div className="toolbar">
              <h3>Học viên đang học · Xếp theo điểm rủi ro</h3>
              <select
                aria-label="Lọc mức rủi ro"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                {["Tất cả", "Cao", "Trung bình", "Thấp"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>HỌC VIÊN</th>
                    <th>ĐIỂM RỦI RO</th>
                    <th>MỨC</th>
                    <th>CHUYÊN CẦN</th>
                    <th>CÁC DẤU HIỆU</th>
                  </tr>
                </thead>
                <tbody>
                  {riskList
                    .filter((r) => level === "Tất cả" || r.level === level)
                    .map((r) => (
                      <tr key={r.studentId}>
                        <td>
                          <strong>{r.studentId}</strong>
                          <small>
                            Khối{" "}
                            {
                              w.dimStudents.find((s) => s.id === r.studentId)
                                ?.grade
                            }{" "}
                            · Đã ẩn tên
                          </small>
                        </td>
                        <td>
                          <div
                            className={`risk-score ${r.level === "Cao" ? "high" : r.level === "Trung bình" ? "medium" : "low"}`}
                          >
                            <b>{r.score}</b>
                            <span>/100</span>
                          </div>
                        </td>
                        <td>
                          <Badge>{r.level}</Badge>
                        </td>
                        <td>
                          {r.attendance === null
                            ? "Chưa có"
                            : r.attendance + "%"}
                          <small>
                            {r.present}/{r.total} lượt có mặt/muộn
                          </small>
                        </td>
                        <td className="risk-reasons">
                          {r.reasons.length ? (
                            r.reasons.map((x) => (
                              <span key={x.label}>
                                <b>+{x.points}</b>
                                {x.label}
                              </span>
                            ))
                          ) : (
                            <span className="muted">
                              Chưa có dấu hiệu theo bộ quy tắc.
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <footer className="table-footer">
              Cao: từ 50 · Trung bình: 25–49 · Thấp: dưới 25. Điểm hỗ trợ ưu
              tiên chăm sóc, không kết luận học viên sẽ bỏ học.
            </footer>
          </section>
        </>
      )}
      {tab === "suggestions" && (
        <div className="suggestion-grid">
          {suggestedClasses(w).map((c, i) => (
            <article key={c.title} className="suggestion-card">
              <span className={`icon-box ${["blue", "purple", "teal"][i % 3]}`}>
                <Sparkles size={25} />
              </span>
              <Badge tone={c.type === "Đủ tối thiểu" ? "green" : "blue"}>
                {c.type}
              </Badge>
              <h2>{c.title}</h2>
              <p>{c.detail}</p>
              <div>
                <Database size={16} />
                Gợi ý theo dữ liệu kho lần ETL gần nhất
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

export function AgentPage() {
  const { state, running, setRunning, savePlan, notify, act, setModal } =
    useApp();
  const [events, setEvents] = useState<AgentStep[]>([]),
    [tab, setTab] = useState("drafts"),
    [filter, setFilter] = useState("Tất cả");
  const end = useRef<HTMLDivElement>(null);
  const w = state.warehouse,
    o = state.ops;
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [events]);
  async function run() {
    if (!w || running) return;
    setEvents([]);
    setRunning(true);
    try {
      await runCareAgent(w, (step) => setEvents((e) => [...e, step]), savePlan);
      notify("Tác tử mô phỏng đã hoàn tất. Bản nháp vẫn cần quản lý duyệt.");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Tác tử gặp lỗi.", true);
    } finally {
      setRunning(false);
    }
  }
  const candidates = w
    ? risks(w).filter((r) => r.endingCourseId || r.level === "Cao").length
    : 0;
  const pending = o.drafts.filter((d) => d.status === "Chờ duyệt");
  const tasks = o.tasks.filter((t) => t.status === "Cần xử lý");
  const drafts = o.drafts.filter(
    (d) => filter === "Tất cả" || d.status === filter,
  );
  return (
    <>
      <PageHeader
        eyebrow="TẦNG 3 · TÁC TỬ CHĂM SÓC"
        title="Quan tâm đúng lúc, giữ kết nối lâu dài"
        description="Tổng hợp học tập, công nợ và rủi ro để đề xuất chăm sóc cho từng em."
      >
        <button className="btn primary" disabled={running || !w} onClick={run}>
          {running ? (
            <LoaderCircle className="spin" size={18} />
          ) : (
            <Sparkles size={18} />
          )}
          Chạy tác tử chăm sóc
        </button>
      </PageHeader>
      <SnapshotNote />
      <div className="agent-disclosure">
        <span>
          <Sparkles size={17} />
          <strong>Tác tử AI mô phỏng</strong> · Dùng quy tắc cố định và mẫu câu,
          không gọi mô hình AI hoặc dịch vụ ngoài.
        </span>
        <Badge tone="blue">Chờ người duyệt</Badge>
      </div>
      <div className="metrics three">
        <Metric
          label="Học viên cần xét"
          value={candidates}
          detail="Sắp hết khóa hoặc rủi ro Cao trong kho"
          icon={Users}
          tone="blue"
        />
        <Metric
          label="Bản nháp chờ duyệt"
          value={pending.length}
          detail="Chưa có tin nào được tự gửi"
          icon={FileText}
          tone="purple"
        />
        <Metric
          label="Công việc gọi hỏi thăm"
          value={tasks.length}
          detail="Quản lý xử lý và xác nhận hoàn thành"
          icon={Phone}
          tone="orange"
        />
      </div>
      <div className="agent-grid">
        <Panel
          title="Tác tử đang làm"
          description="Tên công cụ, dữ liệu trả về và căn cứ đề xuất được hiển thị từng bước."
          action={
            <Badge tone={running ? "blue" : "gray"}>
              {running ? "Đang xử lý" : "Sẵn sàng"}
            </Badge>
          }
        >
          <div className="agent-console" aria-live="polite">
            {!events.length ? (
              <div className="agent-welcome">
                <span>
                  <Sparkles size={33} />
                </span>
                <h3>Thêm một người đồng hành</h3>
                <p>
                  Từng học viên được xem xét theo dữ liệu.
                  <br />
                  Từng lời nhắn vẫn do bạn quyết định.
                </p>
                <div>
                  <span>Đọc kho dữ liệu</span>
                  <span>Đề xuất chăm sóc</span>
                  <span>Chờ duyệt</span>
                </div>
              </div>
            ) : (
              events.map((e, i) => (
                <div
                  className={`agent-event ${e.summary ? "done" : ""}`}
                  key={i}
                >
                  <span>
                    {e.summary ? <CheckCheck size={17} /> : <Check size={17} />}
                  </span>
                  <div>
                    <code>{e.tool}</code>
                    <p>
                      {e.message.replace(
                        /Nguồn: kho ETL .+$/,
                        "Nguồn: kho ETL gần nhất",
                      )}
                    </p>
                  </div>
                  <small>{String(i + 1).padStart(2, "0")}</small>
                </div>
              ))
            )}
            <div ref={end} />
          </div>
        </Panel>
        <aside className="agent-boundary">
          <span className="icon-box teal">
            <ShieldCheck size={24} />
          </span>
          <h3>Con người giữ quyền quyết định</h3>
          <p>Tác tử đọc kho và chuẩn bị. Quản lý kiểm tra, sửa, rồi duyệt.</p>
          <ul>
            <li>
              <Check size={16} />
              Đọc dữ liệu đã nạp
            </li>
            <li>
              <Check size={16} />
              Tạo nháp và việc gọi điện
            </li>
            <li>
              <Check size={16} />
              Nêu căn cứ từ số liệu
            </li>
          </ul>
          <div className="boundary-note">
            <ShieldCheck size={18} />
            Không tự gửi tin.
            <br />
            Không sửa học phí.
            <br />
            Không ghi nhận thu.
          </div>
        </aside>
      </div>
      <section className="panel section-gap">
        <div className="result-toolbar">
          <div className="tabs">
            <button
              className={tab === "drafts" ? "active" : ""}
              onClick={() => setTab("drafts")}
            >
              Bản nháp tin nhắn <b>{o.drafts.length}</b>
            </button>
            <button
              className={tab === "tasks" ? "active" : ""}
              onClick={() => setTab("tasks")}
            >
              Việc gọi hỏi thăm <b>{o.tasks.length}</b>
            </button>
          </div>
          {tab === "drafts" && (
            <select
              aria-label="Lọc bản nháp"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {["Tất cả", "Chờ duyệt", "Đã gửi", "Bỏ qua"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          )}
        </div>
        {tab === "drafts" &&
          (drafts.length ? (
            <div className="draft-grid">
              {drafts.toReversed().map((d, i) => {
                const st = o.students.find((s) => s.id === d.studentId)!;
                return (
                  <article key={d.id} className="draft-card">
                    <div className="draft-card-head">
                      <Avatar name={st.name} index={i} />
                      <div>
                        <strong>{st.name}</strong>
                        <small>
                          {d.studentId} ·{" "}
                          {d.warehouseAt
                            ? "Từ tác tử mô phỏng"
                            : "Từ nghiệp vụ"}
                        </small>
                      </div>
                      <Badge>{d.status}</Badge>
                    </div>
                    <Badge>{d.kind}</Badge>
                    <p className="draft-content">{d.content}</p>
                    <div className="draft-reason">
                      <Info size={15} />
                      <span>{d.reason}</span>
                    </div>
                    {d.warehouseAt && (
                      <small className="draft-source">
                        Dữ liệu ETL: {dateTime(d.warehouseAt)}
                      </small>
                    )}
                    {d.status === "Chờ duyệt" && (
                      <div className="draft-buttons">
                        <button
                          className="text-btn muted"
                          disabled={running}
                          onClick={() =>
                            act(
                              "skipDraft",
                              { id: d.id },
                              "Đã bỏ qua bản nháp.",
                            )
                          }
                        >
                          Bỏ qua
                        </button>
                        <button
                          className="btn secondary small"
                          disabled={running}
                          onClick={() => setModal({ type: "draft", id: d.id })}
                        >
                          <SquarePen size={15} />
                          Sửa
                        </button>
                        <button
                          className="btn primary small"
                          disabled={running}
                          onClick={() =>
                            act(
                              "approveDraft",
                              { id: d.id },
                              "Quản lý đã duyệt. Tin nhắn đã hiện trong điện thoại giả lập.",
                            )
                          }
                        >
                          <Send size={15} />
                          Duyệt và gửi
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <Empty
              title="Chưa có bản nháp tin nhắn"
              description="Chạy tác tử để tạo các đề xuất dựa trên kho dữ liệu."
            />
          ))}
        {tab === "tasks" &&
          (o.tasks.length ? (
            <div className="tasks-list">
              {o.tasks.toReversed().map((t) => (
                <div key={t.id}>
                  <span className="icon-box orange">
                    <Phone size={20} />
                  </span>
                  <div>
                    <strong>
                      {o.students.find((s) => s.id === t.studentId)?.name}{" "}
                      <small>{t.studentId}</small>
                    </strong>
                    <p>{t.reason}</p>
                    <small>
                      Tác tử AI · Dữ liệu ETL {dateTime(t.warehouseAt)}
                    </small>
                  </div>
                  <Badge>{t.status}</Badge>
                  {t.status === "Cần xử lý" && (
                    <button
                      className="btn secondary small"
                      disabled={running}
                      onClick={() =>
                        act(
                          "completeTask",
                          { id: t.id },
                          "Đã xác nhận hoàn thành việc gọi hỏi thăm.",
                        )
                      }
                    >
                      <Check size={16} />
                      Hoàn thành
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Empty title="Chưa có việc gọi hỏi thăm" />
          ))}
      </section>
    </>
  );
}
