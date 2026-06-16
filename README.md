# Hệ Thống Quản Lý Phòng Hát Karaoke (Karaoke Management System)

Dự án cuối kỳ môn **Hệ quản trị Cơ sở dữ liệu (DBMS)**. Hệ thống được xây dựng bằng kiến trúc tích hợp chặt chẽ giữa Cơ sở dữ liệu MySQL 8.0 (sử dụng tối đa các ràng buộc toàn vẹn, Views, Triggers và Stored Procedures) và ứng dụng Web quản lý (Node.js Express backend + React.js frontend).

Hệ thống tự động đồng bộ hóa dữ liệu thời gian thực, quản lý tồn kho chặt chẽ, tự động làm tròn block 15 phút tính tiền phòng khi thanh toán, chốt lương chuyên cần nhân viên và cho phép **Hoàn tác thanh toán (Rollback Checkout)** khi có sai sót.

---

## 1. Hướng dẫn Thiết lập Cơ sở dữ liệu (Database Setup)

Để khởi tạo cấu trúc dữ liệu và các logic nghiệp vụ (Triggers, Stored Procedures, Views), bạn hãy mở MySQL Workbench hoặc công cụ quản lý MySQL khác, tạo một cơ sở dữ liệu trống:
```sql
CREATE DATABASE quanlyKaraoke;
USE quanlyKaraoke;
```

Sau đó, truy cập vào thư mục [database](file:///d:/JJin/Documents/Học/Học kì 2 - năm 3/DBMS/project_final/web_demo/database) trong dự án này và chạy tuần tự các file SQL theo đúng thứ tự dưới đây:

1. 📄 **`create_table.sql`**: Khởi tạo cấu trúc các bảng.
2. 📄 **`constraint.sql`**: Thiết lập khóa ngoại và ràng buộc toàn vẹn giữa các bảng.
3. 📄 **`gen_data.sql`**: Nhập dữ liệu mẫu ban đầu (Phòng, Sản phẩm, Nhân viên, Khách hàng).
4. 📄 **`view.sql`**: Tạo các View thống kê (Doanh thu hóa đơn, Cảnh báo tồn kho, Trạng thái phòng).
5. 📄 **`new_trigger.sql`**: Tạo các Triggers tự động trừ tồn kho, giải phóng trạng thái phòng và tự động đồng bộ hóa lương.
6. 📄 **`new_proceduce.sql`**: Tạo các Stored Procedures nghiệp vụ (Đặt phòng, Thêm dịch vụ, Thanh toán giờ hát, Chốt lương tài chính).
7. 📄 **`phanquyen.sql`** *(Tùy chọn)*: Tạo các Role (`role_staff`, `role_manager`) và phân quyền MySQL.

---

## 2. Hướng dẫn Cài đặt & Chạy ứng dụng Web

### 2.1. Cấu hình Backend API Server

1. **Cấu hình môi trường**:
   - Nhân bản tệp `.env.example` thành `.env` tại thư mục `/web_demo`.
   - Cập nhật thông tin kết nối MySQL phù hợp với máy của bạn:
     ```env
     PORT=5000
     DB_HOST=localhost
     DB_PORT=3306
     DB_USER=root
     DB_PASSWORD=mật_khẩu_mysql_của_bạn
     DB_NAME=quanlyKaraoke
     ```

2. **Cài đặt thư viện & Khởi chạy**:
   Tại thư mục `/web_demo`, mở Terminal và chạy:
   ```bash
   npm install
   npm run dev
   ```
   *Backend sẽ khởi chạy thành công tại địa chỉ: **`http://localhost:5000`***

### 2.2. Cấu hình Frontend Client

1. Di chuyển Terminal vào thư mục client `/web_demo/frontend`:
   ```bash
   cd frontend
   ```

2. Cài đặt thư viện và chạy:
   ```bash
   npm install
   npm run dev
   ```
   *Frontend sẽ khởi chạy thành công tại địa chỉ: **`http://localhost:5173`***

---

## 3. Danh sách các RESTful API và cách gọi

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
