import { useEffect, useRef, type ReactNode } from "react";
import { X, Inbox, Database, RefreshCw } from "lucide-react";
import { initials, dateTime } from "./utils.ts";
import { useApp } from "./context";
export function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: string;
}) {
  const map: Record<string, string> = {
    "Đang mở": "green",
    "Đang học": "green",
    "Đã thu": "green",
    "Đã gửi": "green",
    "Đã trả": "green",
    "Hoàn thành": "green",
    "Có mặt": "green",
    Thấp: "green",
    "Dự kiến": "blue",
    "Tiềm năng": "blue",
    "Chờ lớp mới": "blue",
    "Đã kết thúc": "gray",
    "Đã nghỉ": "gray",
    "Bỏ qua": "gray",
    "Quá hạn": "red",
    Cao: "red",
    Vắng: "red",
    "Thu một phần": "amber",
    "Trung bình": "amber",
    Muộn: "amber",
    "Sắp hết khóa": "amber",
    "Chờ lớp": "amber",
    "Chờ duyệt": "violet",
    Nháp: "violet",
    "Đã duyệt": "blue",
    "Cần xử lý": "amber",
    "Nhắc học phí": "amber",
    "Mời học tiếp": "green",
  };
  return (
    <span className={`badge ${tone || map[String(children)] || "gray"}`}>
      {children}
    </span>
  );
}
export function Avatar({ name, index = 0 }: { name: string; index?: number }) {
  return <span className={`avatar a${index % 5}`}>{initials(name)}</span>;
}
export function Metric({
  label,
  value,
  detail,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: ReactNode;
  detail: ReactNode;
  icon: any;
  tone?: string;
}) {
  return (
    <section className="metric">
      <div>
        <span>{label}</span>
        <span className={`icon-box ${tone}`}>
          <Icon size={21} />
        </span>
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </section>
  );
}
export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel-header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
export function Empty({
  title = "Chưa có dữ liệu",
  description = "Các bản ghi mới sẽ xuất hiện ở đây.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="empty">
      <span>
        <Inbox size={26} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`field ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Modal({
  title,
  description,
  children,
  wide = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const { setModal } = useApp();
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const el = ref.current;
    el?.querySelector<HTMLElement>("input,select,textarea,button")?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModal(null);
      if (event.key === "Tab" && el) {
        const nodes = [
          ...el.querySelectorAll<HTMLElement>(
            'button,input,select,textarea,[tabindex="0"]',
          ),
        ].filter((n) => !n.hasAttribute("disabled"));
        const first = nodes[0],
          last = nodes.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          last?.focus();
          event.preventDefault();
        } else if (!event.shiftKey && document.activeElement === last) {
          first?.focus();
          event.preventDefault();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}
    >
      <section
        ref={ref}
        className={`modal ${wide ? "wide-modal" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <header>
          <div>
            <h2 id="dialog-title">{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button
            className="icon-btn"
            aria-label="Đóng cửa sổ"
            onClick={() => setModal(null)}
          >
            <X size={22} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}
export function SnapshotNote() {
  const { state, running, act } = useApp();
  const w = state.warehouse;
  return (
    <div className="snapshot-note">
      <Database size={17} />
      <span>
        {w ? (
          <>
            Dữ liệu tính đến <strong>{dateTime(w.loadedAt)}</strong>{" "}
            <span className="snapshot-tag">
              Kho dữ liệu · Đã ẩn tên học viên
            </span>
          </>
        ) : (
          "Chưa có dữ liệu trong kho. Chạy ETL để bắt đầu."
        )}
        {w && w.sourceRevision !== state.ops.revision && (
          <small>
            Nghiệp vụ đã thay đổi. Cần chạy ETL để cập nhật phân tích.
          </small>
        )}
      </span>
      <button
        className="text-btn"
        disabled={running}
        onClick={() => act("etl", {}, "Đã nạp dữ liệu nghiệp vụ sang kho.")}
      >
        <RefreshCw size={15} />
        Chạy ETL
      </button>
    </div>
  );
}
