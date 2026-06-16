# Hướng dẫn Chạy Backend API - Karaoke Management System

Dự án này là backend RESTful API phục vụ quản lý quán Karaoke, được lập trình bằng **Node.js** và **Express.js**, sử dụng thư viện **`mysql2/promise`** để tương tác với cơ sở dữ liệu MySQL 8.0.

Hệ thống được thiết kế để bắt các lỗi logic nghiệp vụ từ database (các lỗi ném ra bởi lệnh `SIGNAL SQLSTATE '45000'` trong các Stored Procedure) và phản hồi về client với HTTP Status `400` cùng thông tin lỗi tương ứng.

---

## 1. Yêu cầu Hệ thống
- **Node.js** (Phiên bản v16 trở lên)
- **MySQL Server** (Phiên bản 8.0 trở lên) chứa đầy đủ cấu trúc bảng và các Stored Procedure (`sp_DatPhong`, `sp_ThemDichVu`, `sp_ThanhToan`, `sp_Transaction_ChotLuongHeThong`, `sp_ThanhToanLuong`).

---

## 2. Cài đặt ban đầu

1. **Cấu hình biến môi trường**:
   - Mở file `.env` nằm ở thư mục gốc của dự án `web_demo`.
   - Cập nhật thông tin tài khoản MySQL của bạn:
     ```env
     PORT=5000
     DB_HOST=localhost
     DB_PORT=3306
     DB_USER=root
     DB_PASSWORD=mật_khẩu_mysql_của_bạn
     DB_NAME=quanlyKaraoke
     ```

2. **Cài đặt các gói thư viện**:
   Chạy lệnh sau tại thư mục `web_demo` để cài đặt dependencies:
   ```bash
   npm install
   ```

---

## 3. Chạy Ứng dụng

### Chạy ở chế độ phát triển (Development)
Chạy bằng `nodemon` để tự động khởi động lại server khi có thay đổi code:
```bash
npm run dev
```

### Chạy ở chế độ sản phẩm (Production)
Chạy server thông thường:
```bash
npm start
```

---

## 4. Danh sách các RESTful API và cách gọi

### 4.1. Lấy danh sách toàn bộ phòng và trạng thái
- **Endpoint**: `GET /api/rooms`
- **Mô tả**: Trả về danh sách tất cả các phòng kèm theo tên loại phòng và giá theo giờ tương ứng.
- **Phản hồi mẫu (HTTP 200)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "MaPhong": 1,
        "TenPhong": "Phòng Vip 101",
        "TrangThai": "Trống",
        "MaLoaiPhong": 1,
        "TenLoaiPhong": "Vip",
        "GiaTheoGio": "200000"
      }
    ]
  }
  ```

---

### 4.2. Đặt/mở phòng hát
- **Endpoint**: `POST /api/bookings`
- **Mô tả**: Gọi stored procedure `sp_DatPhong` để mở phòng trống cho khách hàng.
- **Body Request**:
  ```json
  {
    "MaPhong": 1,
    "MaNV": 2,
    "MaKH": 3
  }
  ```
- **Phản hồi mẫu thành công (HTTP 201)**:
  ```json
  {
    "success": true,
    "message": "Check-in thành công!",
    "data": {
      "MaPhongDaDat": 15
    }
  }
  ```
- **Phản hồi mẫu khi lỗi (HTTP 400)** (Ném ra từ `SIGNAL SQLSTATE '45000'`):
  ```json
  {
    "success": false,
    "error": "Lỗi: Phòng đang bận hoặc không sẵn sàng!"
  }
  ```

---

### 4.3. Gọi thêm dịch vụ (món ăn/đồ uống) vào phòng
- **Endpoint**: `POST /api/services`
- **Mô tả**: Gọi stored procedure `sp_ThemDichVu` để thêm món ăn hoặc đồ uống vào phòng đang hoạt động.
- **Body Request**:
  ```json
  {
    "MaPDD": 15,
    "MaSP": 2,
    "SoLuong": 5
  }
  ```
- **Phản hồi mẫu thành công (HTTP 200)**:
  ```json
  {
    "success": true,
    "message": "Thêm dịch vụ thành công!"
  }
  ```
- **Phản hồi mẫu khi lỗi (HTTP 400)**:
  ```json
  {
    "success": false,
    "error": "Lỗi: Không đủ hàng trong kho!"
  }
  ```

---

### 4.4. Thanh toán hóa đơn (Chốt giờ & Tính tiền)
- **Endpoint**: `POST /api/checkout`
- **Mô tả**: Gọi stored procedure `sp_ThanhToan` để chốt hóa đơn phòng. Hệ thống tự động làm tròn giờ và tính tổng tiền dịch vụ để trả về hóa đơn cuối cùng.
- **Body Request**:
  ```json
  {
    "MaHD": 1
  }
  ```
- **Phản hồi mẫu thành công (HTTP 200)**:
  ```json
  {
    "success": true,
    "message": "Thanh toán hóa đơn thành công!",
    "data": {
      "TienPhong": 350000,
      "TienDichVu": 120000,
      "TongCong": 470000,
      "TongGioTinhTien": 1.75,
      "TongSoPhutThucTe": 105
    }
  }
  ```
- **Phản hồi mẫu khi lỗi (HTTP 400)**:
  ```json
  {
    "success": false,
    "error": "Lỗi: Hóa đơn này đã được thanh toán trước đó!"
  }
  ```

---

### 4.5. Chốt lương hệ thống định kỳ
- **Endpoint**: `POST /api/salary/close`
- **Mô tả**: Gọi stored procedure `sp_Transaction_ChotLuongHeThong` để thực hiện tính toán và khóa sổ lương của tháng.
- **Body Request**:
  ```json
  {
    "Thang": 6,
    "Nam": 2026
  }
  ```
- **Phản hồi mẫu thành công (HTTP 200)**:
  ```json
  {
    "success": true,
    "message": "Thành công! Đã chốt lương cho tháng 6/2026"
  }
  ```
- **Phản hồi mẫu khi lỗi (HTTP 400)**:
  ```json
  {
    "success": false,
    "error": "Lỗi: Hệ thống đã chốt lương tháng này rồi!"
  }
  ```

---

### 4.6. Thanh toán lương cho nhân viên
- **Endpoint**: `POST /api/salary/pay`
- **Mô tả**: Gọi stored procedure `sp_ThanhToanLuong` để thực hiện thanh toán chi trả lương cho một nhân viên hoặc toàn bộ nhân viên.
- **Body Request** (Thanh toán toàn bộ nhân viên):
  ```json
  {
    "MaNV": null,
    "Thang": 6,
    "Nam": 2026
  }
  ```
- **Body Request** (Thanh toán riêng cho 1 nhân viên có mã số 3):
  ```json
  {
    "MaNV": 3,
    "Thang": 6,
    "Nam": 2026
  }
  ```
- **Phản hồi mẫu thành công (HTTP 200)**:
  ```json
  {
    "success": true,
    "message": "Thành công: Đã thanh toán 5 nhân viên. Tổng chi: 34,500,000 VNĐ",
    "data": {
      "SoNhanVienDaTra": 5,
      "TongTienDaChi": 34500000
    }
  }
  ```
- **Phản hồi mẫu khi lỗi (HTTP 400)**:
  ```json
  {
    "success": false,
    "error": "Thông báo: Không tìm thấy khoản lương nào cần thanh toán cho điều kiện này!"
  }
  ```
