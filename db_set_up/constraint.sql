-- Constraints
-- 1. Đảm bảo tiền bạc và số lượng không bao giờ âm
ALTER TABLE MucLuong ADD CONSTRAINT CHK_MucLuong_Tien CHECK (LuongTrachNhiem >= 0 AND PhuCapChucVu >= 0);
ALTER TABLE CaLamViec ADD CONSTRAINT CHK_CaLamViec_Tien CHECK (LuongCa >= 0);
ALTER TABLE ThuongPhat ADD CONSTRAINT CHK_ThuongPhat_Tien CHECK (SoTien >= 0);
ALTER TABLE LoaiPhong ADD CONSTRAINT CHK_LoaiPhong_Gia CHECK (GiaTheoGio >= 0);
ALTER TABLE SanPham ADD CONSTRAINT CHK_SanPham_GiaTon CHECK (Gia >= 0 AND SoLuongTon >= 0);
ALTER TABLE ChiTietSanPham ADD CONSTRAINT CHK_ChiTietSP_SoLuong CHECK (SoLuong > 0 AND DonGia >= 0);
ALTER TABLE HoaDon ADD CONSTRAINT CHK_HoaDon_Tien CHECK (TongTien >= 0);

-- 2. Ràng buộc thời gian & Logic
ALTER TABLE BangLuong ADD CONSTRAINT CHK_BangLuong_ThoiGian CHECK (Thang BETWEEN 1 AND 12);

-- Lưu ý: Khách có thể đang hát nên GioRa có thể NULL, nhưng nếu có thì phải sau GioVao
ALTER TABLE PhongDaDat ADD CONSTRAINT CHK_PhongDaDat_ThoiGian CHECK (GioRa IS NULL OR GioRa >= GioVao);

-- Cảnh báo nghiệp vụ (Ca làm việc): 
-- KHÔNG thêm constraint "GioKetThuc > GioBatDau" vì "Ca đêm" của bạn bắt đầu 22:00 và kết thúc 03:00 ngày hôm sau.

-- Đảm bảo SĐT nhân viên không trùng lặp (Khách hàng bạn đã làm rồi)
ALTER TABLE NhanVien ADD CONSTRAINT UQ_NhanVien_SDT UNIQUE (SoDienThoai);

-- MySQL 8.0 hỗ trợ REGEXP trong CHECK constraint để kiểm tra định dạng SĐT (chỉ chứa số, độ dài 10-11 số)
ALTER TABLE NhanVien ADD CONSTRAINT CHK_NhanVien_SDT_Format CHECK (SoDienThoai REGEXP '^[0-9]{10,11}$');
ALTER TABLE KhachHang ADD CONSTRAINT CHK_KhachHang_SDT_Format CHECK (SoDienThoai REGEXP '^[0-9]{10,11}$');