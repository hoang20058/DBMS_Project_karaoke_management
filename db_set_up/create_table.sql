-- 1. Bảng Mức Lương
CREATE TABLE MucLuong (
    MaMucLuong INT AUTO_INCREMENT PRIMARY KEY,
    TenChucVu VARCHAR(100) NOT NULL,
    LuongTrachNhiem DECIMAL(15, 0) NOT NULL,
    PhuCapChucVu DECIMAL(15, 0) DEFAULT 0
);

-- 2. Bảng Nhân Viên
CREATE TABLE NhanVien (
    MaNV INT AUTO_INCREMENT PRIMARY KEY,
    HoTen VARCHAR(100),
    SoDienThoai VARCHAR(15),
    MaMucLuong INT,
    
    -- Khóa ngoại tham chiếu đến Mức Lương
    CONSTRAINT FK_NV_MucLuong 
        FOREIGN KEY (MaMucLuong) REFERENCES MucLuong(MaMucLuong) 
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 3. Bảng Ca Làm Việc
CREATE TABLE CaLamViec (
    MaCa INT AUTO_INCREMENT PRIMARY KEY,
    TenCa VARCHAR(50),
    GioBatDau TIME,
    GioKetThuc TIME,
    LuongCa DECIMAL(15, 0)
);

-- 4. Bảng Phân Ca
CREATE TABLE PhanCa (
    MaPC INT AUTO_INCREMENT PRIMARY KEY,
    MaCa INT,
    MaNV INT,
    NgayLamViec DATE,
    
    -- Khóa ngoại tham chiếu đến Ca Làm Việc và Nhân Viên
    CONSTRAINT FK_PC_Ca 
        FOREIGN KEY (MaCa) REFERENCES CaLamViec(MaCa) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT FK_PC_NV 
        FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV) 
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5. Bảng Thưởng Phạt
CREATE TABLE ThuongPhat (
    MaPhieu INT AUTO_INCREMENT PRIMARY KEY,
    MaNV INT,
    Loai ENUM('Thưởng', 'Phạt') NOT NULL,
    SoTien DECIMAL(12, 0) NOT NULL,
    NgayGhiNhan DATETIME DEFAULT CURRENT_TIMESTAMP,
    LyDo TEXT,
    TrangThai ENUM('Chưa Xử Lý', 'Đã Chốt Lương') DEFAULT 'Chưa Xử Lý',
    
    -- Khóa ngoại tham chiếu đến Nhân Viên
    CONSTRAINT FK_TP_NV 
        FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV) 
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 6. Bảng Bảng Lương
CREATE TABLE BangLuong (
    MaBangLuong INT AUTO_INCREMENT PRIMARY KEY,
    MaNV INT,
    Thang INT,
    Nam INT,
    LuongTrachNhiem DECIMAL(15, 0),
    TienPhuCapChucVu DECIMAL(15, 0) DEFAULT 0,
    TongCaLam INT,
    LuongCa DECIMAL(15, 0),
    TongThuong DECIMAL(15, 0),
    TongPhat DECIMAL(15, 0),
    TongLuong DECIMAL(15, 0),
    TrangThai ENUM('Chưa Trả', 'Đã Trả') DEFAULT 'Chưa Trả',
    
    -- Khóa ngoại tham chiếu đến Nhân Viên
    CONSTRAINT FK_BL_NV 
        FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV) 
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 7. Bảng Loại Phòng
CREATE TABLE LoaiPhong (
    MaLoaiPhong INT AUTO_INCREMENT PRIMARY KEY,
    TenLoaiPhong VARCHAR(50),
    GiaTheoGio DECIMAL(10, 0)
);

-- 8. Bảng Khách Hàng
CREATE TABLE KhachHang (
    MaKH INT AUTO_INCREMENT PRIMARY KEY,
    HoTen VARCHAR(100),
    SoDienThoai VARCHAR(15) UNIQUE NOT NULL
);

-- 9. Bảng Phòng
CREATE TABLE Phong (
    MaPhong INT AUTO_INCREMENT PRIMARY KEY,
    MaLoaiPhong INT,
    TenPhong VARCHAR(50),
    TrangThai ENUM('Trống', 'Đang Sử Dụng') DEFAULT 'Trống',
    
    -- Khóa ngoại tham chiếu đến Loại Phòng
    CONSTRAINT FK_Phong_LoaiPhong 
        FOREIGN KEY (MaLoaiPhong) REFERENCES LoaiPhong(MaLoaiPhong) 
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 10. Bảng Phòng Đã Đặt
CREATE TABLE PhongDaDat (
    MaPhongDaDat INT AUTO_INCREMENT PRIMARY KEY,
    MaPhong INT,
    GioVao DATETIME,
    GioRa DATETIME,
    
    -- Khóa ngoại tham chiếu đến Phòng
    CONSTRAINT FK_PDD_Phong 
        FOREIGN KEY (MaPhong) REFERENCES Phong(MaPhong) 
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 11. Bảng Sản Phẩm
CREATE TABLE SanPham (
    MaSP INT AUTO_INCREMENT PRIMARY KEY,
    TenSP VARCHAR(100),
    Gia DECIMAL(10, 0),
    SoLuongTon INT
);

-- 12. Bảng Chi Tiết Sản Phẩm
CREATE TABLE ChiTietSanPham (
    MaChiTietSanPham INT AUTO_INCREMENT PRIMARY KEY,
    MaPhongDaDat INT,
    MaSP INT, 
    SoLuong INT,
    DonGia DECIMAL(10, 0),
    
    -- Khóa ngoại tham chiếu đến Phòng Đã Đặt và Sản Phẩm
    CONSTRAINT FK_CTSP_PDD 
        FOREIGN KEY (MaPhongDaDat) REFERENCES PhongDaDat(MaPhongDaDat) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT FK_CTSP_SP 
        FOREIGN KEY (MaSP) REFERENCES SanPham(MaSP) 
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 13. Bảng Hóa Đơn
CREATE TABLE HoaDon (
    MaHD INT AUTO_INCREMENT PRIMARY KEY,
    MaNV INT,
    MaKH INT,
    MaPhongDaDat INT,
    TongTien DECIMAL(15, 0),
    TrangThai VARCHAR(20),
    
    -- Khóa ngoại tham chiếu đến Nhân Viên, Khách Hàng và Phòng Đã Đặt
    CONSTRAINT FK_HD_NV 
        FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT FK_HD_KH 
        FOREIGN KEY (MaKH) REFERENCES KhachHang(MaKH) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT FK_HD_PDD 
        FOREIGN KEY (MaPhongDaDat) REFERENCES PhongDaDat(MaPhongDaDat) 
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE PhieuChi (
    MaPhieuChi INT AUTO_INCREMENT PRIMARY KEY,
    MaNV INT,
    MaBangLuong INT UNIQUE, -- Khóa ngoại trỏ thẳng đến bản ghi lương cụ thể
    SoTien DECIMAL(15, 0),
    NgayChi DATETIME DEFAULT CURRENT_TIMESTAMP,
    NoiDung TEXT,
    
    -- Ràng buộc khóa ngoại
    CONSTRAINT FK_PC_NhanVien FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV),
    CONSTRAINT FK_PC_BangLuong FOREIGN KEY (MaBangLuong) REFERENCES BangLuong(MaBangLuong)
        ON DELETE RESTRICT -- Không cho xóa bảng lương nếu đã sinh phiếu chi
        ON UPDATE CASCADE
);