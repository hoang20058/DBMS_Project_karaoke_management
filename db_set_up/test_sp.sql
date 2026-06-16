-- test thủ tục
show triggers;
SHOW CREATE PROCEDURE sp_DatPhong;
-- test dat phong
SELECT * FROM Phong;
SELECT * FROM PhongDaDat;
SELECT * FROM HoaDon;

select * FROM v_phongdangdung;
-- giả sử đặt phòng 1
CALL sp_DatPhong(1, 1, 1);
CALL sp_DatPhong(999, 1, 1);
CALL sp_DatPhong(2, 1, 1);

-- test them dich vu
SELECT * FROM v_chitietdichvuphong;
select * from sanpham;
CALL sp_ThemDichVu(11, 8, 7);

CALL sp_ThemDichVu(1, 25, 9);
CALL sp_ThemDichVu(11, 999, 1);
CALL sp_ThemDichVu(11, 25, 9);


-- test doi so luong dich vu
SELECT * FROM v_chitietdichvuphong;
select * from sanpham;
select * from v_phongdangdung;
CALL sp_CapNhatSoLuongDichVu(13, 5);

-- test xoa san pham
SELECT * FROM v_chitietdichvuphong;
select * from sanpham;
select * from v_phongdangdung;
CALL sp_DeleteChiTietSanPham(13);
CALL sp_DeleteChiTietSanPham(14);
CALL sp_DeleteChiTietSanPham(1);
select * from chitietsanpham;

-- test checkout

select * from hoadon;
select * from v_phongdangdung;
CALL sp_ThanhToan(11);

CALL sp_ThanhToan(999);

-- test chốt lương
select * from bangluong;
select * from v_chitietthuongphat;	
SET SQL_SAFE_UPDATES = 0;
select * from v_chitietthuongphat;
CALL sp_Transaction_ChotLuongHeThong(3, 2026);
SET SQL_SAFE_UPDATES = 1;
INSERT INTO ThuongPhat (MaNV, Loai, SoTien, NgayGhiNhan, LyDo, TrangThai) VALUES
(2, 'Thưởng', 500000, '2026-03-09 10:00:00', 'Tăng ca', 'Chưa Xử Lý');
-- test thủ tục thanh toán lương
select * from bangluong;
select * from thuongphat;
CALL sp_ThanhToanLuong(NULL,3, 2026);	
select * from phieuchi;
UPDATE BangLuong 
SET TrangThai = "Chưa Trả"
WHERE MaNV = 1;

