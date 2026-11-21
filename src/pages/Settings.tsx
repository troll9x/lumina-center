import { useState } from "react";
import {
  Settings2,
  BookOpen,
  SquarePen,
  Users,
  RefreshCw,
  Search,
  ShieldCheck,
  Download,
} from "lucide-react";
import { useApp } from "../context";
import { PageHeader, Panel, Field, Badge, Avatar } from "../components";
import { money, dateTime, normalize, today } from "../utils.ts";
export function SettingsPage() {
  const { state, setModal, act, notify } = useApp(),
    o = state.ops;
  function exportData() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `tri-thuc-viet-demo-${today()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify("Đã xuất bản sao dữ liệu demo.");
  }
  return (
    <>
      <PageHeader
        eyebrow="PHÂN HỆ QUẢN TRỊ"
        title="Thiết lập cho một hệ thống thống nhất"
        description="Danh mục, tỷ lệ vận hành và các vai trò của trung tâm."
      />
      <div className="two-columns">
        <Panel
          title="Danh mục môn học"
          description="Đơn giá mặc định dùng cho lớp tạo mới."
        >
          <div className="catalog-list">
            {o.subjects.map((s, i) => (
              <div key={s.id}>
                <span
                  className={`icon-box ${["blue", "teal", "orange", "purple"][i]}`}
                >
                  <BookOpen size={21} />
                </span>
                <div>
                  <strong>{s.name}</strong>
                  <small>{money(s.price)}/buổi</small>
                </div>
                <button
                  className="icon-btn"
                  aria-label={`Sửa đơn giá ${s.name}`}
                  onClick={() => setModal({ type: "subject", id: s.id })}
                >
                  <SquarePen size={19} />
                </button>
              </div>
            ))}
          </div>
        </Panel>
        <Panel
          title="Chính sách vận hành"
          description="Áp dụng cho nghiệp vụ mới; dữ liệu phân tích cập nhật sau ETL."
        >
          <form
            className="settings-form"
            onSubmit={(e) => {
              e.preventDefault();
              act(
                "settings",
                Object.fromEntries(new FormData(e.currentTarget)),
                "Đã cập nhật tỷ lệ. Kho dữ liệu chỉ đổi sau ETL.",
              );
            }}
          >
            <Field label="Ưu đãi khi đang học từ hai môn (%)">
              <input
                name="discountRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                defaultValue={o.settings.discountRate}
                required
              />
            </Field>
            <Field label="Quỹ dự phòng trên lợi nhuận dương (%)">
              <input
                name="reserveRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                defaultValue={o.settings.reserveRate}
                required
              />
            </Field>
            <button className="btn primary">Lưu cài đặt</button>
          </form>
        </Panel>
      </div>
      <Panel
        title="Người dùng & phân quyền demo"
        description="Ba quản lý là ba người góp vốn. Giáo viên được tạo tài khoản chọn vai trò cùng hồ sơ."
        className="section-gap"
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>NGƯỜI DÙNG</th>
                <th>VAI TRÒ</th>
                <th>PHẠM VI</th>
              </tr>
            </thead>
            <tbody>
              {o.users.map((u, i) => (
                <tr key={u.id}>
                  <td>
                    <div className="person">
                      <Avatar name={u.name} index={i} />
                      <strong>{u.name}</strong>
                    </div>
                  </td>
                  <td>
                    <Badge tone={u.role === "manager" ? "blue" : "teal"}>
                      {u.role === "manager" ? "Quản lý" : "Giáo viên"}
                    </Badge>
                  </td>
                  <td>
                    {u.role === "manager"
                      ? "Nghiệp vụ, tài chính, kho dữ liệu, phân tích và duyệt tin"
                      : "Lớp được phân công, check-in, học phí chỉ xem, lương cá nhân"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="reset-box">
        <div>
          <h3>Dữ liệu phục vụ trình diễn</h3>
          <p>
            Lưu trên trình duyệt này. Khôi phục để có lại 40 học viên, 7 giáo
            viên và tình huống 2/3 học viên chờ mở lớp.
          </p>
        </div>
        <div>
          <button className="btn secondary" onClick={exportData}>
            <Download size={17} />
            Xuất bản sao
          </button>
          <button
            className="btn secondary"
            onClick={() => setModal({ type: "reset" })}
          >
            <RefreshCw size={17} />
            Khôi phục dữ liệu mẫu
          </button>
        </div>
      </div>
    </>
  );
}
export function HistoryPage() {
  const { state } = useApp();
  const [q, setQ] = useState(""),
    [actor, setActor] = useState("Tất cả");
  const rows = state.ops.audit.filter(
    (a) =>
      normalize(a.actor + " " + a.action + " " + a.detail).includes(
        normalize(q),
      ) &&
      (actor === "Tất cả" || a.actor === actor),
  );
  return (
    <>
      <PageHeader
        eyebrow="PHÂN HỆ QUẢN TRỊ"
        title="Mọi thao tác đều có dấu vết"
        description="Xem ai làm gì, khi nào — từ nghiệp vụ đến đề xuất của tác tử."
      />
      <section className="panel">
        <div className="toolbar">
          <div className="search">
            <Search size={18} />
            <input
              aria-label="Tìm nhật ký"
              placeholder="Tìm người thực hiện, hành động hoặc mã hồ sơ..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            aria-label="Lọc người thực hiện"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
          >
            {[
              "Tất cả",
              "Tác tử AI",
              ...new Set(
                state.ops.audit
                  .map((a) => a.actor)
                  .filter((x) => x !== "Tác tử AI"),
              ),
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <span className="toolbar-count">{rows.length} thao tác</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>THỜI GIAN</th>
                <th>NGƯỜI THỰC HIỆN</th>
                <th>HÀNH ĐỘNG</th>
                <th>CHI TIẾT</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="nowrap">{dateTime(a.created)}</td>
                  <td>
                    <Badge tone={a.actor === "Tác tử AI" ? "purple" : "gray"}>
                      {a.actor}
                    </Badge>
                  </td>
                  <td>
                    <strong>{a.action}</strong>
                  </td>
                  <td className="audit-detail">{a.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
