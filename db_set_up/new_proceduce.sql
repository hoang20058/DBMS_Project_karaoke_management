-- thủ tục đặt phòng
DELIMITER //

CREATE PROCEDURE sp_DatPhong(
    IN p_MaPhong INT,
    IN p_MaNV INT,
    IN p_MaKH INT
)
sp_main: BEGIN
    DECLARE v_MaPDD INT;
    DECLARE v_TrangThaiHienTai VARCHAR(20);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
	    -- 2. XỬ LÝ LỖI TRONG TRANSACTION
    BEGIN
        ROLLBACK;
        RESIGNAL; 
    END;
    -- 1. KIỂM TRA ĐẦU VÀO (Trước khi START TRANSACTION)
    -- Kiểm tra phòng tồn tại
    IF NOT EXISTS (SELECT 1 FROM Phong WHERE MaPhong = p_MaPhong) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Mã phòng không tồn tại!';
    END IF;

    -- Kiểm tra nhân viên tồn tại
    IF NOT EXISTS (SELECT 1 FROM NhanVien WHERE MaNV = p_MaNV) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Mã nhân viên không hợp lệ!';
    END IF;

    -- Kiểm tra khách hàng tồn tại
    IF NOT EXISTS (SELECT 1 FROM KhachHang WHERE MaKH = p_MaKH) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Mã khách hàng không hợp lệ!';
	END IF;

    -- 3. BẮT ĐẦU GIAO DỊCH
    START TRANSACTION;

    -- Khóa dòng dữ liệu phòng để kiểm tra trạng thái (Chống tranh chấp)
    SELECT TrangThai INTO v_TrangThaiHienTai 
    FROM Phong 
    WHERE MaPhong = p_MaPhong FOR UPDATE;

    IF v_TrangThaiHienTai = 'Trống' THEN
        
        -- Thêm vào PhongDaDat (Trigger trg_AfterInsert_PhongDaDat sẽ tự update bảng Phong)
        INSERT INTO PhongDaDat (MaPhong, GioVao) 
        VALUES (p_MaPhong, NOW());
        
        SET v_MaPDD = LAST_INSERT_ID();
        
        -- Tạo hóa đơn tạm tính
        INSERT INTO HoaDon (MaNV, MaKH, MaPhongDaDat, TongTien, TrangThai)
        VALUES (p_MaNV, p_MaKH, v_MaPDD, 0, 'Chưa Thanh Toán');
        
        COMMIT;
        SELECT 'Check-in thành công!' AS Message, v_MaPDD AS MaPhongDaDat;
    ELSE
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Phòng đang bận hoặc không sẵn sàng!';
    END IF;

END //

DELIMITER ;

-- thủ tục thêm dịch vụ
DELIMITER //

CREATE PROCEDURE sp_ThemDichVu(
    IN p_MaPDD INT,
    IN p_MaSP INT,
    IN p_SoLuong INT
)
sp_main: BEGIN
    DECLARE v_GiaHienTai DECIMAL(10,0);
    DECLARE v_TonKho INT;
    DECLARE v_TrangThaiHD VARCHAR(50);
    -- 2. XỬ LÝ LỖI TRANSACTION
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- 1. KIỂM TRA ĐẦU VÀO CƠ BẢN (Fail-fast)
    IF p_SoLuong <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Số lượng phải lớn hơn 0!';
    END IF;

    -- Kiểm tra tồn tại của MaPDD và MaSP
    IF NOT EXISTS (SELECT 1 FROM PhongDaDat WHERE MaPhongDaDat = p_MaPDD) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Mã đặt phòng không tồn tại!';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM SanPham WHERE MaSP = p_MaSP) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Sản phẩm không tồn tại!';
    END IF;

    -- 3. BẮT ĐẦU GIAO DỊCH
    START TRANSACTION;

    -- Khóa hóa đơn để đảm bảo không thêm đồ vào đơn đã thanh toán
    SELECT TrangThai INTO v_TrangThaiHD 
    FROM HoaDon 
    WHERE MaPhongDaDat = p_MaPDD FOR UPDATE;

    IF v_TrangThaiHD = 'Đã Thanh Toán' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Hóa đơn đã chốt, không thể thêm dịch vụ!';
    END IF;

    -- Khóa sản phẩm để kiểm tra tồn kho (Chống tranh chấp kho)
    SELECT Gia, SoLuongTon INTO v_GiaHienTai, v_TonKho 
    FROM SanPham 
    WHERE MaSP = p_MaSP FOR UPDATE;

    IF v_TonKho < p_SoLuong THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Không đủ hàng trong kho!';
    END IF;

    -- 4. THỰC THI (Trigger sẽ tự động xử lý phần UPDATE kho)
    INSERT INTO ChiTietSanPham (MaPhongDaDat, MaSP, SoLuong, DonGia)
    VALUES (p_MaPDD, p_MaSP, p_SoLuong, v_GiaHienTai);

    COMMIT;
    SELECT 'Thêm dịch vụ thành công!' AS Message;

END //

DELIMITER ;

-- đỏi số lượng dịch vụ
DELIMITER //

CREATE PROCEDURE sp_CapNhatSoLuongDichVu(
    IN p_MaCTSP INT,
    IN p_SoLuongMoi INT
)
sp_main: BEGIN
    DECLARE v_MaPDD INT;
    DECLARE v_MaSP INT;
    DECLARE v_SoLuongCu INT;
    DECLARE v_TonKho INT;
    DECLARE v_TrangThaiHD VARCHAR(20);
	 DECLARE exit handler FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- 1. KIỂM TRA ĐẦU VÀO CƠ BẢN
    IF p_SoLuongMoi <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Số lượng mới phải lớn hơn 0 (Nếu bằng 0 hãy dùng thủ tục Xóa)!';
    END IF;

    -- 2. LẤY THÔNG TIN VÀ KIỂM TRA TỒN TẠI
    SELECT MaPhongDaDat, MaSP, SoLuong 
    INTO v_MaPDD, v_MaSP, v_SoLuongCu
    FROM ChiTietSanPham 
    WHERE MaChiTietSanPham = p_MaCTSP;

    IF v_MaPDD IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Không tìm thấy chi tiết dịch vụ này!';
    END IF;

	 START TRANSACTION;
    -- 4. KHÓA VÀ KIỂM TRA TRẠNG THÁI HÓA ĐƠN (Quy tắc ưu tiên số 1)
    SELECT TrangThai INTO v_TrangThaiHD 
    FROM HoaDon 
    WHERE MaPhongDaDat = v_MaPDD FOR UPDATE;

    IF v_TrangThaiHD = 'Đã Thanh Toán' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Hóa đơn đã thanh toán, không thể điều chỉnh số lượng!';
    END IF;

    -- 5. KIỂM TRA TỒN KHO (Chỉ khi khách muốn gọi THÊM)
    IF p_SoLuongMoi > v_SoLuongCu THEN
        SELECT SoLuongTon INTO v_TonKho 
        FROM SanPham 
        WHERE MaSP = v_MaSP FOR UPDATE;

        IF v_TonKho < (p_SoLuongMoi - v_SoLuongCu) THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Không đủ hàng trong kho để tăng số lượng!';
        END IF;
    END IF;

    -- 6. THỰC THI CẬP NHẬT
    -- Khi lệnh này chạy, Trigger AFTER UPDATE sẽ tự động tính toán chênh lệch và cập nhật kho
    UPDATE ChiTietSanPham 
    SET SoLuong = p_SoLuongMoi 
    WHERE MaChiTietSanPham = p_MaCTSP;

    COMMIT;
    SELECT 'Cập nhật số lượng thành công và kho đã tự động điều chỉnh.' AS Message;

END //

DELIMITER ;

-- thủ tục xóa sp 
DELIMITER //

CREATE PROCEDURE sp_DeleteChiTietSanPham(IN p_MaCTSP INT)
sp_main: BEGIN
    DECLARE v_MaPDD INT;
    DECLARE v_TrangThaiHD VARCHAR(20);
		DECLARE exit handler FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    -- 1. KIỂM TRA TỒN TẠI (Fail-fast)
    SELECT MaPhongDaDat INTO v_MaPDD 
    FROM ChiTietSanPham 
    WHERE MaChiTietSanPham = p_MaCTSP;

    IF v_MaPDD IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Không tìm thấy chi tiết sản phẩm này!';
    END IF;

    -- 2. XỬ LÝ LỖI TRANSACTION

    START TRANSACTION;

    -- 3. KHÓA VÀ KIỂM TRA TRẠNG THÁI HÓA ĐƠN
    -- Ta khóa HoaDon để đảm bảo trong lúc đang xóa, nhân viên không bấm Thanh toán ở máy khác
    SELECT TrangThai INTO v_TrangThaiHD 
    FROM HoaDon 
    WHERE MaPhongDaDat = v_MaPDD FOR UPDATE;

    IF v_TrangThaiHD = 'Đã Thanh Toán' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Hóa đơn đã thanh toán, không thể chỉnh sửa!';
    ELSE
        -- 4. THỰC HIỆN XÓA (Trigger trg_AfterDelete sẽ tự hoàn kho)
        DELETE FROM ChiTietSanPham WHERE MaChiTietSanPham = p_MaCTSP;
        
        COMMIT;
        SELECT 'Thành công: Đã xóa dịch vụ và hoàn kho tự động.' AS Message;
    END IF;
END //

DELIMITER ;

-- thủ tục thanh toán
DELIMITER //

CREATE PROCEDURE sp_ThanhToan(
    IN p_MaHD INT
)
sp_main: BEGIN
    DECLARE v_MaPDD INT;
    DECLARE v_MaPhong INT;
    DECLARE v_GioVao DATETIME;
    DECLARE v_GioRa DATETIME;
    DECLARE v_GiaTheoGio DECIMAL(10,0);
    DECLARE v_TienPhong DECIMAL(15,0);
    DECLARE v_TienDichVu DECIMAL(15,0);
    DECLARE v_SoPhut INT;
    DECLARE v_SoGioRound FLOAT;
    DECLARE v_TrangThaiHienTai VARCHAR(20);
    DECLARE exit handler FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- 1. KIỂM TRA ĐẦU VÀO (Fail-fast)
    SELECT TrangThai, MaPhongDaDat INTO v_TrangThaiHienTai, v_MaPDD
    FROM HoaDon WHERE MaHD = p_MaHD;

    IF v_MaPDD IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Hóa đơn không tồn tại!';
    END IF;

    IF v_TrangThaiHienTai = 'Đã Thanh Toán' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Hóa đơn này đã được thanh toán trước đó!';
    END IF;

    -- 2. XỬ LÝ LỖ

    SET v_GioRa = NOW();

    START TRANSACTION;

    -- 3. KHÓA DỮ LIỆU THEO THỨ TỰ NHẤT QUÁN ĐỂ TRÁNH DEADLOCK
    -- Tìm mã phòng trước
    SELECT MaPhong, GioVao INTO v_MaPhong, v_GioVao 
    FROM PhongDaDat WHERE MaPhongDaDat = v_MaPDD FOR UPDATE;

    -- Khóa phòng vật lý
    SELECT MaLoaiPhong INTO @temp FROM Phong WHERE MaPhong = v_MaPhong FOR UPDATE;
    
    -- Khóa hóa đơn
    SELECT MaHD FROM HoaDon WHERE MaHD = p_MaHD FOR UPDATE;

    -- 4. LOGIC TÍNH TIỀN GIỜ (Làm tròn chuyên nghiệp)
    -- Lấy giá phòng
    SELECT lp.GiaTheoGio INTO v_GiaTheoGio
    FROM Phong p JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
    WHERE p.MaPhong = v_MaPhong;

    SET v_SoPhut = TIMESTAMPDIFF(MINUTE, v_GioVao, v_GioRa);
    -- Quy tắc: Dưới 15 phút tính 15 phút. Làm tròn lên mỗi block 15 phút.
    -- Công thức: CEIL(phút / 15) * 15 / 60
    IF v_SoPhut < 15 THEN SET v_SoPhut = 15; END IF;
    SET v_SoGioRound = CEIL(v_SoPhut / 15.0) * 15.0 / 60.0;
    
    SET v_TienPhong = v_SoGioRound * v_GiaTheoGio;

    -- 5. TÍNH TIỀN DỊCH VỤ
    SELECT IFNULL(SUM(SoLuong * DonGia), 0) INTO v_TienDichVu 
    FROM ChiTietSanPham WHERE MaPhongDaDat = v_MaPDD;

    -- 6. CẬP NHẬT TRẠNG THÁI
    UPDATE PhongDaDat SET GioRa = v_GioRa WHERE MaPhongDaDat = v_MaPDD;

    -- Khi UPDATE dòng này, Trigger trg_AfterUpdate_HoaDon_ReleaseRoom sẽ tự chạy để giải phóng phòng
    UPDATE HoaDon 
    SET TongTien = v_TienPhong + v_TienDichVu, 
        TrangThai = 'Đã Thanh Toán' 
    WHERE MaHD = p_MaHD;

    COMMIT;

    -- 7. TRẢ KẾT QUẢ CHO APP
    SELECT 
        v_TienPhong AS TienPhong, 
        v_TienDichVu AS TienDichVu, 
        (v_TienPhong + v_TienDichVu) AS TongCong,
        v_SoGioRound AS TongGioTinhTien,
        v_SoPhut AS TongSoPhutThucTe;

END //

DELIMITER ;

-- thủ tục chốt lương
DELIMITER //

CREATE PROCEDURE sp_Transaction_ChotLuongHeThong(
    IN p_Thang INT,
    IN p_Nam INT
)
sp_main: BEGIN
    -- 1. Định mức ca làm tiêu chuẩn (ví dụ 20 ca/tháng để nhận full lương)
    DECLARE v_SoCaTieuChuan INT DEFAULT 20;

    -- Xử lý lỗi nguyên tử (Atomicity)
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- 2. Kiểm tra trùng (Idempotency)
    IF EXISTS (SELECT 1 FROM BangLuong WHERE Thang = p_Thang AND Nam = p_Nam) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Hệ thống đã chốt lương tháng này rồi!';
    END IF;

    -- 3. Chèn dữ liệu (Tối ưu hóa JOIN và Logic tỷ lệ)
    INSERT INTO BangLuong (
        MaNV, Thang, Nam, LuongTrachNhiem, TienPhuCapChucVu, 
        TongCaLam, LuongCa, TongThuong, TongPhat, TrangThai, TongLuong
    )
    SELECT
        nv.MaNV,
        p_Thang,
        p_Nam,
        -- Lương trách nhiệm tính theo tỷ lệ chuyên cần (tối đa 100%)
        ROUND(ml.LuongTrachNhiem * LEAST(1, IFNULL(pc.TongCa, 0) / v_SoCaTieuChuan), 0),
        
        -- Phụ cấp chức vụ tính theo SoCaTieuChuan
        IF( IFNULL(pc.TongCa,0) >= v_SoCaTieuChuan, ml.PhuCapChucVu, 0),
        
        IFNULL(pc.TongCa, 0),
        IFNULL(pc.TienCa, 0),
        IFNULL(tp.TienThuong, 0),
        IFNULL(tp.TienPhat, 0),
        'Chưa Trả',
        
        -- Tổng lương cuối cùng
        (
            ROUND(ml.LuongTrachNhiem * LEAST(1, IFNULL(pc.TongCa, 0) / v_SoCaTieuChuan), 0) +
            IF( IFNULL(pc.TongCa,0) >= v_SoCaTieuChuan, ml.PhuCapChucVu, 0) +
            IFNULL(pc.TienCa, 0) +
            IFNULL(tp.TienThuong, 0) -
            IFNULL(tp.TienPhat, 0)
        )
    FROM NhanVien nv
    JOIN MucLuong ml ON nv.MaMucLuong = ml.MaMucLuong
    -- Tổng hợp ca làm việc
    LEFT JOIN (
        SELECT p.MaNV, COUNT(*) as TongCa, SUM(c.LuongCa) as TienCa
        FROM PhanCa p
        JOIN CaLamViec c ON p.MaCa = c.MaCa
        WHERE MONTH(p.NgayLamViec) = p_Thang AND YEAR(p.NgayLamViec) = p_Nam
        GROUP BY p.MaNV
    ) pc ON nv.MaNV = pc.MaNV
    -- Tổng hợp thưởng phạt
    LEFT JOIN (
        SELECT MaNV, 
               SUM(CASE WHEN Loai = 'Thưởng' THEN SoTien ELSE 0 END) as TienThuong,
               SUM(CASE WHEN Loai = 'Phạt' THEN SoTien ELSE 0 END) as TienPhat
        FROM ThuongPhat
        WHERE TrangThai = 'Chưa Xử Lý'
          AND MONTH(NgayGhiNhan) = p_Thang AND YEAR(NgayGhiNhan) = p_Nam
        GROUP BY MaNV
    ) tp ON nv.MaNV = tp.MaNV;

    -- 4. Cập nhật trạng thái phiếu thưởng phạt (Atomicity - Bước này cực quan trọng)
    UPDATE ThuongPhat
    SET TrangThai = 'Đã Chốt Lương'
    WHERE TrangThai = 'Chưa Xử Lý'
      AND MONTH(NgayGhiNhan) = p_Thang AND YEAR(NgayGhiNhan) = p_Nam;

    COMMIT;
    SELECT CONCAT('Thành công! Đã chốt lương cho tháng ', p_Thang, '/', p_Nam) AS Result;

END //

DELIMITER ;

-- thủ tục thanh toán lương
DELIMITER //

CREATE PROCEDURE sp_ThanhToanLuong(
    IN p_MaNV INT,
    IN p_Thang INT,
    IN p_Nam INT
)
sp_main: BEGIN
    DECLARE v_TotalPaid DECIMAL(15, 0) DEFAULT 0;
    DECLARE v_Count INT DEFAULT 0;
    DECLARE exit handler FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- 1. KIỂM TRA ĐẦU VÀO (Fail-fast)
    IF p_Thang < 1 OR p_Thang > 12 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Tháng không hợp lệ (1-12)!';
    END IF;

    IF p_MaNV IS NOT NULL AND NOT EXISTS (SELECT 1 FROM NhanVien WHERE MaNV = p_MaNV) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi: Nhân viên không tồn tại!';
    END IF;

    -- 2. KIỂM TRA SỰ TỒN TẠI CỦA KHOẢN LƯƠNG CẦN TRẢ (Trước khi bắt đầu Transaction)
    -- Việc kiểm tra trước giúp tránh lãng phí tài nguyên mở giao dịch
    SELECT COUNT(*), IFNULL(SUM(TongLuong), 0) 
    INTO v_Count, v_TotalPaid
    FROM BangLuong
    WHERE (p_MaNV IS NULL OR MaNV = p_MaNV)
      AND Thang = p_Thang
      AND Nam = p_Nam
      AND TrangThai = 'Chưa Trả';

    IF v_Count = 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Thông báo: Không tìm thấy khoản lương nào cần thanh toán cho điều kiện này!';
    END IF;

    -- 3. XỬ LÝ GIAO DỊCH

    START TRANSACTION;

    -- 4. THỰC THI CẬP NHẬT
    UPDATE BangLuong 
    SET TrangThai = 'Đã Trả'
    WHERE (p_MaNV IS NULL OR MaNV = p_MaNV)
      AND Thang = p_Thang
      AND Nam = p_Nam
      AND TrangThai = 'Chưa Trả';

    COMMIT;

    -- 5. TRẢ VỀ KẾT QUẢ CHI TIẾT
    SELECT 
        v_Count AS SoNhanVienDaTra,
        v_TotalPaid AS TongTienDaChi,
        CONCAT('Thành công: Đã thanh toán ', v_Count, ' nhân viên. Tổng chi: ', FORMAT(v_TotalPaid, 0), ' VNĐ') AS ThongBao;

END //

DELIMITER ;