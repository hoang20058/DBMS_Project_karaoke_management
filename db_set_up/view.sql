-- view
-- 1. Xem các phòng đã đặt
CREATE VIEW v_TrangThaiPhong AS
SELECT 
    p.MaPhong, 
    p.TenPhong, 
    lp.TenLoaiPhong, 
    lp.GiaTheoGio, 
    p.TrangThai
FROM Phong p
JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong;

CREATE OR REPLACE VIEW v_PhongDangDung AS
SELECT 
    pdd.MaPhongDaDat,
    p.TenPhong,
    kh.HoTen AS TenKhachHang,
    pdd.GioVao,
    -- Tính số giờ (Sử dụng GREATEST để đảm bảo tối thiểu 1 giờ nếu bạn muốn)
    CONCAT(
    FLOOR(TIMESTAMPDIFF(MINUTE, pdd.GioVao, NOW()) / 60), ' giờ ',
    MOD(TIMESTAMPDIFF(MINUTE, pdd.GioVao, NOW()), 60), ' phút'
    ) AS ThoiGianSuDung,
    
    -- TIỀN PHÒNG TẠM TÍNH (làm tròn block 15 phút, tối thiểu 15 phút)
       ROUND(
		(
			CEIL(
				GREATEST(
					TIMESTAMPDIFF(MINUTE, pdd.GioVao, NOW()),
					15
				) / 15.0
			) * 15.0 / 60.0
		) * lp.GiaTheoGio
	,0) AS TienPhongTamTinh,
    
    -- TỔNG TIỀN SẢN PHẨM (Sử dụng Subquery)
    IFNULL((
        SELECT SUM(ct.SoLuong * ct.DonGia) 
        FROM ChiTietSanPham ct 
        WHERE ct.MaPhongDaDat = pdd.MaPhongDaDat
    ), 0) AS TienDichVuTamTinh,

    -- TỔNG CỘNG TẠM TÍNH (Tiền phòng + Tiền dịch vụ)
    
     ROUND(
        (
            CEIL(
                GREATEST(
                    TIMESTAMPDIFF(MINUTE, pdd.GioVao, NOW()),
                    15
                ) / 15.0
            ) * 15.0 / 60.0
        ) * lp.GiaTheoGio
    ,0)

    +

    IFNULL(
        (
            SELECT SUM(ct.SoLuong * ct.DonGia)
            FROM ChiTietSanPham ct
            WHERE ct.MaPhongDaDat = pdd.MaPhongDaDat
        ),
        0
    ) AS TongTamTinh

FROM PhongDaDat pdd
JOIN Phong p ON pdd.MaPhong = p.MaPhong
JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
JOIN HoaDon hd ON pdd.MaPhongDaDat = hd.MaPhongDaDat
JOIN KhachHang kh ON hd.MaKH = kh.MaKH
WHERE p.TrangThai = 'Đang Sử Dụng' AND pdd.GioRa IS NULL;

-- 3. Thưởng phạt
CREATE VIEW v_ChiTietThuongPhat AS
SELECT 
    tp.MaPhieu,
    nv.HoTen AS TenNhanVien,
    tp.Loai,
    tp.SoTien,
    tp.NgayGhiNhan,
    tp.LyDo,
    tp.TrangThai
FROM ThuongPhat tp
JOIN NhanVien nv ON tp.MaNV = nv.MaNV;

CREATE VIEW v_LichPhanCa AS
SELECT 
    pc.MaPC,
    nv.HoTen AS TenNhanVien,
    c.TenCa,
    c.GioBatDau,
    c.GioKetThuc,
    pc.NgayLamViec,
    c.LuongCa
FROM PhanCa pc
JOIN NhanVien nv ON pc.MaNV = nv.MaNV
JOIN CaLamViec c ON pc.MaCa = c.MaCa;

CREATE VIEW v_DoanhThuHoaDon AS
SELECT 
    hd.MaHD,
    hd.MaPhongDaDat,
    kh.HoTen AS KhachHang,
    nv.HoTen AS NhanVienLap,
    p.TenPhong,
    -- Giả sử đã tính toán và update vào bảng HoaDon hoặc tính trực tiếp tại đây
    hd.TongTien,
    hd.TrangThai
FROM HoaDon hd
JOIN KhachHang kh ON hd.MaKH = kh.MaKH
JOIN NhanVien nv ON hd.MaNV = nv.MaNV
JOIN PhongDaDat pdd ON hd.MaPhongDaDat = pdd.MaPhongDaDat
JOIN Phong p ON pdd.MaPhong = p.MaPhong;

CREATE VIEW v_ChiTietDichVuPhong AS
SELECT 
    ct.MaPhongDaDat,
    p.TenPhong,
    sp.TenSP,
    ct.SoLuong,
    ct.DonGia,
    (ct.SoLuong * ct.DonGia) AS ThanhTien
FROM ChiTietSanPham ct
JOIN SanPham sp ON ct.MaSP = sp.MaSP
JOIN PhongDaDat pdd ON ct.MaPhongDaDat = pdd.MaPhongDaDat
JOIN Phong p ON pdd.MaPhong = p.MaPhong;
CREATE OR REPLACE VIEW v_CanhBaoTonKho AS
SELECT MaSP, TenSP, SoLuongTon
FROM sanpham
WHERE SoLuongTon < 10;

CREATE VIEW v_KhoSanPham AS
SELECT *
FROM SanPham;