-- ==============================================================================
-- BƯỚC 0: LÀM SẠCH DỮ LIỆU CŨ ĐỂ RESET ID VỀ 1 (TRÁNH LỖI DUPLICATE/LỆCH ID)
-- ==============================================================================


TRUNCATE TABLE ChiTietSanPham;
TRUNCATE TABLE HoaDon;
TRUNCATE TABLE PhongDaDat;
TRUNCATE TABLE BangLuong;
TRUNCATE TABLE ThuongPhat;
TRUNCATE TABLE PhanCa;
TRUNCATE TABLE Phong;
TRUNCATE TABLE SanPham;
TRUNCATE TABLE KhachHang;
TRUNCATE TABLE NhanVien;
TRUNCATE TABLE LoaiPhong;
TRUNCATE TABLE CaLamViec;
TRUNCATE TABLE MucLuong;
TRUNCATE TABLE PhieuChi;

DROP TRIGGER IF EXISTS trg_AfterInsert_PhongDaDat;
DROP TRIGGER IF EXISTS trg_AfterInsert_ChiTietSanPham;
DROP TRIGGER IF EXISTS trg_AfterUpdate_ChiTietSanPham;
DROP TRIGGER IF EXISTS trg_AfterDelete_ChiTietSanPham;
DROP TRIGGER IF EXISTS trg_BeforeUpdate_ChiTietSanPham;
DROP TRIGGER IF EXISTS trg_BeforeDelete_ChiTietSanPham;
DROP TRIGGER IF EXISTS trg_AfterUpdate_HoaDon_ReleaseRoom;
DROP TRIGGER IF EXISTS trg_BeforeUpdate_BangLuong;
DROP TRIGGER IF EXISTS trg_BeforeInsert_ThuongPhat;
DROP TRIGGER IF EXISTS trg_BeforeUpdate_BangLuong_Lock;
DROP TRIGGER IF EXISTS trg_AfterUpdate_BangLuong_SyncPhieuChi;

SET @soCanXoa = (
    SELECT GREATEST(COUNT(*) - 15, 0)
    FROM PhanCa
    WHERE MaNV = 10
      AND NgayLamViec >= '2026-03-01'
      AND NgayLamViec < '2026-04-01'
);

SELECT GREATEST(COUNT(*) - 15, 0)
FROM PhanCa
WHERE MaNV = 4
  AND NgayLamViec >= '2026-03-01'
  AND NgayLamViec < '2026-04-01';

DELETE FROM PhanCa
WHERE MaNV = 4
  AND NgayLamViec >= '2026-03-01'
  AND NgayLamViec < '2026-04-01'
ORDER BY NgayLamViec DESC
LIMIT 10;
DELETE FROM PhanCa
WHERE MaNV = 2;