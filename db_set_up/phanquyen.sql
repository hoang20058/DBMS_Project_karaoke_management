-- 1. TẠO CÁC ROLE (NHÓM QUYỀN)
-- ------------------------------------------------------------------------------


CREATE ROLE 'role_staff', 'role_manager';

-- 2. CẤP QUYỀN CHO ROLE_STAFF (Nhân viên thông thường)
-- Chỉ cấp quyền thực thi (EXECUTE) trên các nghiệp vụ hàng ngày
-- ------------------------------------------------------------------------------
GRANT EXECUTE ON PROCEDURE QuanlyKaraoke.sp_DatPhong TO 'role_staff'; 
GRANT EXECUTE ON PROCEDURE QuanlyKaraoke.sp_ThemDichVu TO 'role_staff';
GRANT EXECUTE ON PROCEDURE QuanlyKaraoke.sp_CapNhatSoLuongDichVu  TO 'role_staff';
GRANT EXECUTE ON PROCEDURE QuanlyKaraoke.sp_DeleteChiTietSanPham TO 'role_staff';
GRANT EXECUTE ON PROCEDURE QuanlyKaraoke.sp_ThanhToan TO 'role_staff';

-- 3. CẤP QUYỀN CHO ROLE_MANAGER (Quản lý)
-- Quản lý kế thừa toàn bộ quyền của nhân viên (Role kế thừa Role)
-- VÀ được cấp thêm quyền trên các thủ tục tài chính/nhân sự nhạy cảm
-- ------------------------------------------------------------------------------
GRANT 'role_staff' TO 'role_manager';
GRANT EXECUTE ON PROCEDURE QuanlyKaraoke.sp_Transaction_ChotLuongHeThong TO 'role_manager';
GRANT EXECUTE ON PROCEDURE QuanlyKaraoke.sp_ThanhToanLuong TO 'role_manager';
-- 4. TẠO TÀI KHOẢN NGƯỜI DÙNG THỰC TẾ
-- ------------------------------------------------------------------------------
CREATE USER 'staff'@'localhost' IDENTIFIED BY '123456';
CREATE USER 'manager'@'localhost' IDENTIFIED BY '654321';

-- 5. GÁN ROLE CHO NGƯỜI DÙNG & KÍCH HOẠT MẶC ĐỊNH
-- ------------------------------------------------------------------------------
-- Gán role
GRANT 'role_staff' TO 'staff'@'localhost';
GRANT 'role_manager' TO 'manager'@'localhost';

-- Thiết lập role mặc định tự động kích hoạt mỗi khi user đăng nhập
SET DEFAULT ROLE 'role_staff' TO 'staff'@'localhost';
SET DEFAULT ROLE 'role_manager' TO 'manager'@'localhost';