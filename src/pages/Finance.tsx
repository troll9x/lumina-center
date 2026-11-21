import { useState } from "react";
import {
  Wallet,
  ReceiptText,
  TrendingUp,
  Plus,
  Search,
  Printer,
  ShieldCheck,
  PiggyBank,
  Users,
  Info,
} from "lucide-react";
import { useApp } from "../context";
import { PageHeader, Metric, Panel, Badge, Avatar, Empty } from "../components";
import {
  invoiceBalance,
  invoiceStatus,
  operationalFacts,
  profitSummary,
} from "../finance.ts";
import { money, compactMoney, dateLabel, today, normalize } from "../utils.ts";
export function ProfitTable({
  summary,
  showCodes = false,
}: {
  summary: ReturnType<typeof profitSummary>;
  showCodes?: boolean;
}) {
  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>LỚP HỌC</th>
              <th>HỌC PHÍ ĐÃ THU</th>
              <th>LƯƠNG GIÁO VIÊN</th>
              <th>CHI PHÍ PHÂN BỔ</th>
              <th>LÃI / LỖ</th>
            </tr>
          </thead>
          <tbody>
            {summary.rows.map((r) => (
              <tr key={r.courseId} className={r.profit < 0 ? "loss-row" : ""}>
                <td>
                  <strong>{r.name}</strong>
                  <small>
                    {showCodes ? r.courseId + " · " : ""}
                    {r.sessions} buổi trong tháng
                  </small>
                </td>
                <td className="amount">{money(r.revenue)}</td>
                <td className="amount">{money(r.salary)}</td>
                <td className="amount">{money(r.shared)}</td>
                <td
                  className={`amount ${r.profit < 0 ? "negative" : "positive"}`}
                >
                  {money(r.profit)}
                  {r.profit < 0 && <Badge tone="red">Lớp lỗ</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {summary.unallocated !== 0 && (
        <div className="inline-notice">
          <Info size={17} />
          Chưa phân bổ {money(summary.unallocated)} chi phí chung do tháng này
          chưa có lịch học.
        </div>
      )}
      <div className="table-footer">
        Chi phí chung phân bổ theo số buổi đã xếp lịch trong tháng. Điều chỉnh
        lương phân bổ theo lương cơ bản từng lớp.
      </div>
    </>
  );
}
export default function FinancePage() {
  const { state, setModal, setPrintReceipt } = useApp(),
    o = state.ops;
  const [tab, setTab] = useState("receivables"),
    [q, setQ] = useState(""),
    [status, setStatus] = useState("Tất cả"),
    [month, setMonth] = useState(today().slice(0, 7));
  const facts = operationalFacts(o),
    summary = profitSummary(
      facts,
      o.courses,
      o.lessons,
      month,
      o.settings.reserveRate,
    );
  const debt = o.invoices.reduce((a, i) => a + invoiceBalance(o, i), 0);
  const rows = o.invoices.filter(
    (i) =>
      normalize(
        i.id + " " + o.students.find((s) => s.id === i.studentId)?.name,
      ).includes(normalize(q)) &&
      (status === "Tất cả" || invoiceStatus(o, i) === status),
  );
  return (
    <>
      <PageHeader
        eyebrow="PHÂN HỆ TÀI CHÍNH"
        title="Rõ từng khoản thu, hiểu từng khoản chi"
        description="Dữ liệu nghiệp vụ cập nhật ngay từ đăng ký lớp, phiếu thu và bảng lương."
      >
        <button
          className="btn secondary"
          onClick={() => setModal({ type: "expense" })}
        >
          <Plus size={18} />
          Thêm khoản chi
        </button>
      </PageHeader>
      <div className="metrics">
        <Metric
          label="Thực thu trong tháng"
          value={compactMoney(summary.income)}
          detail={month.split("-").reverse().join("/")}
          icon={Wallet}
          tone="blue"
        />
        <Metric
          label="Chi phí trong tháng"
          value={compactMoney(summary.expenses)}
          detail="Gồm lương đã duyệt và chi phí chung"
          icon={ReceiptText}
          tone="orange"
        />
        <Metric
          label="Lãi / lỗ trong tháng"
          value={
            <span className={summary.net < 0 ? "negative" : ""}>
              {compactMoney(summary.net)}
            </span>
          }
          detail="Tiền thực thu − chi phí"
          icon={TrendingUp}
          tone="teal"
        />
        <Metric
          label="Tổng công nợ"
          value={compactMoney(debt)}
          detail={`${o.invoices.filter((i) => invoiceBalance(o, i) > 0).length} khoản chưa thu đủ`}
          icon={ShieldCheck}
          tone="purple"
        />
      </div>
      <div className="finance-nav">
        <div className="tabs">
          {[
            ["receivables", "Khoản phải thu"],
            ["receipts", "Phiếu thu"],
            ["expenses", "Khoản chi"],
            ["profit", "Lãi lỗ & phân chia"],
          ].map(([id, name]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
            >
              {name}
            </button>
          ))}
        </div>
        <label className="month-picker">
          Kỳ báo cáo
          <input
            type="month"
            aria-label="Tháng tài chính"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
      </div>
      {tab === "receivables" && (
        <section className="panel">
          <div className="toolbar">
            <div className="search">
              <Search size={18} />
              <input
                aria-label="Tìm học phí"
                placeholder="Tìm học viên hoặc mã khoản thu..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <select
              aria-label="Lọc khoản thu"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {["Tất cả", "Chưa thu", "Thu một phần", "Đã thu", "Quá hạn"].map(
                (x) => (
                  <option key={x}>{x}</option>
                ),
              )}
            </select>
            <span className="toolbar-count">{rows.length} khoản thu</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>HỌC VIÊN / KHOẢN THU</th>
                  <th>PHẢI THU</th>
                  <th>CÒN NỢ</th>
                  <th>HẠN ĐÓNG</th>
                  <th>TRẠNG THÁI</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.toReversed().map((i, j) => {
                  const st = o.students.find((s) => s.id === i.studentId)!;
                  return (
                    <tr key={i.id}>
                      <td>
                        <div className="person">
                          <Avatar name={st.name} index={j} />
                          <span>
                            <strong>{st.name}</strong>
                            <small>{i.id}</small>
                            <small>
                              {o.courses.find((c) => c.id === i.courseId)?.name}
                            </small>
                          </span>
                        </div>
                      </td>
                      <td className="amount">{money(i.amount)}</td>
                      <td
                        className={`amount ${invoiceBalance(o, i) > 0 ? "warning" : "muted"}`}
                      >
                        {money(invoiceBalance(o, i))}
                      </td>
                      <td>{dateLabel(i.due)}</td>
                      <td>
                        <Badge>{invoiceStatus(o, i)}</Badge>
                      </td>
                      <td>
                        <button
                          className="table-btn"
                          onClick={() =>
                            setModal({ type: "payment", id: i.id })
                          }
                        >
                          {invoiceBalance(o, i) > 0
                            ? "Ghi nhận thu"
                            : "Chi tiết"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!rows.length && <Empty title="Không có khoản thu phù hợp" />}
          <footer className="table-footer">
            Khoản phải thu được tạo tự động khi vào lớp đang mở. Hạn đóng: 7
            ngày sau khi bắt đầu lớp.
          </footer>
        </section>
      )}
      {tab === "receipts" && (
        <Panel
          title="Phiếu thu học phí"
          description="Phiếu thu là bản in giả lập, không phải hóa đơn điện tử."
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PHIẾU THU</th>
                  <th>HỌC VIÊN</th>
                  <th>NGÀY THU</th>
                  <th>SỐ TIỀN</th>
                  <th>HÌNH THỨC</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {o.receipts
                  .filter((r) => r.date.startsWith(month))
                  .toReversed()
                  .map((r) => {
                    const i = o.invoices.find((i) => i.id === r.invoiceId)!;
                    return (
                      <tr key={r.id}>
                        <td>
                          <strong>{r.id}</strong>
                          <small>{r.actor}</small>
                        </td>
                        <td>
                          {o.students.find((s) => s.id === i.studentId)?.name}
                        </td>
                        <td>{dateLabel(r.date)}</td>
                        <td className="amount">{money(r.amount)}</td>
                        <td>{r.method}</td>
                        <td>
                          <button
                            className="table-btn"
                            onClick={() => {
                              setPrintReceipt(r.id);
                              setTimeout(() => window.print(), 60);
                            }}
                          >
                            <Printer size={15} />
                            In phiếu thu
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
      {tab === "expenses" && (
        <Panel
          title="Khoản chi trong tháng"
          description="Lương tự sinh từ bảng lương đã duyệt; chi phí khác được quản lý ghi nhận."
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>NỘI DUNG</th>
                  <th>LOẠI CHI PHÍ</th>
                  <th>NGÀY GHI NHẬN</th>
                  <th>SỐ TIỀN</th>
                  <th>TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody>
                {o.expenses
                  .filter((e) => e.date.startsWith(month))
                  .toReversed()
                  .map((e) => (
                    <tr key={e.id}>
                      <td>
                        <strong>{e.description}</strong>
                        <small>{e.id}</small>
                        {e.payrollId && <small>Tự động từ {e.payrollId}</small>}
                      </td>
                      <td>
                        <Badge tone={e.payrollId ? "purple" : "gray"}>
                          {e.category}
                        </Badge>
                      </td>
                      <td>{dateLabel(e.date)}</td>
                      <td className="amount">{money(e.amount)}</td>
                      <td>
                        <Badge tone={e.paid ? "green" : "amber"}>
                          {e.paid ? "Đã chi" : "Đã duyệt, chờ trả"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
      {tab === "profit" && (
        <>
          <Panel
            title="Lãi lỗ theo lớp"
            description={`Tháng ${month.split("-").reverse().join("/")} · Chi phí chung ${money(summary.general)}`}
          >
            <ProfitTable summary={summary} />
          </Panel>
          <Panel
            title="Phân chia lợi nhuận"
            description="Chia đều cho ba người góp vốn sau khi trích quỹ dự phòng."
            className="section-gap"
          >
            <div className="profit-equation">
              <div>
                <span>Lợi nhuận trước dự phòng</span>
                <strong className={summary.net < 0 ? "negative" : ""}>
                  {money(summary.net)}
                </strong>
              </div>
              <span>−</span>
              <div>
                <span>
                  Quỹ dự phòng {o.settings.reserveRate}% lợi nhuận dương
                </span>
                <strong>{money(summary.reserve)}</strong>
              </div>
              <span>=</span>
              <div>
                <span>Có thể phân chia</span>
                <strong>{money(summary.distributable)}</strong>
              </div>
            </div>
            <div className="owners">
              {["Anh Minh", "Chị Lan", "Anh Tuấn"].map((name, i) => (
                <article key={name}>
                  <Avatar name={name} index={i} />
                  <div>
                    <span>{name}</span>
                    <strong>{money(summary.each)}</strong>
                    <small>1/3 lợi nhuận sau dự phòng</small>
                  </div>
                </article>
              ))}
            </div>
            {summary.net <= 0 && (
              <div className="inline-notice">
                <Info size={17} />
                Kỳ này chưa có lợi nhuận dương nên không trích dự phòng hoặc
                chia lợi nhuận.
              </div>
            )}
            {summary.remainder > 0 && (
              <p className="rounding-note">
                Phần lẻ {money(summary.remainder)} giữ lại tại trung tâm để
                không chia vượt lợi nhuận.
              </p>
            )}
          </Panel>
        </>
      )}
    </>
  );
}
