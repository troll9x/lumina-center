# Lumina — Hệ thống quản lý trung tâm dạy học

Ứng dụng web tiếng Việt cho bài cuối kỳ: bốn phân hệ dùng chung dữ liệu và tác tử chăm sóc tái đăng ký có người duyệt. React + TypeScript + Vinext; API chạy trên Cloudflare Workers, dữ liệu D1/SQLite. Node.js từ 22.13 trở lên, Git và kết nối Internet để cài gói; kiểm thử hiện tại dùng Node 26 trên Windows.

## Chạy trên máy trong 5 bước

1. Mở terminal tại thư mục `lumina-center`, chạy `npm ci`.
2. Nếu có Claude API key, tạo `.dev.vars` ở thư mục gốc theo `.env.example`. Không có khóa vẫn dùng được nghiệp vụ và chế độ **Diễn tập**. Không đưa khóa vào mã nguồn hoặc trình duyệt.
3. Chạy `npm run demo`. Lệnh tự build và áp dụng migration SQLite còn thiếu, sau đó mở máy chủ tại `http://127.0.0.1:5173`. Dữ liệu được nạp tự động khi truy cập lần đầu. Dừng bằng Ctrl+C. Lần sau dùng lại cùng lệnh; dữ liệu vẫn còn.
4. Mở địa chỉ trên. Đổi vai trò ở thanh trên; để đổi cơ sở, chọn Giám đốc, đổi cơ sở, rồi chuyển về vai trò cần trình diễn.
5. Thực hiện kịch bản trong `HUONG_DAN_DEMO.txt`. Giám đốc vào Danh mục > Khôi phục dữ liệu mẫu để tập lại. Nút này thay toàn bộ dữ liệu demo hiện tại.

Nếu PowerShell chặn `npm.ps1`, dùng `npm.cmd` thay `npm`. Nếu cổng 5173 đang được sử dụng, dừng máy chủ cũ trước khi chạy một bản mới. Không chạy hai bản demo cùng cổng.

## Những gì đã làm

- Hồ sơ học viên và phụ huynh, tìm kiếm/lọc, đăng ký thêm lớp, trang chi tiết học tập, công nợ và lịch sử chăm sóc.
- Đăng ký lớp và sinh khoản phải thu trong cùng một lần lưu nguyên tử. Chặn đăng ký trùng, sai cơ sở/khối và lớp đầy.
- Mở lớp, tự sinh đủ buổi theo thứ trong tuần. Kiểm tra giáo viên đúng môn/cơ sở và không trùng ngày, giờ.
- Điểm danh Có mặt / Vắng / Muộn; điểm từ 0 đến 10. Lưu vắng mới sẽ tạo thông báo cho phụ huynh giả lập; lưu lại cùng trạng thái không gửi trùng.
- Học phí = số buổi × đơn giá lớp − ưu đãi. Ưu đãi 10% áp dụng cho **khoản thu mới** khi học viên có ít nhất hai môn đang học; không tính lại khoản đã lập. Hạn đóng là 7 ngày sau ngày bắt đầu lớp.
- QR thực sự mã hóa chuỗi `DEMO LUMINA | mã khoản thu | số tiền VND`. Đây là QR minh họa, không phải VietQR chuyển khoản ngân hàng.
- Kế toán ghi nhận thu một phần/toàn phần và lập phiếu thu. Công nợ = khoản phải thu trừ tổng phiếu thu; chặn thu vượt số dư. Quá hạn được ưu tiên hiển thị nếu vẫn còn nợ sau hạn.
- Dashboard, tiền thực thu tháng theo cơ sở, chuyên cần theo lớp, học viên mới và tỷ lệ tái đăng ký. Nhật ký ghi thao tác người dùng và công cụ của tác tử.
- 3 cơ sở, 60 học viên, 15 giáo viên, 12 lớp; điểm danh/điểm quá khứ và đủ 4 trạng thái học phí. Ngày mẫu tính tương đối theo thời điểm khôi phục, theo múi giờ Việt Nam.

## Tác tử AI thật và diễn tập

Cấu hình `.dev.vars`:

```dotenv
ANTHROPIC_API_KEY=khóa_của_bạn
ANTHROPIC_MODEL=claude-sonnet-4-6
```

Khởi động lại máy chủ sau khi thêm/sửa khóa. Với bản Sites đã triển khai, cần cấu hình hai biến tương ứng trong môi trường máy chủ; `.dev.vars` trên máy không tự chuyển lên Sites. Khóa không được commit và không có ô nhập khóa trong giao diện. Model có thể đổi sang một model Claude hỗ trợ tool use mà tài khoản có quyền sử dụng.

**Chạy tác tử AI** gọi Anthropic Messages API. LLM tự chọn công cụ và thứ tự; máy chủ thực thi, trả `tool_result` rồi tiếp tục vòng lặp. Sáu công cụ: `lay_hoc_vien_sap_het_khoa`, `lay_chuyen_can_va_diem`, `lay_cong_no`, `tim_lop_tiep_theo`, `tao_ban_nhap_tin_nhan`, `tao_viec_cho_nguoi`. Máy chủ kiểm tra phạm vi cơ sở, việc đọc đủ dữ liệu và tính hợp lệ của công cụ ghi. Tối đa 40 lượt công cụ, 25 vòng API; ghi nhật ký và truyền tiến trình qua SSE. Không kết thúc thành công nếu chưa xử lý đủ danh sách.

Quy tắc ưu tiên theo yêu cầu trong cuộc trò chuyện: còn **bất kỳ công nợ dương** thì giao kế toán trước (rộng hơn quy tắc chỉ nợ quá hạn trong `mota.txt`); sau đó xét chuyên cần dưới 80%, vắng từ 2 buổi liên tiếp hoặc điểm gần nhất giảm để giao tư vấn viên. Thiếu dữ liệu cũng chuyển tư vấn viên kiểm tra. Học tập tốt, không nợ thì tìm lớp tiếp theo cùng môn, khối, cơ sở, bắt đầu sau lớp cũ và còn chỗ. Không có lớp thì tạo tin cảm ơn/hẹn thông báo. Quy tắc được đưa vào system prompt; máy chủ có chốt kiểm tra để chặn kết quả ghi không hợp lệ.

**Diễn tập** chạy các quy tắc cố định, không gọi LLM, có nhãn riêng trong tiến trình, bản nháp và nhật ký. Nó phục vụ tập trình bày trước khi có khóa API và không được xem là bằng chứng tác tử LLM đã chạy.

Tác tử chỉ nhận tên học viên, số liệu học tập/công nợ và thông tin lớp; không nhận số điện thoại hoặc địa chỉ. Không có công cụ gửi tin hay sửa tiền. Tin chỉ xuất hiện trong điện thoại giả lập sau khi tư vấn viên bấm duyệt. Lỗi API được hiển thị rõ, không tự chuyển sang mô phỏng. Các bản nháp đã tạo trước lỗi vẫn chờ duyệt; sổ học phí không bị thay đổi.

Dữ liệu mẫu CS1: An và Bảo Ngọc học tốt; Bình vắng liên tiếp; Minh Chi điểm giảm; Quốc Cường còn nợ; Thu Hà học tốt nhưng chưa có lớp Coding tiếp theo. Học viên mới được thêm sẽ được phân loại theo dữ liệu tại thời điểm chạy. Lịch thứ Hai là lịch vận hành đề xuất; bản demo dùng nút kích hoạt theo phạm vi tài liệu, **chưa cài lịch tự động**.

Tham khảo giao thức: [Anthropic — Handle tool calls](https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls).

## Dữ liệu và quyền demo

`db/schema.ts` khai báo bảng `center_state` trong D1. Cột JSON lưu các tập nghiệp vụ: học viên/phụ huynh, giáo viên, lớp, buổi học, đăng ký, điểm danh, khoản phải thu, phiếu thu, bản nháp, công việc, tin nhắn, danh mục và nhật ký. Đây là mô hình lưu snapshot cho demo, **chưa phải lược đồ 15 bảng quan hệ chuẩn hóa** trong tài liệu gợi ý. Toàn bộ tập dữ liệu được cập nhật nguyên tử; kiểm tra phiên bản và thử lại khi có ghi đồng thời giúp tránh ghi đè mất phiếu thu hoặc đăng ký. Dữ liệu tồn tại ở máy chủ, không lưu nghiệp vụ trong localStorage. Local và bản triển khai là hai cơ sở dữ liệu độc lập.

API lọc phạm vi cơ sở và kiểm tra vai trò khi ghi. Giáo viên chỉ nhận lớp được phân công, không nhận khoản thu, phiếu thu, bản nháp hay số liên lạc phụ huynh. Bộ chọn vai trò truyền ngữ cảnh demo qua header; đây là cơ chế trình diễn theo yêu cầu **không đăng nhập thật**, chưa thay thế xác thực/ủy quyền cho một hệ thống vận hành thực tế. Sites giữ quyền truy cập riêng tư ở lớp hosting.

Công thức chuyên cần tính Có mặt và Muộn trên các lượt đã ghi nhận; buổi chưa điểm danh không tự coi là vắng. Điểm giảm so với bài có điểm ngay trước đó. Tiền thu trong báo cáo là tiền thực thu, chưa phân bổ doanh thu kế toán theo buổi. Tỷ lệ tái đăng ký = học viên đã kết thúc khóa và có lớp tiếp theo cùng môn / học viên đã kết thúc khóa; hiển thị “—” nếu chưa có mẫu đủ điều kiện. Tra cứu báo cáo nhanh dùng công thức có sẵn, được ghi rõ **không dùng LLM**; trợ lý báo cáo LLM và trang niêm yết công khai là phần mở rộng chưa làm.

## Kiểm tra và cấu trúc mã

- `npm test`: các kiểm thử nghiệp vụ quan trọng, phân quyền và duyệt tin.
- `npx tsc --noEmit`: kiểm tra TypeScript.
- `npm run build`: kiểm tra build.
- `tests/integration.mjs`: kiểm tra API/D1 trên máy chủ QA riêng ở cổng 5181; không chạy trên dữ liệu đang demo. Kết quả thiếu khóa kiểm tra thông báo lỗi, không xác nhận kết nối LLM thật.

`app/center-app.tsx`: giao diện; `app/lumina.css`: bố cục responsive; `lib/domain.ts`: nghiệp vụ và dữ liệu mẫu; `lib/store.ts`: lưu dữ liệu và chống ghi đè; `lib/agent.ts`: công cụ, vòng lặp LLM và diễn tập; `app/api`: API; `drizzle`: migration; `.openai/hosting.json`: cấu hình triển khai Sites.

Không có thanh toán, gửi Zalo, đối soát ngân hàng, đăng nhập mật khẩu hoặc ứng dụng di động riêng trong demo này.
