import type {
  AppState,
  Operations,
  Course,
  Payroll,
  Invoice,
} from "./types.ts";
import { today, now, addDays, monthOffset, sessionDates } from "./utils.ts";
import { payrollTotal, payrollAllocations } from "./finance.ts";
import { buildWarehouse } from "./warehouse.ts";
export function seedState(): AppState {
  const date = today(),
    month = date.slice(0, 7);
  const o: Operations = {
    students: [],
    teachers: [],
    users: [
      { id: "QL-MINH", name: "Anh Minh", role: "manager" },
      { id: "QL-LAN", name: "Chị Lan", role: "manager" },
      { id: "QL-TUAN", name: "Anh Tuấn", role: "manager" },
    ],
    subjects: [
      { id: "TOAN", name: "Toán", price: 120000 },
      { id: "LY", name: "Lý", price: 110000 },
      { id: "HOA", name: "Hóa", price: 110000 },
      { id: "CODING", name: "Coding", price: 150000 },
    ],
    courses: [],
    enrollments: [],
    lessons: [],
    attendance: [],
    checkins: [],
    invoices: [],
    receipts: [],
    payrolls: [],
    expenses: [],
    drafts: [],
    tasks: [],
    messages: [],
    audit: [],
    settings: { discountRate: 10, reserveRate: 10 },
    revision: 1,
    seedDate: date,
  };
  const teachers = [
    ["Nguyễn Thu Hà", "TOAN", 300000],
    ["Trần Đức Minh", "TOAN", 280000],
    ["Lê Minh Quang", "LY", 270000],
    ["Phạm Lan Hương", "LY", 280000],
    ["Võ Hoàng Phúc", "HOA", 300000],
    ["Đặng Bảo Ngọc", "CODING", 350000],
    ["Bùi Nhật Nam", "CODING", 250000],
  ] as const;
  teachers.forEach(([name, subject, rate], i) => {
    o.teachers.push({
      id: `GV-${i + 1}`,
      name,
      subjectIds: [subject],
      rate,
      phone: `090100000${i}`,
    });
    o.users.push({
      id: `ND-GV-${i + 1}`,
      name,
      role: "teacher",
      teacherId: `GV-${i + 1}`,
    });
  });
  const definitions = [
    [
      "LOP-01",
      "Toán 9 · Vững nền tảng",
      "TOAN",
      9,
      "GV-1",
      -60,
      [2, 4],
      "18:00–19:30",
      "Đang mở",
      5,
    ],
    [
      "LOP-02",
      "Lý 9 · Bứt phá",
      "LY",
      9,
      "GV-3",
      -60,
      [1, 3],
      "18:00–19:30",
      "Đang mở",
      8,
    ],
    [
      "LOP-03",
      "Coding · Python khám phá",
      "CODING",
      9,
      "GV-7",
      -60,
      [3, 5],
      "19:30–21:00",
      "Đang mở",
      10,
    ],
    [
      "LOP-04",
      "Toán 8 · Tư duy & vận dụng",
      "TOAN",
      8,
      "GV-2",
      -22,
      [2, 4],
      "18:00–19:30",
      "Đang mở",
      null,
    ],
    [
      "LOP-05",
      "Lý 10 · Chinh phục cơ học",
      "LY",
      10,
      "GV-4",
      -20,
      [3, 5],
      "18:00–19:30",
      "Đang mở",
      null,
    ],
    [
      "LOP-06",
      "Hóa 11 · Nền tảng vững chắc",
      "HOA",
      11,
      "GV-5",
      0,
      [1, 4],
      "19:30–21:00",
      "Đang mở",
      null,
    ],
    [
      "LOP-07",
      "Coding · Sáng tạo cùng Scratch",
      "CODING",
      8,
      "GV-6",
      -1,
      [0, 6],
      "14:00–15:30",
      "Đang mở",
      null,
    ],
    [
      "LOP-08",
      "Toán 9 · Khóa mới",
      "TOAN",
      9,
      "GV-1",
      0,
      [2, 4],
      "18:00–19:30",
      "Dự kiến",
      null,
    ],
    [
      "LOP-09",
      "Toán 9 nâng cao",
      "TOAN",
      9,
      "GV-2",
      15,
      [1, 3],
      "18:00–19:30",
      "Dự kiến",
      null,
    ],
    [
      "LOP-10",
      "Toán 10 · Khóa trước",
      "TOAN",
      10,
      "GV-2",
      -90,
      [1, 3],
      "16:00–17:30",
      "Đã kết thúc",
      null,
    ],
  ] as const;
  definitions.forEach(
    ([
      id,
      name,
      subjectId,
      grade,
      teacherId,
      offset,
      days,
      time,
      status,
      endOffset,
    ]) => {
      let start = addDays(date, offset);
      if (id === "LOP-06") start = month + "-01";
      if (id === "LOP-10") start = monthOffset(-2) + "-02";
      const dates = sessionDates(start, [...days], 16);
      const c: Course = {
        id,
        name,
        subjectId,
        grade,
        teacherId,
        days: [...days],
        time,
        sessions: 16,
        price: o.subjects.find((s) => s.id === subjectId)!.price,
        capacity: 16,
        start: dates[0],
        end: endOffset !== null ? addDays(date, endOffset) : dates.at(-1)!,
        status,
      };
      o.courses.push(c);
      if (status !== "Dự kiến")
        dates.forEach((d, j) =>
          o.lessons.push({
            id: `BUOI-${id}-${j + 1}`,
            courseId: id,
            date: d,
            teacherId,
            substituteNote: "",
          }),
        );
    },
  );
  const names = [
    "Nguyễn Minh An",
    "Trần Bảo Ngọc",
    "Lê Thanh Bình",
    "Phạm Minh Chi",
    "Võ Quốc Cường",
    "Đặng Thu Hà",
    "Nguyễn Hải Đăng",
    "Trần Tú Anh",
    "Lê Hoàng Phúc",
    "Phạm Quỳnh Như",
    "Võ Thiên Bảo",
    "Bùi Gia Huy",
    "Đỗ Khánh Linh",
    "Ngô Anh Khoa",
    "Dương Thảo Vy",
    "Huỳnh Minh Đức",
    "Vũ Phương Anh",
    "Lý Nhật Nam",
    "Mai Ngọc Mai",
    "Lâm Bảo Châu",
    "Nguyễn Minh Khôi",
    "Trần Ánh Dương",
    "Lê Đình Khang",
    "Phạm Ngọc Diệp",
    "Võ Đức Anh",
    "Đặng Tuệ Nhi",
    "Bùi Quang Huy",
    "Đỗ Ngọc Trâm",
    "Ngô Khánh An",
    "Dương Gia Linh",
    "Huỳnh Thành Đạt",
    "Vũ Thanh Tâm",
    "Lý Minh Quân",
    "Mai Hà My",
    "Lâm Gia Phúc",
    "Nguyễn Bảo Hân",
    "Trần Hoàng Long",
    "Lê Yến Nhi",
    "Phạm Trung Kiên",
    "Võ Nhã Uyên",
  ];
  function addEnrollment(
    studentId: string,
    c: Course,
    index: number,
    historical = false,
  ) {
    const e = {
      id: `DK-${studentId}-${c.id}`,
      studentId,
      courseId: c.id,
      status: historical
        ? ("Hoàn thành" as const)
        : c.status === "Dự kiến"
          ? ("Chờ lớp" as const)
          : ("Đang học" as const),
      created: c.start,
    };
    o.enrollments.push(e);
    if (c.status === "Dự kiến") return;
    const inv: Invoice = {
      id: `HP-${studentId}-${c.id}`,
      enrollmentId: e.id,
      studentId,
      courseId: c.id,
      gross: c.sessions * c.price,
      discount: 0,
      amount: c.sessions * c.price,
      due: addDays(c.start, 7),
      created: c.start,
    };
    o.invoices.push(inv);
    let paid = inv.amount;
    if (index === 4 && !historical) paid -= 600000;
    else if (c.id === "LOP-07" && index % 8 === 1) paid = 0;
    else if (c.id === "LOP-07" && index % 8 !== 1)
      paid = Math.floor(inv.amount / 2);
    let receiptDate =
      month +
      "-" +
      String(
        Math.max(1, Math.min(Number(date.slice(8)), (index % 15) + 1)),
      ).padStart(2, "0");
    if (historical)
      receiptDate =
        monthOffset(-2) + "-" + String(4 + (index % 12)).padStart(2, "0");
    else if (c.id === "LOP-06" || (index % 7 === 0 && index > 6))
      receiptDate = monthOffset(-1) + "-12";
    if (paid)
      o.receipts.push({
        id: `PT-${studentId}-${c.id}`,
        invoiceId: inv.id,
        amount: paid,
        method: index % 2 ? "Tiền mặt" : "Chuyển khoản",
        date: receiptDate,
        actor: "Chị Lan",
      });
    const past = o.lessons.filter((l) => l.courseId === c.id && l.date <= date);
    past.forEach((l, j) => {
      const risk = index === 2 || index === 3;
      const status =
        risk && j >= past.length - 4
          ? ("Vắng" as const)
          : index > 5 && j % 7 === 4
            ? ("Muộn" as const)
            : ("Có mặt" as const);
      const score =
        j === 1
          ? 6
          : j === 5
            ? risk
              ? 7.5
              : 7
            : j === past.length - 1
              ? risk
                ? 4.5
                : 8
              : null;
      o.attendance.push({
        id: `DD-${studentId}-${l.id}`,
        studentId,
        lessonId: l.id,
        status,
        score,
      });
    });
  }
  names.forEach((name, i) => {
    const courseId =
      i < 3
        ? "LOP-01"
        : i < 5
          ? "LOP-02"
          : i === 5
            ? "LOP-03"
            : `LOP-0${4 + ((i - 6) % 4)}`;
    const c = o.courses.find((c) => c.id === courseId)!;
    const grade = i === 35 || i === 36 ? 9 : c.grade;
    const st = {
      id: `HV-${String(i + 1).padStart(3, "0")}`,
      name,
      birth: `${Number(date.slice(0, 4)) - grade - 6}-${String((i % 12) + 1).padStart(2, "0")}-12`,
      grade,
      school: ["THCS Nguyễn Du", "THCS Trần Văn Ơn", "THPT Lê Quý Đôn"][i % 3],
      parent: ["Nguyễn Thị Lan", "Trần Văn Hùng", "Lê Thị Hương"][i % 3],
      zalo: `090${String(2000000 + i)}`,
      status:
        i < 6
          ? "Sắp hết khóa"
          : i < 35
            ? "Đang học"
            : i < 37
              ? "Chờ lớp"
              : i === 37
                ? "Tiềm năng"
                : "Đã nghỉ",
      leaveReason:
        i >= 38
          ? i === 38
            ? "Gia đình chuyển nơi ở"
            : "Thay đổi lịch học chính khóa"
          : "",
      created: addDays(date, -35 - i),
    };
    o.students.push(st);
    if (i < 35) addEnrollment(st.id, c, i);
    else if (i < 37)
      addEnrollment(st.id, o.courses.find((c) => c.id === "LOP-08")!, i);
    if (i < 35 && grade === 10)
      addEnrollment(st.id, o.courses.find((c) => c.id === "LOP-10")!, i, true);
  });
  // Check-in ledgers are distinct from student attendance and freeze the rate
  // applicable to each teaching session, including substitute teachers.
  o.lessons
    .filter((l) => l.date <= date)
    .forEach((l) => {
      const t = o.teachers.find((t) => t.id === l.teacherId)!;
      o.checkins.push({
        id: `CK-${l.id}`,
        lessonId: l.id,
        teacherId: t.id,
        date: l.date,
        time: l.date + "T10:55:00.000Z",
        rate: t.rate,
        simulated: false,
      });
    });
  for (const m of [monthOffset(-2), monthOffset(-1)]) {
    for (const teacher of o.teachers) {
      const checks = o.checkins.filter(
        (c) => c.teacherId === teacher.id && c.date.startsWith(m),
      );
      if (!checks.length) continue;
      const pay: Payroll = {
        id: `LUONG-${teacher.id}-${m}`,
        teacherId: teacher.id,
        month: m,
        checkinIds: checks.map((c) => c.id),
        adjustment: 0,
        note: "Dữ liệu kỳ trước",
        status: "Đã trả",
        approvedAt: m + "-28T08:00:00.000Z",
      };
      o.payrolls.push(pay);
      o.expenses.push({
        id: `CHI-${pay.id}`,
        category: "Lương giáo viên",
        description: `Lương ${teacher.name} · ${m}`,
        amount: payrollTotal(o, pay),
        date: m + "-28",
        payrollId: pay.id,
        allocations: payrollAllocations(o, pay),
        paid: true,
      });
    }
    o.expenses.push(
      {
        id: `CHI-MB-${m}`,
        category: "Mặt bằng",
        description: "Thuê mặt bằng trung tâm",
        amount: 8000000,
        date: m + "-01",
        paid: true,
      },
      {
        id: `CHI-DN-${m}`,
        category: "Điện nước",
        description: "Điện nước kỳ trước",
        amount: m === monthOffset(-1) ? 1100000 : 1000000,
        date: m + "-03",
        paid: true,
      },
      {
        id: `CHI-QC-${m}`,
        category: "Quảng cáo",
        description: "Tuyển sinh kỳ trước",
        amount: m === monthOffset(-1) ? 1300000 : 1000000,
        date: m + "-04",
        paid: true,
      },
    );
  }
  o.expenses.push(
    {
      id: "CHI-MB-NAY",
      category: "Mặt bằng",
      description: "Thuê mặt bằng tháng này",
      amount: 8000000,
      date: month + "-01",
      paid: true,
    },
    {
      id: "CHI-DN-NAY",
      category: "Điện nước",
      description: "Điện và nước tháng này",
      amount: 1200000,
      date: month + "-01",
      paid: true,
    },
    {
      id: "CHI-QC-NAY",
      category: "Quảng cáo",
      description: "Tuyển sinh tháng này",
      amount: 1500000,
      date: month + "-01",
      paid: true,
    },
  );
  o.audit.push({
    id: "NK-MAU",
    actor: "Hệ thống",
    action: "Nạp dữ liệu mẫu phiên bản 2",
    detail:
      "40 học viên · 7 giáo viên · 10 lớp · Kho dữ liệu mẫu đã ẩn tên học viên",
    created: now(),
  });
  return { version: 2, ops: o, warehouse: buildWarehouse(o) };
}
