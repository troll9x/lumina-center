# Kịch bản bảo vệ khoảng 6 phút

Chuẩn bị: `npm install`, `npm run dev`, mở địa chỉ Vite in ra. Chọn **Anh Minh**. Nếu đã diễn tập, vào **Cài đặt → Khôi phục dữ liệu mẫu**.

1. **Giáo viên & lương:** thêm một giáo viên môn Toán, lương 300.000 đ/buổi. Vào **Lớp học → Dự kiến**, tìm **Toán 9 · Khóa mới**: đang có **2/3 tối thiểu**, nút Mở lớp chưa bật.
2. Bấm biểu tượng thêm học viên của lớp, nhập học viên khối 9 kèm phụ huynh và số Zalo 10 chữ số. Lưu vào đúng lớp. Lớp nay **3/3**, bấm **Mở lớp**. Xem chi tiết: đã có 16 buổi, ba học viên và ba khoản học phí. Không phải nhập lại ở Tài chính.
3. Đổi người dùng sang **Nguyễn Thu Hà**. Vào **Buổi học**, giữ bật **Giả lập thời gian**. Chọn buổi đầu của **Toán 9 · Khóa mới** (mặc định ưu tiên buổi sắp tới chưa check-in). Bấm **Check-in đầu buổi**; đánh vắng học viên mới, nhập điểm nếu cần, bấm **Lưu điểm danh**. Mở **Điện thoại phụ huynh** để xem báo vắng.
4. Vẫn là giáo viên: vào **Lớp học → Toán 9 · Khóa mới → Xem chi tiết**. Thấy phải thu, đã đóng, còn nợ và **Gửi lại thông báo**, nhưng không có nút nhận tiền. Bấm gửi lại để tạo nháp chờ quản lý duyệt. Đổi **Anh Minh**, vào **Tài chính**, khoản mới nằm ở đầu danh sách. Ghi nhận thu toàn bộ hoặc một phần; bấm biểu tượng in ở phiếu thu. Điện thoại nhận xác nhận đã thu tự động.
5. Vào **Giáo viên & lương**: cô Hà có thêm một check-in. Bấm **Lập bảng lương**, thêm thưởng/khấu trừ có ghi chú nếu muốn, rồi **Duyệt lương**. Sang **Tài chính → Khoản chi** thấy lương tự sinh. Vào **Lãi lỗ & phân chia**: đối chiếu tiền thực thu, chi phí, lớp Hóa 11 lỗ, dự phòng và phần của Anh Minh/Chị Lan/Anh Tuấn.
6. Vào **Kho dữ liệu → Chạy ETL**. Mở **Phân tích**: thấy thời gian chốt dữ liệu, ba tháng tài chính, rủi ro chỉ hiện mã học viên và lý do cộng điểm. Vào **Tác tử AI → Chạy tác tử chăm sóc**; chờ khoảng 20 giây. Có đủ lời mời, nhắc phí, cảm ơn chờ lớp và việc gọi hỏi thăm. Tìm nháp **Nguyễn Minh An**, sửa một chữ rồi **Duyệt và gửi**. Tin hiện trong điện thoại. **Nhật ký hoạt động** có Tác tử AI khi tạo nháp và Anh Minh khi duyệt.

Có thể chứng minh ETL tách biệt: ghi thêm một khoản thu/chi, mở Phân tích để thấy số liệu kho vẫn giữ nguyên; bấm Chạy ETL mới thấy số liệu mới. Kho không chứa tên/số điện thoại học viên. Tác tử là mô phỏng quy tắc, không gọi AI thật.

Dạy thay: quản lý mở chi tiết lớp, chọn một buổi chưa check-in và bấm **Dạy thay**; chọn giáo viên đúng môn, không trùng lịch. Người thay mới check-in và nhận lương. Giáo viên Toán mới thêm có thể dùng cho bước này nếu lịch giáo viên khác bị trùng.
