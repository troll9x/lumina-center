import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import type { AppState, User } from "./types.ts";
import { seedState } from "./seed.ts";
import { applyAction } from "./domain.ts";
import { saveCarePlan, type CarePlan } from "./agent.ts";
const KEY = "tri-thuc-viet.demo.v2";
export type Page =
  | "dashboard"
  | "students"
  | "courses"
  | "lessons"
  | "teachers"
  | "finance"
  | "warehouse"
  | "analysis"
  | "agent"
  | "settings"
  | "history";
type Modal = { type: string; id?: string; data?: any } | null;
type Ctx = {
  state: AppState;
  user: User;
  userId: string;
  changeUser: (id: string) => void;
  page: Page;
  setPage: (p: Page) => void;
  modal: Modal;
  setModal: (m: Modal) => void;
  act: (
    action: string,
    p?: Record<string, any>,
    success?: string,
  ) => string | null;
  notify: (text: string, error?: boolean) => void;
  toast: { text: string; error: boolean } | null;
  clearToast: () => void;
  reset: () => void;
  savePlan: (p: CarePlan) => void;
  running: boolean;
  setRunning: (r: boolean) => void;
  phone: boolean;
  setPhone: (v: boolean) => void;
  phoneStudent: string;
  setPhoneStudent: (id: string) => void;
  printReceipt: string;
  setPrintReceipt: (id: string) => void;
};
const Context = createContext<Ctx | null>(null);
function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (
        data.version === 2 &&
        Array.isArray(data.ops?.students) &&
        Array.isArray(data.ops?.courses) &&
        Array.isArray(data.ops?.payrolls)
      )
        return data;
    }
  } catch {}
  return seedState();
}
export function StoreProvider({
  children,
  initialPage = "dashboard",
  initialUserId = "QL-MINH",
}: {
  children: ReactNode;
  initialPage?: Page;
  initialUserId?: string;
}) {
  const [state, setState] = useState<AppState>(load),
    [userId, setUserId] = useState(initialUserId),
    [page, setPage] = useState<Page>(initialPage),
    [modal, setModal] = useState<Modal>(null),
    [toast, setToast] = useState<{ text: string; error: boolean } | null>(null),
    [running, setRunning] = useState(false),
    [phone, setPhone] = useState(false),
    [phoneStudent, setPhoneStudent] = useState(""),
    [printReceipt, setPrintReceipt] = useState("");
  const stateRef = useRef(state);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function notify(text: string, error = false) {
    if (timer.current) clearTimeout(timer.current);
    setToast({ text, error });
    timer.current = setTimeout(() => setToast(null), 6000);
  }
  function commit(next: AppState) {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      stateRef.current = next;
      setState(next);
      return true;
    } catch {
      notify(
        "Trình duyệt không lưu được dữ liệu. Hãy kiểm tra dung lượng hoặc quyền lưu trữ.",
        true,
      );
      return false;
    }
  }
  useEffect(() => {
    if (!localStorage.getItem(KEY)) commit(stateRef.current);
    const sync = (event: StorageEvent) => {
      if (event.key === KEY && event.newValue) {
        try {
          const next = JSON.parse(event.newValue);
          if (next.version === 2) {
            stateRef.current = next;
            setState(next);
          }
        } catch {}
      }
    };
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("storage", sync);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  const user =
    state.ops.users.find((u) => u.id === userId) || state.ops.users[0];
  function changeUser(id: string) {
    if (running) {
      notify("Chờ tác tử hoàn thành trước khi đổi người dùng.", true);
      return;
    }
    setUserId(id);
    setPage("dashboard");
    setModal(null);
    setPhone(false);
  }
  function act(
    action: string,
    p: Record<string, any> = {},
    success = "Đã lưu thay đổi.",
  ) {
    try {
      const result = applyAction(stateRef.current, user.id, action, p);
      if (!commit(result.state)) return null;
      if (success) notify(success);
      return result.value;
    } catch (e) {
      notify(
        e instanceof Error ? e.message : "Không thực hiện được thao tác.",
        true,
      );
      return null;
    }
  }
  function reset() {
    if (commit(seedState())) {
      setUserId("QL-MINH");
      setPage("dashboard");
      setModal(null);
      setPhoneStudent("");
      notify("Đã khôi phục dữ liệu mẫu cho phiên bản 2.");
    }
  }
  function savePlan(plan: CarePlan) {
    const next = saveCarePlan(stateRef.current, plan);
    if (next !== stateRef.current && !commit(next))
      throw new Error("Không lưu được kết quả tác tử.");
  }
  return (
    <Context.Provider
      value={{
        state,
        user,
        userId,
        changeUser,
        page,
        setPage,
        modal,
        setModal,
        act,
        notify,
        toast,
        clearToast: () => setToast(null),
        reset,
        savePlan,
        running,
        setRunning,
        phone,
        setPhone,
        phoneStudent,
        setPhoneStudent,
        printReceipt,
        setPrintReceipt,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useApp() {
  const c = useContext(Context);
  if (!c) throw new Error("Missing provider");
  return c;
}
