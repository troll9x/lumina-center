# Yêu cầu xây dựng demo: Hệ thống quản lý trung tâm dạy học (bản mới)

Nov 21, 2026 · @Vu Nguyen

## 1. Mục đích và nguyên tắc

Cần xây **từ đầu** một bản demo web của hệ thống quản lý trung tâm dạy học, để trình diễn 5–7 phút trong buổi bảo vệ đề tài cuối kỳ môn Quản trị hệ thống thông tin nâng cao. Tài liệu này đủ để tự xây mà không cần hỏi lại.

**Nguyên tắc quan trọng nhất: đây là demo, không phải sản phẩm.** Ưu tiên chạy trọn luồng nghiệp vụ, giao diện rõ ràng, dữ liệu liên thông giữa các màn hình. Không cần bảo mật thật, không cần hiệu năng.

- **Backend:** dùng SQLite, hoặc chỉ cần dữ liệu trong bộ nhớ lưu vào trình duyệt, miễn là tải lại trang không mất dữ liệu. Không cần máy chủ riêng nếu không cần thiết.
- **AI:** không gọi mô hình AI thật. Phần dự đoán, gợi ý và tác tử AI dùng quy tắc cố định, mẫu câu soạn sẵn và hiệu ứng chạy từng bước, nhưng phải trông giống AI đang làm việc thật.
- **Dịch vụ ngoài:** Zalo, mã QR thanh toán, hóa đơn điện tử đều giả lập ngay trên giao diện.
- **Công nghệ:** tự chọn. Gợi ý một ứng dụng web duy nhất, chạy bằng 1–2 lệnh, ví dụ React + Vite với lưu trữ trong trình duyệt, hoặc Next.js với SQLite.
- Giao diện tiếng Việt toàn bộ; tiền dạng "120.000 đ", ngày dạng "dd/mm/yyyy".

Chỗ ghi **"bắt buộc"** phải có; chỗ ghi **"nên có"** làm nếu còn thời gian.

## 2. Bối cảnh và kiến trúc

Đề tài: **Xây dựng giải pháp hệ thống thông tin quản lý trung tâm dạy học.** Khách hàng giả định là **Trung tâm Tri Thức Việt**, một trung tâm dạy thêm nhỏ ở địa phương:

| Thông tin | Giá trị |
| --- | --- |
| Chủ sở hữu | 3 người góp vốn, cùng làm quản lý, lợi nhuận chia đều |
| Quy mô | 1 cơ sở, khoảng 100 học viên, 7 giáo viên |
| Môn dạy | Toán, Lý, Hóa (THCS, THPT) và Coding |
| Trả lương | Giáo viên được trả theo buổi dạy (ví dụ 300.000 đ/buổi) |

Bốn vấn đề hệ thống phải giải quyết: thất thoát học phí; tính lương thủ công; không rõ lãi lỗ, lớp nào lỗ; mất học viên khi bỏ học hoặc hết khóa.

Hệ thống có **ba tầng**, demo phải thể hiện được cả ba:

1. **Tầng nghiệp vụ:** 5 phân hệ Học viên, Đào tạo, Giáo viên và lương, Tài chính, Quản trị. Ghi nhận việc hằng ngày.
2. **Kho dữ liệu:** dữ liệu từ tầng nghiệp vụ được nạp sang kho (giả lập bằng nút "Chạy ETL").
3. **Tầng nâng cao:** báo cáo quản trị, dự đoán bỏ học, gợi ý mở lớp, tác tử AI. Chỉ đọc từ kho dữ liệu.

## 3. Hai vai trò

Không cần đăng nhập thật. Góc trên màn hình có ô chọn người dùng: 3 quản lý (Anh Minh, Chị Lan, Anh Tuấn) và 7 giáo viên. Đổi người thì menu và dữ liệu đổi theo.

| Nghiệp vụ | Quản lý | Giáo viên |
| --- | --- | --- |
| Học viên | Thêm hồ sơ, xếp lớp, danh sách chờ | Xem danh sách lớp mình |
| Buổi học | Xem mọi lớp | Check-in, điểm danh, nhập điểm lớp mình |
| Học phí | Ghi nhận thu, in phiếu thu | Xem số tiền, đã đóng, còn nợ của học viên lớp mình; bấm "Gửi lại thông báo" cho phụ huynh. **Không** ghi nhận thu, không sửa số tiền |
| Lương | Lập, duyệt bảng lương | Xem số buổi dạy và lương của mình |
| Chi phí, lãi lỗ, chia lợi nhuận | Có | Không |
| Kho dữ liệu, phân tích, tác tử AI | Có | Không |
| Danh mục, cài đặt, nhật ký | Có | Không |

Điểm cần thể hiện khi demo: giáo viên xem được học phí để trả lời phụ huynh, nhưng tiền không đi qua tay giáo viên.

## 4. Tầng nghiệp vụ: 5 phân hệ (bắt buộc)

Các phân hệ dùng chung một bộ dữ liệu. Liên kết giữa chúng phải tự động: nhập ở một nơi, nơi khác thấy ngay.

### 4.1. Học viên

- Hồ sơ học viên (họ tên, ngày sinh, khối, trường) kèm phụ huynh (họ tên, số Zalo).
- Trạng thái: Tiềm năng → Chờ lớp → Đang học → Sắp hết khóa (kết thúc lớp trong 14 ngày) → Học tiếp hoặc Đã nghỉ (lưu lý do nghỉ).
- Xếp học viên vào lớp đang mở, hoặc vào **danh sách chờ** của một lớp dự kiến.
- Thông báo phụ huynh giả lập: tin hiện trong khung "Điện thoại phụ huynh" kiểu Zalo (báo vắng, nhắc học phí, xác nhận đã thu, tin do tác tử AI soạn).

### 4.2. Đào tạo

- Lớp gồm: môn, khối, giáo viên, lịch (ví dụ Thứ 3, 5; 18:00–19:30), số buổi, đơn giá mỗi buổi, sĩ số tối đa, ngày bắt đầu.
- Trạng thái lớp: **Dự kiến → Đang mở → Đã kết thúc**.
- Lớp dự kiến hiển thị **số học viên tối thiểu để có lãi** = làm tròn lên (lương giáo viên mỗi buổi ÷ đơn giá mỗi buổi). Ví dụ 300.000 ÷ 120.000 = 2,5 → 3. Hiển thị "đã có 2/3, còn thiếu 1".
- Nút "Mở lớp" chỉ bật khi đủ số tối thiểu. Mở lớp thì: tự sinh các buổi học theo lịch, học viên trong danh sách chờ chuyển sang Đang học, và Tài chính tự tạo khoản học phí cho từng em.
- Kiểm tra: giáo viên không trùng lịch; lớp không vượt sĩ số tối đa.
- Điểm danh từng buổi: Có mặt / Vắng / Muộn, nhập điểm nếu có. Học viên vắng → tạo tin báo vắng gửi phụ huynh (giả lập).

### 4.3. Giáo viên và lương

- Hồ sơ giáo viên: họ tên, môn dạy, lương mỗi buổi.
- **Check-in** đầu buổi là căn cứ tính lương. Màn hình giáo viên có nút "Check-in" cho buổi hôm nay. Demo cần nút giả lập thời gian (hoặc bỏ qua kiểm tra giờ) để luôn check-in được.
- **Dạy thay:** quản lý đổi người dạy cho một buổi; buổi đó tính lương cho người dạy thay.
- **Bảng lương tháng:** mỗi giáo viên = số buổi đã check-in × lương mỗi buổi + điều chỉnh (thưởng hoặc khấu trừ, có ghi chú). Trạng thái: Nháp → Đã duyệt → Đã trả. Duyệt xong thì tự thành khoản chi lương bên Tài chính.
- Giáo viên xem bảng lương của mình, gồm danh sách từng buổi đã dạy.

### 4.4. Tài chính

- **Khoản phải thu** tự tạo khi học viên vào lớp đang mở: số buổi × đơn giá − ưu đãi. Ưu đãi 10% nếu học viên đang học từ 2 môn trở lên. Hạn đóng 7 ngày sau ngày bắt đầu.
- Mỗi khoản thu có **mã QR giả lập** (có thể sinh mã QR thật từ chuỗi chứa số tiền và mã khoản thu, không cần chạy được).
- Quản lý ghi nhận thu (tiền mặt hoặc chuyển khoản, cho phép thu một phần), in **phiếu thu** dạng trang in được (thay cho hóa đơn điện tử).
- Trạng thái khoản thu: Chưa thu, Thu một phần, Đã thu, Quá hạn.
- **Khoản chi:** quản lý thêm chi phí theo loại (mặt bằng, điện nước, quảng cáo, thiết bị, khác); lương tự thêm từ bảng lương đã duyệt.
- **Lãi lỗ theo tháng:** doanh thu (tiền đã thu) − chi phí.
- **Lãi lỗ theo lớp:** học phí đã thu của lớp − lương giáo viên của lớp − chi phí chung phân bổ theo tỷ lệ số buổi. Lớp lỗ tô màu cảnh báo.
- **Chia lợi nhuận:** (doanh thu − chi phí − quỹ dự phòng 10%) ÷ 3, hiển thị phần của từng người chủ.

### 4.5. Quản trị

- Danh mục môn học, đơn giá mặc định; danh sách người dùng.
- Cài đặt: % ưu đãi nhiều môn, % quỹ dự phòng.
- Nhật ký thao tác: ai làm gì, lúc nào, gồm cả "Tác tử AI".

## 5. Kho dữ liệu và tầng nâng cao

### 5.1. Kho dữ liệu giả lập (bắt buộc)

- Màn hình "Kho dữ liệu" có nút **"Chạy ETL"**. Bấm thì chép và tổng hợp dữ liệu nghiệp vụ sang một bộ bảng riêng, hiển thị thời gian chạy gần nhất và số bản ghi đã nạp.
- Bảng trong kho theo mô hình hình sao: bảng sự kiện **Tài chính** (học phí thu, lương trả, chi phí) và **Học tập** (điểm danh, điểm); bảng chiều Thời gian, Học viên, Giáo viên, Lớp, Môn.
- Học viên trong kho được **ẩn tên**, chỉ còn mã (ví dụ HV-017).
- Mọi màn hình ở 5.2 đến 5.5 **chỉ đọc từ kho**. Có dòng ghi "Dữ liệu tính đến \[thời gian ETL\]" để người xem thấy rõ.

### 5.2. Báo cáo quản trị (bắt buộc, tính thật từ dữ liệu)

Doanh thu, chi phí, lãi lỗ 3 tháng gần nhất; lãi lỗ theo lớp; công nợ quá hạn; tỷ lệ chuyên cần theo lớp. Dùng biểu đồ cột hoặc đường đơn giản.

### 5.3. Dự đoán bỏ học (bắt buộc, dùng quy tắc)

Mỗi học viên đang học có **điểm rủi ro 0–100**:

| Dấu hiệu | Cộng điểm |
| --- | --- |
| Chuyên cần dưới 80% | +30 |
| Vắng từ 2 buổi liên tiếp | +25 |
| Điểm bài gần nhất thấp hơn trung bình trước đó | +20 |
| Nợ học phí quá hạn | +20 |
| Sắp hết khóa, chưa đăng ký khóa sau | +5 |

Mức: từ 50 là Cao, 25–49 là Trung bình, dưới 25 là Thấp. Danh sách sắp theo điểm, mỗi em ghi rõ các dấu hiệu dẫn đến điểm đó. Ghi chú trên màn hình: "Giai đoạn đầu dùng quy tắc; khi đủ dữ liệu sẽ dùng mô hình học máy."

### 5.4. Gợi ý mở lớp (nên có, có thể dùng dữ liệu cố định)

Vài thẻ gợi ý kèm lý do, ví dụ: "Mở Toán 9 nâng cao: 6 học viên Toán 9 sắp hết khóa có điểm từ 7"; "Mở Lý 8: 4 học viên đang chờ, đủ số tối thiểu"; "Học viên Toán thường học thêm Lý (35%)".

### 5.5. Tác tử AI chăm sóc học viên (bắt buộc, giả lập)

**Không gọi AI thật.** Dùng một kịch bản chạy từng bước có độ trễ (khoảng 0,5–1 giây mỗi bước), lấy số liệu thật của dữ liệu mẫu, áp quy tắc cố định và mẫu câu soạn sẵn. Mục tiêu là người xem thấy rõ tác tử đang tự làm nhiều bước.

- Nút **"Chạy tác tử chăm sóc"** trên màn hình quản lý.
- Khung **"Tác tử đang làm"** hiện lần lượt từng dòng, dạng: `Gọi công cụ lay_hoc_vien_can_cham_soc → 6 học viên`, rồi với từng em: `lay_chuyen_can_va_diem(HV-012) → 94%, điểm 6 → 8`, `lay_cong_no(HV-012) → không nợ`, `lay_diem_rui_ro(HV-012) → 5 (Thấp)`, `Kết luận: mời học tiếp`, `tim_lop_tiep_theo(Toán 9) → Toán 9 nâng cao, còn 4 chỗ`, `tao_ban_nhap_tin_nhan(HV-012)`.
- Danh sách học viên cần xét: học viên sắp hết khóa **và** học viên có điểm rủi ro Cao.
- Quy tắc phân loại:

| Tình huống | Tác tử làm |
| --- | --- |
| Đi học đều, điểm ổn định hoặc tăng | Soạn tin mời học tiếp, gợi ý lớp sau |
| Điểm rủi ro Cao | Tạo việc "Gọi điện hỏi thăm" cho quản lý, ghi lý do |
| Nợ học phí quá hạn | Soạn tin nhắc học phí, chưa mời học tiếp |
| Không có lớp tiếp theo phù hợp | Soạn tin cảm ơn, hẹn báo khi có lớp |

- Mẫu tin mời học tiếp: "Trung tâm Tri Thức Việt xin chào Anh/Chị. Khóa \[môn\] của \[tên\] kết thúc ngày \[ngày\]. \[Tên\] đi học \[x\]/\[y\] buổi, điểm kiểm tra tăng từ \[a\] lên \[b\]. Trung tâm mời \[tên\] học tiếp lớp \[lớp mới\], \[lịch\]. Anh/Chị phản hồi để Trung tâm giữ chỗ nhé."
- Kết thúc bằng tóm tắt: bao nhiêu em, mỗi nhóm bao nhiêu.
- Mỗi bản nháp có nút **Duyệt và gửi**, **Sửa**, **Bỏ qua**. Chỉ khi duyệt thì tin mới hiện trên điện thoại phụ huynh. Ghi nhật ký với người thực hiện là "Tác tử AI" cho bước tạo nháp và tên quản lý cho bước duyệt.
- Nên viết phần tác tử thành một module riêng, để sau này thay bằng mô hình AI thật mà không sửa giao diện.

## 6. Dữ liệu mẫu (bắt buộc)

Nạp sẵn khi mở ứng dụng lần đầu, có nút **"Khôi phục dữ liệu mẫu"**. Ngày tính tương đối theo ngày chạy demo (ví dụ "kết thúc sau 5 ngày") để demo đúng vào bất kỳ ngày nào. Tên tiếng Việt, số liệu hợp lý.

- **Môn và đơn giá:** Toán 120.000 đ/buổi, Lý 110.000 đ/buổi, Hóa 110.000 đ/buổi, Coding 150.000 đ/buổi.
- **7 giáo viên**, lương 250.000–350.000 đ/buổi (ví dụ cô Hà dạy Toán 300.000 đ/buổi).
- **10 lớp:** 7 lớp Đang mở (16 buổi mỗi lớp), 2 lớp Dự kiến, 1 lớp Đã kết thúc.
  - Một lớp dự kiến **Toán 9 (tối thứ 3, 5)** đang có 2/3 học viên tối thiểu, để demo xếp thêm 1 em là đủ mở lớp.
  - Một lớp dự kiến **Toán 9 nâng cao** còn chỗ, làm lớp tiếp theo cho tác tử gợi ý.
  - Một lớp đang mở có ít học viên, khiến lãi lỗ theo lớp ra **âm**.
  - Ít nhất 2 lớp kết thúc trong 14 ngày tới.
- **Khoảng 40 học viên**, phần lớn đang học, vài em Chờ lớp, 2 em Đã nghỉ có lý do.
- **Dữ liệu 2–3 tháng trước:** điểm danh, điểm, check-in, khoản thu, khoản chi, bảng lương đã trả, để báo cáo có xu hướng.
- **Khoản chi tháng này:** mặt bằng 8.000.000 đ, điện nước 1.200.000 đ, quảng cáo 1.500.000 đ.
- **Khoản thu ở mọi trạng thái:** chưa thu, thu một phần, đã thu, quá hạn.
- **Học viên cho tác tử** (ít nhất 6 em): 2 em học tốt sắp hết khóa (trong đó em **Nguyễn Minh An**, Toán 9, đi 16/16 buổi, điểm 6 lên 8); 2 em rủi ro Cao (vắng liên tiếp, điểm giảm); 1 em nợ quá hạn; 1 em không có lớp tiếp theo phù hợp.

## 7. Màn hình và kịch bản demo

### 7.1. Màn hình (bắt buộc)

Thanh trên: tên hệ thống, ô chọn người dùng. Menu bên trái đổi theo vai trò.

| Màn hình | Ai thấy | Nội dung chính |
| --- | --- | --- |
| Tổng quan | Cả hai | Quản lý: doanh thu tháng, công nợ quá hạn, số em rủi ro cao. Giáo viên: lớp hôm nay, nút check-in |
| Học viên | Quản lý | Danh sách, thêm hồ sơ, xếp lớp hoặc danh sách chờ, trang chi tiết |
| Lớp học | Quản lý; giáo viên chỉ lớp mình | Danh sách lớp, lớp dự kiến với "đã có x/y tối thiểu", nút mở lớp; chi tiết lớp gồm học viên và tình trạng học phí |
| Buổi học hôm nay | Giáo viên | Check-in, điểm danh, nhập điểm; dùng tốt trên khổ điện thoại |
| Giáo viên và lương | Quản lý; giáo viên chỉ của mình | Danh sách giáo viên, số buổi dạy tháng này, bảng lương, duyệt |
| Tài chính | Quản lý | Khoản thu và ghi nhận thu, phiếu thu, khoản chi, lãi lỗ tháng và theo lớp, chia lợi nhuận |
| Kho dữ liệu | Quản lý | Nút Chạy ETL, thời gian chạy, số bản ghi theo bảng |
| Phân tích | Quản lý | Báo cáo, danh sách rủi ro bỏ học, gợi ý mở lớp |
| Tác tử AI | Quản lý | Nút chạy, khung "Tác tử đang làm", bản nháp chờ duyệt |
| Cài đặt, nhật ký | Quản lý | Danh mục, tỷ lệ, nhật ký thao tác |
| Điện thoại phụ huynh | Cả hai, khung bên mở nhanh | Hộp tin kiểu Zalo hiện các tin hệ thống đã gửi |

### 7.2. Kịch bản demo trên lớp (bắt buộc chạy trọn, khoảng 6 phút)

1. **Quản lý:** thêm giáo viên mới (lương 300.000 đ/buổi). Mở lớp dự kiến Toán 9, thấy "đã có 2/3 tối thiểu".
2. **Quản lý:** thêm học viên mới kèm phụ huynh, xếp vào Toán 9 → đủ 3/3 → bấm Mở lớp. Các buổi học tự sinh; Tài chính tự có khoản học phí cho cả 3 em.
3. **Giáo viên:** check-in buổi hôm nay, điểm danh, đánh vắng 1 em. Mở điện thoại phụ huynh: có tin báo vắng.
4. **Giáo viên:** mở lớp, xem học phí em vừa vào, bấm "Gửi lại thông báo". **Quản lý:** ghi nhận đã thu, in phiếu thu; phụ huynh nhận tin xác nhận.
5. **Quản lý:** xem bảng lương, giáo viên vừa check-in có thêm 1 buổi; duyệt bảng lương. Xem lãi lỗ tháng, lãi lỗ theo lớp (1 lớp lỗ), phần chia cho 3 người chủ.
6. **Quản lý:** bấm Chạy ETL. Mở Phân tích: báo cáo, danh sách rủi ro bỏ học. Chạy tác tử AI, theo dõi từng bước, sửa nhẹ bản nháp gửi mẹ em An, duyệt và gửi; tin hiện trên điện thoại phụ huynh. Mở nhật ký: thấy thao tác của người và của tác tử.

## 8. Tiêu chí hoàn thành

- [ ] Chạy trọn kịch bản 7.2 mà không lỗi, không phải sửa gì giữa chừng.
- [ ] Đổi người dùng thì menu và dữ liệu đổi đúng bảng phân quyền; giáo viên thấy học phí nhưng không có nút ghi nhận thu.
- [ ] Lớp dự kiến hiện đúng số học viên tối thiểu; chỉ mở được khi đủ.
- [ ] Mở lớp tự sinh buổi học và tự tạo khoản học phí đúng công thức, có ưu đãi nhiều môn.
- [ ] Check-in làm tăng số buổi dạy trong bảng lương; duyệt lương tự thành khoản chi.
- [ ] Lãi lỗ tháng, lãi lỗ theo lớp và chia lợi nhuận tính đúng, có ít nhất 1 lớp lỗ.
- [ ] Màn hình phân tích chỉ cập nhật sau khi bấm Chạy ETL, có ghi thời gian dữ liệu.
- [ ] Tác tử AI chạy từng bước có độ trễ, ra đủ 4 loại kết quả, mỗi kết quả có lý do.
- [ ] Không tin nào đến điện thoại phụ huynh nếu chưa được duyệt (trừ tin tự động: báo vắng, xác nhận đã thu).
- [ ] Nhật ký ghi cả thao tác của người và của tác tử.
- [ ] Nút khôi phục dữ liệu mẫu hoạt động.
- [ ] Có README: cài đặt và chạy trong 5 bước trở xuống, ghi rõ phần nào là giả lập.
