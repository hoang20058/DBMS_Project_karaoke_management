# Hệ Thống Quản Lý Phòng Hát Karaoke (Karaoke Management System)

Dự án cuối kỳ môn **Hệ quản trị Cơ sở dữ liệu (DBMS)**. Hệ thống được xây dựng bằng kiến trúc tích hợp chặt chẽ giữa Cơ sở dữ liệu MySQL 8.0 (sử dụng tối đa các ràng buộc toàn vẹn, Views, Triggers và Stored Procedures) và ứng dụng Web quản lý (Node.js Express backend + React.js frontend).

Hệ thống tự động đồng bộ hóa dữ liệu thời gian thực, quản lý tồn kho chặt chẽ, tự động làm tròn block 15 phút tính tiền phòng khi thanh toán, chốt lương chuyên cần nhân viên và cho phép **Hoàn tác thanh toán (Rollback Checkout)** khi có sai sót.

---

## 0. Chuẩn bị Môi trường chạy Code (Environment Setup)

Nếu máy tính của bạn hoàn toàn mới và chưa cài đặt bất kỳ công cụ lập trình nào, hãy tải và cài đặt lần lượt các phần mềm sau đây:

### Step 1: Cài đặt Node.js & npm (Môi trường chạy ứng dụng Web)
1. Truy cập trang chủ Node.js: [https://nodejs.org/](https://nodejs.org/) và tải về phiên bản khuyến nghị **LTS** (Ví dụ: v20.x hoặc v22.x).
2. Chạy tệp tin cài đặt vừa tải về, nhấn **Next** liên tiếp và chấp nhận các điều khoản mặc định cho đến khi hoàn thành.
3. Để kiểm tra xem cài đặt đã thành công chưa, hãy mở ô tìm kiếm Windows gõ `cmd` (Command Prompt) hoặc mở `PowerShell` và chạy hai lệnh sau:
   ```bash
   node -v
   npm -v
   ```
   *Nếu hiển thị các số phiên bản (ví dụ: `v20.11.0` và `10.2.4`) nghĩa là đã cài đặt Node.js thành công.*

### Step 2: Cài đặt MySQL Server & MySQL Workbench (Hệ quản trị CSDL)
1. Truy cập trang tải xuống MySQL Installer dành cho Windows: [https://dev.mysql.com/downloads/installer/](https://dev.mysql.com/downloads/installer/)
2. Tải về phiên bản **mysql-installer-community** (bản dung lượng lớn hơn khoảng 280-400 MB để cài offline nhanh hơn).
3. Chạy file cài đặt:
   - Chọn kiểu cài đặt: **Developer Default** (Sẽ cài đặt cả MySQL Server, MySQL Workbench và các Driver cần thiết).
   - Tiến hành cài đặt (**Execute**).
4. Cấu hình dịch vụ MySQL (Configuration):
   - **Type and Networking**: Giữ nguyên cổng mặc định là **`3306`**.
   - **Authentication Method**: Chọn *Use Strong Password Encryption for Authentication* (Khuyên dùng).
   - **Accounts and Roles**: Thiết lập mật khẩu cho tài khoản quản trị tối cao **`root`**. *Hãy nhớ kỹ mật khẩu này* (ví dụ: `123456` hoặc `admin123`) vì bạn sẽ cần nhập nó vào tệp cấu hình `.env` để web kết nối được vào database.
   - Nhấn **Next** và **Execute** cho đến khi hoàn thành cấu hình dịch vụ.

---

## 1. Hướng dẫn Thiết lập Cơ sở dữ liệu (Database Setup)

Để khởi tạo cấu trúc dữ liệu và các logic nghiệp vụ (Triggers, Stored Procedures, Views), bạn hãy mở MySQL Workbench hoặc công cụ quản lý MySQL khác, tạo một cơ sở dữ liệu trống:
```sql
CREATE DATABASE quanlyKaraoke;
USE quanlyKaraoke;
```

Sau đó, truy cập vào thư mục [db_set_up] trong dự án này và chạy tuần tự các file SQL theo đúng thứ tự dưới đây:

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

