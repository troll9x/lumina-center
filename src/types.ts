export type User = {
  id: string;
  name: string;
  role: "manager" | "teacher";
  teacherId?: string;
};
export type Subject = { id: string; name: string; price: number };
export type Student = {
  id: string;
  name: string;
  birth: string;
  grade: number;
  school: string;
  parent: string;
  zalo: string;
  status: string;
  leaveReason: string;
  created: string;
};
export type Teacher = {
  id: string;
  name: string;
  subjectIds: string[];
  rate: number;
  phone: string;
};
export type Course = {
  id: string;
  name: string;
  subjectId: string;
  grade: number;
  teacherId: string;
  days: number[];
  time: string;
  sessions: number;
  price: number;
  capacity: number;
  start: string;
  end: string;
  status: "Dự kiến" | "Đang mở" | "Đã kết thúc";
};
export type Enrollment = {
  id: string;
  studentId: string;
  courseId: string;
  status: "Chờ lớp" | "Đang học" | "Hoàn thành";
  created: string;
};
export type Lesson = {
  id: string;
  courseId: string;
  date: string;
  teacherId: string;
  substituteNote: string;
};
export type Attendance = {
  id: string;
  studentId: string;
  lessonId: string;
  status: "Có mặt" | "Vắng" | "Muộn";
  score: number | null;
};
export type Checkin = {
  id: string;
  lessonId: string;
  teacherId: string;
  date: string;
  time: string;
  rate: number;
  simulated: boolean;
};
export type Invoice = {
  id: string;
  enrollmentId: string;
  studentId: string;
  courseId: string;
  gross: number;
  discount: number;
  amount: number;
  due: string;
  created: string;
};
export type Receipt = {
  id: string;
  invoiceId: string;
  amount: number;
  method: string;
  date: string;
  actor: string;
};
export type Payroll = {
  id: string;
  teacherId: string;
  month: string;
  checkinIds: string[];
  adjustment: number;
  note: string;
  status: "Nháp" | "Đã duyệt" | "Đã trả";
  approvedAt?: string;
};
export type Expense = {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  payrollId?: string;
  allocations?: { courseId: string; amount: number }[];
  paid: boolean;
};
export type Draft = {
  id: string;
  studentId: string;
  kind: string;
  content: string;
  reason: string;
  courseId: string | null;
  status: "Chờ duyệt" | "Đã gửi" | "Bỏ qua";
  created: string;
  warehouseAt: string;
};
export type Task = {
  id: string;
  studentId: string;
  reason: string;
  status: "Cần xử lý" | "Hoàn thành";
  created: string;
  warehouseAt: string;
};
export type Message = {
  id: string;
  studentId: string;
  content: string;
  type: string;
  created: string;
};
export type Audit = {
  id: string;
  actor: string;
  action: string;
  detail: string;
  created: string;
};
export type Operations = {
  students: Student[];
  teachers: Teacher[];
  users: User[];
  subjects: Subject[];
  courses: Course[];
  enrollments: Enrollment[];
  lessons: Lesson[];
  attendance: Attendance[];
  checkins: Checkin[];
  invoices: Invoice[];
  receipts: Receipt[];
  payrolls: Payroll[];
  expenses: Expense[];
  drafts: Draft[];
  tasks: Task[];
  messages: Message[];
  audit: Audit[];
  settings: { discountRate: number; reserveRate: number };
  revision: number;
  seedDate: string;
};
export type FactFinance = {
  id: string;
  date: string;
  kind: "Thu học phí" | "Lương" | "Chi phí" | "Phải thu";
  amount: number;
  courseId: string | null;
  studentId: string | null;
  teacherId: string | null;
  balance?: number;
  due?: string;
  category?: string;
};
export type FactLearning = {
  id: string;
  date: string;
  studentId: string;
  courseId: string;
  teacherId: string;
  status: string;
  score: number | null;
};
export type DimStudent = { id: string; grade: number; status: string };
export type Warehouse = {
  loadedAt: string;
  asOfDate: string;
  sourceRevision: number;
  financial: FactFinance[];
  learning: FactLearning[];
  dimTime: { id: string; month: string; year: number }[];
  dimStudents: DimStudent[];
  dimTeachers: {
    id: string;
    name: string;
    subjectIds: string[];
    rate: number;
  }[];
  dimCourses: (Course & { lessonDates: string[] })[];
  dimSubjects: Subject[];
  enrollments: Enrollment[];
  settings: { discountRate: number; reserveRate: number };
};
export type AppState = {
  version: 2;
  ops: Operations;
  warehouse: Warehouse | null;
};
export type Risk = {
  studentId: string;
  score: number;
  level: "Cao" | "Trung bình" | "Thấp";
  reasons: { label: string; points: number }[];
  attendance: number | null;
  consecutive: number;
  scores: number[];
  present: number;
  total: number;
  overdue: number;
  debt: number;
  endingCourseId: string | null;
  hasNext: boolean;
};
