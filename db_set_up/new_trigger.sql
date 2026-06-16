-- trigger cập nhật trạng thái sau khi đặt phòng

DELIMITER //

CREATE TRIGGER trg_AfterInsert_PhongDaDat
AFTER INSERT ON PhongDaDat
FOR EACH ROW
BEGIN
    -- Tự động cập nhật trạng thái phòng khi có bản ghi đặt phòng mới
    UPDATE Phong 
    SET TrangThai = 'Đang Sử Dụng' 
    WHERE MaPhong = NEW.MaPhong;
END //

DELIMITER ;

-- trigger tự trừ tồn kho
DELIMITER //

CREATE TRIGGER trg_AfterInsert_ChiTietSanPham
AFTER INSERT ON ChiTietSanPham
FOR EACH ROW
BEGIN
    -- Tự động trừ số lượng tồn kho khi thêm chi tiết sản phẩm
    UPDATE SanPham 
    SET SoLuongTon = SoLuongTon - NEW.SoLuong 
    WHERE MaSP = NEW.MaSP;
END //

DELIMITER ;

-- trigger update so luong san pham
DELIMITER //

CREATE TRIGGER trg_AfterUpdate_ChiTietSanPham
AFTER UPDATE ON ChiTietSanPham
FOR EACH ROW
BEGIN
    DECLARE v_ChenhLech INT;
    
    -- Tính toán phần chênh lệch giữa số lượng mới và cũ
    -- Nếu OLD = 5, NEW = 2 => v_ChenhLech = 3 (Cộng lại vào kho 3)
    -- Nếu OLD = 2, NEW = 5 => v_ChenhLech = -3 (Trừ tiếp đi 3)
    SET v_ChenhLech = OLD.SoLuong - NEW.SoLuong;

    IF v_ChenhLech <> 0 THEN
        UPDATE SanPham 
        SET SoLuongTon = SoLuongTon + v_ChenhLech 
        WHERE MaSP = NEW.MaSP;
    END IF;
END //

DELIMITER ;

-- trigger hoàn trả số lượng
DELIMITER //

CREATE TRIGGER trg_AfterDelete_ChiTietSanPham
AFTER DELETE ON ChiTietSanPham
FOR EACH ROW
BEGIN
    -- Hoàn trả số lượng vào kho ngay khi bản ghi bị xóa
    UPDATE SanPham 
    SET SoLuongTon = SoLuongTon + OLD.SoLuong 
    WHERE MaSP = OLD.MaSP;
END //

DELIMITER ;

-- chặn nhập sản phẩm đã thanh toán

DELIMITER //

CREATE TRIGGER trg_BeforeUpdate_ChiTietSanPham
BEFORE UPDATE ON ChiTietSanPham
FOR EACH ROW
BEGIN
    DECLARE v_TrangThai VARCHAR(20);
    SELECT TrangThai INTO v_TrangThai FROM HoaDon WHERE MaPhongDaDat = NEW.MaPhongDaDat;
    IF v_TrangThai = 'Đã Thanh Toán' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Bảo mật: Không thể sửa dịch vụ của hóa đơn đã thanh toán!';
    END IF;
END //

CREATE TRIGGER trg_BeforeDelete_ChiTietSanPham
BEFORE DELETE ON ChiTietSanPham
FOR EACH ROW
BEGIN
    DECLARE v_TrangThai VARCHAR(20);
    SELECT TrangThai INTO v_TrangThai FROM HoaDon WHERE MaPhongDaDat = OLD.MaPhongDaDat;
    IF v_TrangThai = 'Đã Thanh Toán' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Bảo mật: Không thể xóa dịch vụ của hóa đơn đã thanh toán!';
    END IF;
END //

DELIMITER ;

-- trigger giải phóng phòng
DELIMITER //

CREATE TRIGGER trg_AfterUpdate_HoaDon_ReleaseRoom
AFTER UPDATE ON HoaDon
FOR EACH ROW
BEGIN
    -- Chỉ chạy khi trạng thái chuyển từ 'Chưa Thanh Toán' -> 'Đã Thanh Toán'
    IF OLD.TrangThai = 'Chưa Thanh Toán' AND NEW.TrangThai = 'Đã Thanh Toán' THEN
        UPDATE Phong 
        SET TrangThai = 'Trống'
        WHERE MaPhong = (SELECT MaPhong FROM PhongDaDat WHERE MaPhongDaDat = NEW.MaPhongDaDat);
    END IF;
END //

DELIMITER ;

-- trigger khóa bản lương đã chốt
DELIMITER //

CREATE TRIGGER trg_BeforeUpdate_BangLuong
BEFORE UPDATE ON BangLuong
FOR EACH ROW
BEGIN
    -- Nếu trạng thái cũ đã là 'Đã Trả', tuyệt đối không cho sửa bất cứ thông tin gì
    IF OLD.TrangThai = 'Đã Trả' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Bảo mật: Bản ghi lương đã thanh toán không thể chỉnh sửa!';
    END IF;
END //

DELIMITER ;

-- trigger ngăn thêm thưởng phạt vào tháng đã chốt
DELIMITER //

CREATE TRIGGER trg_BeforeInsert_ThuongPhat
BEFORE INSERT ON ThuongPhat
FOR EACH ROW
BEGIN
    -- Kiểm tra xem tháng/năm của phiếu mới đã tồn tại trong BangLuong chưa
    IF EXISTS (
        SELECT 1 FROM BangLuong 
        WHERE MaNV = NEW.MaNV 
          AND Thang = MONTH(NEW.NgayGhiNhan) 
          AND Nam = YEAR(NEW.NgayGhiNhan)
    ) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Lỗi: Tháng này đã chốt lương, không thể thêm thưởng/phạt mới!';
    END IF;
END //

DELIMITER ;

-- trigger khóa dữ liệu
DELIMITER //

CREATE TRIGGER trg_BeforeUpdate_BangLuong_Lock
BEFORE UPDATE ON BangLuong
FOR EACH ROW
BEGIN
    -- 1. Ngăn chặn chuyển ngược trạng thái từ 'Đã Trả' về 'Chưa Trả'
    IF OLD.TrangThai = 'Đã Trả' AND NEW.TrangThai = 'Chưa Trả' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Lỗi bảo mật: Không thể chuyển trạng thái lương đã thanh toán về chưa thanh toán!';
    END IF;

    -- 2. Khóa toàn bộ con số tài chính nếu trạng thái cũ đã là 'Đã Trả'
    IF OLD.TrangThai = 'Đã Trả' THEN
        IF NEW.TongLuong <> OLD.TongLuong OR 
           NEW.TongThuong <> OLD.TongThuong OR 
           NEW.TongPhat <> OLD.TongPhat THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Lỗi bảo mật: Dữ liệu tài chính của bảng lương đã thanh toán là bất biến!';
        END IF;
    END IF;
END //

DELIMITER ;
-- trigger ghi nhận phiếu chi
DELIMITER //

CREATE TRIGGER trg_AfterUpdate_BangLuong_SyncPhieuChi
AFTER UPDATE ON BangLuong
FOR EACH ROW
BEGIN
    -- Chỉ thực hiện khi thanh toán lương
    IF OLD.TrangThai = 'Chưa Trả' AND NEW.TrangThai = 'Đã Trả' THEN
        INSERT INTO PhieuChi (MaNV, MaBangLuong, SoTien, NoiDung)
        VALUES (
            NEW.MaNV, 
            NEW.MaBangLuong, -- Map trực tiếp ID của bảng lương vào phiếu chi
            NEW.TongLuong, 
            CONCAT('Thanh toán lương nhân viên: ', (SELECT HoTen FROM NhanVien WHERE MaNV = NEW.MaNV), 
                   ' - Tháng ', NEW.Thang, '/', NEW.Nam)
        );
    END IF;
END //

DELIMITER ;