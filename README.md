# Trung tâm Tri Thức Việt — Demo phiên bản 2

Ứng dụng web xây mới theo [yêu cầu bản mới](docs/yeu-cau-v2.md): **5 phân hệ nghiệp vụ → kho dữ liệu ETL → phân tích và tác tử chăm sóc**. Một cơ sở, ba người quản lý/góp vốn và bảy giáo viên mẫu. React + TypeScript + Vite, dữ liệu lưu trong trình duyệt. Không cần máy chủ nghiệp vụ, cơ sở dữ liệu cài riêng hoặc khóa API.

## Cài đặt và chạy — 4 bước

1. Cài Node.js 22.13 trở lên (bản đã kiểm tra: Node 26); mở terminal tại thư mục `Trung_tam_tri_thuc_Viet`.
2. Chạy `npm install`.
3. Chạy `npm run dev`, rồi mở **http://127.0.0.1:5174**. Hai lệnh là đủ; dữ liệu mẫu tự nạp khi mở lần đầu.
4. Bấm **Xem kịch bản demo** trong menu trái, hoặc đọc [HUONG_DAN_DEMO.md](HUONG_DAN_DEMO.md). Đổi người dùng ở thanh trên. Quản lý vào **Cài đặt → Khôi phục dữ liệu mẫu** để tập lại từ đầu theo ngày hiện tại.

PowerShell chặn `npm.ps1`: dùng `npm.cmd` thay `npm`. Nếu cổng 5174 bận, Vite sẽ in cổng thay thế; mở đúng địa chỉ được in. Dừng máy chủ bằng Ctrl+C.

## Các luồng đã triển khai

- **Học viên:** họ tên, ngày sinh, khối, trường, phụ huynh/số Zalo; trạng thái và lý do nghỉ; xếp lớp đang mở hoặc danh sách chờ.
- **Đào tạo:** lớp Dự kiến/Đang mở/Đã kết thúc; số tối thiểu `ceil(lương mỗi buổi / đơn giá)`; chỉ mở khi đủ; mở lớp tạo 16 buổi và khoản phải thu của toàn bộ danh sách chờ trong một lần lưu. Chặn trùng lịch giáo viên, sai môn, đăng ký trùng, sai khối và quá sĩ số.
- **Giáo viên & lương:** thêm giáo viên đồng thời thêm lựa chọn người dùng; check-in; dạy thay; lương theo từng check-in đã chốt đơn giá, thưởng/khấu trừ có ghi chú; Nháp → Đã duyệt → Đã trả. Duyệt tạo đúng một khoản chi; xác nhận đã trả không tạo thêm chi. Có thể lập bảng bổ sung cho check-in chưa được đưa vào bảng nào.
- **Tài chính:** tự sinh học phí, ưu đãi nhiều môn, thu một phần/toàn phần, QR minh họa, phiếu thu in được, xác nhận thu tới điện thoại giả lập, chi phí chung, lãi lỗ tháng/lớp và chia lợi nhuận.
- **Quản trị:** danh mục môn/đơn giá, tỷ lệ ưu đãi/quỹ dự phòng, người dùng, nhật ký, xuất bản sao JSON và khôi phục dữ liệu mẫu.
- **Kho:** nút ETL có ba bước minh họa; nạp và tổng hợp dữ liệu vào đối tượng kho độc lập. Có hai bảng sự kiện Tài chính/Học tập và năm bảng chiều Thời gian/Học viên/Giáo viên/Lớp/Môn. Xem mô hình hình sao, số bản ghi và dữ liệu mẫu. Chiều Lớp mang lịch ngày học để phân bổ chi phí nhất quán với nghiệp vụ.
- **Phân tích:** biểu đồ ba tháng, lãi lỗ theo lớp, công nợ quá hạn, chuyên cần; điểm rủi ro 0–100 theo đúng năm dấu hiệu; gợi ý mở lớp theo dữ liệu kho. Học viên hiển thị bằng mã, không tên.
- **Tác tử:** xét học viên sắp hết khóa và rủi ro Cao; hiển thị công cụ, kết quả, căn cứ với độ trễ 550 ms/bước. Ra đủ bốn kết quả: mời học tiếp, việc gọi hỏi thăm, nhắc phí quá hạn, cảm ơn/chờ lớp. Bản nháp có Sửa/Lưu nháp, Bỏ qua, Duyệt và gửi; tác tử không tự gửi hoặc sửa tiền. Chạy lại cùng kho không nhân đôi công việc còn mở hoặc lời mời đã gửi từ cùng phiên kho.

## Phạm vi người dùng

**Quản lý** xem và thao tác toàn bộ. **Giáo viên** chỉ thấy lớp được phân công (kể cả buổi dạy thay), buổi học và lương của mình. Giáo viên được xem khoản phải thu/đã đóng/còn nợ của học viên lớp mình, nhưng không có nút hoặc quyền ghi nhận thu, không sửa học phí.

“Gửi lại thông báo” của giáo viên tạo **bản nháp nhắc phí chờ quản lý duyệt**. Đây là lựa chọn để đáp ứng tiêu chí mọi tin nhắn phải được duyệt, ngoại trừ báo vắng và xác nhận đã thu tự động. Quản lý duyệt ở màn hình Tác tử AI.

Đây là phân quyền trình diễn phía trình duyệt, không phải hệ thống xác thực/bảo mật sản phẩm thật. Bộ dữ liệu nằm trên thiết bị đang mở; không đồng bộ sang máy hoặc trình duyệt khác.

## Công thức và quy ước

- Học phí = số buổi × đơn giá đã chốt của lớp − ưu đãi. Ưu đãi 10% mặc định cho **khoản thu mới** khi học viên đang học từ hai môn; khoản cũ không tự tính lại. Hạn đóng = ngày bắt đầu lớp + 7 ngày. Chưa thu đủ và qua hạn thì hiển thị Quá hạn, kể cả đã thu một phần.
- Check-in là căn cứ lương, độc lập với điểm danh học viên. Đổi người dạy trước khi check-in; sau đó không đổi để tránh sai lương. Đơn giá lương được lưu ở từng check-in. Chế độ giả lập cho phép check-in buổi khác ngày và ghi nhận lương vào **ngày hôm nay**, có dấu Giả lập và nhật ký rõ ràng.
- Thực thu = tổng phiếu thu trong tháng. Chi phí gồm chi chung và lương đã duyệt; bảng lương Đã trả vẫn là cùng khoản chi. Lương được ghi nhận vào kỳ tháng của bảng, không phải ngày bấm duyệt.
- Chi phí chung phân bổ theo **số buổi đã xếp lịch** trong tháng; lương/điều chỉnh phân bổ về lớp theo lương cơ bản của các check-in. Kho sử dụng cùng lịch đã nạp nên tổng lớp đối chiếu được với tổng tháng. Không có lịch thì hiện phần chi phí chưa phân bổ.
- Dự phòng = 10% mặc định của **lợi nhuận dương**, rồi chia phần còn lại cho ba người. Tháng lỗ không trích quỹ hoặc chia tiền âm. Phần lẻ đồng sau chia được giữ lại và hiển thị.
- Chuyên cần tính Có mặt và Muộn / lượt đã ghi nhận, không tự coi buổi chưa điểm danh là vắng. Điểm giảm so với **trung bình tất cả điểm trước đó**, không chỉ so với bài ngay trước. Rủi ro Cao ≥50, Trung bình 25–49, Thấp <25.
- Tác tử ưu tiên nợ **quá hạn** trước, sau đó rủi ro cao/học tập cần xác minh, sau đó mời học tiếp hoặc cảm ơn/chờ lớp. Lớp tiếp theo có thể là Dự kiến, được ghi rõ trong tin; chưa tự giữ chỗ hoặc ghi danh.

## Kho và những phần giả lập

Khóa lưu trữ: `tri-thuc-viet.demo.v2`, độc lập với bản Lumina. `AppState.ops` là dữ liệu nghiệp vụ, `AppState.warehouse` là bản sao đã tách tên/điện thoại/phụ huynh. Kho mẫu được nạp cùng dữ liệu lần đầu; sau đó **chỉ thao tác Chạy ETL mới cập nhật kho**. Các màn hình nâng cao ghi thời gian và cảnh báo khi có thay đổi nghiệp vụ chưa nạp. Rủi ro, báo cáo và quy tắc tác tử chỉ nhận đối tượng `Warehouse`, dùng ngày chốt của kho. Riêng lúc tạo bản nháp, mã được tra sang tên học viên ở bước chuẩn bị gửi để viết lời nhắn; bước này không lấy thêm số liệu từ nghiệp vụ.

**AI, Zalo, QR thanh toán, phiếu thu thay hóa đơn điện tử đều là mô phỏng.** Tác tử không gọi LLM, không cần khóa và không phát sinh phí API. QR mã hóa chuỗi `DEMO TRI THUC VIET | mã khoản thu | số tiền VND`; không phải VietQR chuyển tiền thật. Phiếu thu là trang `window.print()`, có nhãn phục vụ demo. Không gửi tin tới số Zalo thật.

40 học viên, 7 giáo viên, 10 lớp (7 mở, 2 dự kiến, 1 kết thúc), số liệu 3 tháng, đủ bốn trạng thái học phí. Lớp Toán 9 khóa mới có 2/3 học viên; Hóa 11 có lãi lỗ tháng âm. Nguyễn Minh An có 16/16 buổi, điểm 6 → 7 → 8. Lớp mẫu của An đã hoàn thành 16 buổi giảng dạy, còn ngày kết thúc khóa hành chính sau 5 ngày để minh họa chăm sóc cuối khóa; lịch và thời gian demo được tính lại lúc khôi phục.

Xóa dữ liệu trình duyệt hoặc đóng cửa sổ riêng tư có thể mất bản lưu. Nút Xuất bản sao tải JSON về máy. Không đưa dữ liệu người thật vào demo nếu không cần thiết.

## Kiểm tra và mã nguồn

```sh
npm test
node scripts/check-render.mjs
npm run build
```

Kiểm thử gồm mở lớp nguyên tử, học phí/ưu đãi, thu một phần, dạy thay/trùng lịch, check-in, duyệt lương không nhân đôi khoản chi, ẩn tên, ETL không tự cập nhật, đối chiếu lãi lỗ và kịch bản 6 phút từ đầu đến duyệt tin. Kiểm tra render chạy React trong Node, **không phải kiểm thử thao tác hoặc ảnh chụp trình duyệt**. Trong phiên xây dựng, Computer Use dừng vì không xác định chắc chắn URL Chrome trên Windows; bố cục và thao tác trực tiếp chưa được xác minh bằng trình duyệt.

`npm run build` tạo thư mục `dist/` để triển khai static; `npm run preview` xem bản build tại http://127.0.0.1:4174. Có thể phục vụ `dist/` bằng máy chủ static khác. Dữ liệu lưu theo origin, nên địa chỉ local và bản trực tuyến có bộ dữ liệu demo riêng.

| Tệp | Vai trò |
| --- | --- |
| `src/types.ts`, `src/domain.ts` | Mô hình và thao tác nghiệp vụ nguyên tử |
| `src/seed.ts` | Dữ liệu mẫu tương đối theo ngày chạy |
| `src/finance.ts` | Học phí, lương, lãi lỗ, phân bổ |
| `src/warehouse.ts` | ETL, ẩn tên, báo cáo, rủi ro, gợi ý |
| `src/agent.ts` | Tác tử quy tắc, tiến trình từng bước, tạo nháp |
| `src/context.tsx` | Lưu/khôi phục localStorage và ngữ cảnh người dùng |
| `src/pages/`, `src/Dialogs.tsx` | Các màn hình và biểu mẫu |
| `src/App.tsx`, `src/styles.css` | Điều hướng theo vai trò, điện thoại và phiếu in |

