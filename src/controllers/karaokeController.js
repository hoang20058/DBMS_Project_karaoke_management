const db = require('../config/db');

// Helper function để xử lý lỗi CSDL, đặc biệt là SIGNAL SQLSTATE 45000
const handleDbError = (err, res) => {
  console.error('=== Lỗi Cơ sở dữ liệu ===');
  console.error('Message:', err.message);
  console.error('SQLState:', err.sqlState);
  console.error('ErrNo:', err.errno);
  console.error('------------------------');

  // Lỗi SQLSTATE 45000 hoặc mã lỗi 1644 đại diện cho SIGNAL từ MySQL
  if (err.sqlState === '45000' || err.errno === 1644) {
    let cleanMessage = err.message || 'Đã xảy ra lỗi nghiệp vụ từ cơ sở dữ liệu.';
    
    // Loại bỏ tiền tố lỗi hệ thống của MySQL driver nếu có (ví dụ "ER_SIGNAL_NOT_FOUND: ")
    // Regex này lọc bỏ các ký tự in hoa và gạch dưới theo sau bởi dấu hai chấm (như ER_SIGNAL_NOT_FOUND: )
    cleanMessage = cleanMessage.replace(/^[A-Z0-9_]+:\s*/, '');
    
    return res.status(400).json({
      success: false,
      error: cleanMessage
    });
  }

  // Đối với các lỗi CSDL hệ thống khác (như lỗi cú pháp, mất kết nối, v.v.)
  return res.status(500).json({
    success: false,
    error: 'Đã xảy ra lỗi hệ thống phía máy chủ CSDL!',
    details: err.message
  });
};

// 1. GET /api/rooms: Lấy danh sách toàn bộ phòng và trạng thái hiện tại kèm thông tin loại phòng
exports.getRooms = async (req, res) => {
  try {
    // Tự động sửa lỗi không đồng bộ trạng thái phòng (Self-healing logic)
    // 1. Chuyển các phòng 'Đang Sử Dụng' về 'Trống' nếu không có booking active nào trong database
    const healToFreeQuery = `
      UPDATE Phong p
      SET p.TrangThai = 'Trống'
      WHERE p.TrangThai = 'Đang Sử Dụng'
        AND p.MaPhong NOT IN (
          SELECT COALESCE(pdd.MaPhong, 0)
          FROM PhongDaDat pdd 
          WHERE pdd.GioRa IS NULL
        )
    `;
    await db.query(healToFreeQuery);

    // 2. Chuyển các phòng 'Trống' sang 'Đang Sử Dụng' nếu có booking active đang hoạt động
    const healToBusyQuery = `
      UPDATE Phong p
      SET p.TrangThai = 'Đang Sử Dụng'
      WHERE p.TrangThai = 'Trống'
        AND p.MaPhong IN (
          SELECT COALESCE(pdd.MaPhong, 0)
          FROM PhongDaDat pdd 
          WHERE pdd.GioRa IS NULL
        )
    `;
    await db.query(healToBusyQuery);

    // 3. Lấy danh sách phòng đã đồng bộ hoàn tất
    const queryStr = `
      SELECT 
        p.MaPhong, 
        p.TenPhong, 
        p.TrangThai, 
        p.MaLoaiPhong, 
        lp.TenLoaiPhong, 
        lp.GiaTheoGio 
      FROM Phong p 
      LEFT JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
      ORDER BY p.TenPhong ASC
    `;
    
    const [rows] = await db.query(queryStr);
    
    return res.status(200).json({
      success: true,
      data: rows
    });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// 2. POST /api/bookings: Đặt/mở phòng (gọi sp_DatPhong)
exports.createBooking = async (req, res) => {
  try {
    const MaPhong = req.body.MaPhong ?? req.body.maPhong;
    const MaNV = req.body.MaNV ?? req.body.maNV;
    const MaKH = req.body.MaKH ?? req.body.maKH;

    // Kiểm tra đầu vào phía backend
    if (MaPhong === undefined || MaNV === undefined || MaKH === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp đầy đủ thông tin: MaPhong, MaNV, MaKH trong body request!'
      });
    }

    // Gọi Stored Procedure
    const [results] = await db.query('CALL sp_DatPhong(?, ?, ?)', [MaPhong, MaNV, MaKH]);
    
    // kết quả trả về từ lệnh SELECT trong sp_DatPhong nằm ở kết quả phần tử đầu tiên
    const spResult = results[0] && results[0][0];

    return res.status(201).json({
      success: true,
      message: spResult?.Message || 'Mở phòng thành công!',
      data: {
        MaPhongDaDat: spResult?.MaPhongDaDat || null
      }
    });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// 3. POST /api/services: Thêm món ăn/đồ uống (gọi sp_ThemDichVu)
exports.addService = async (req, res) => {
  try {
    const MaPDD = req.body.MaPDD ?? req.body.maPDD;
    const MaSP = req.body.MaSP ?? req.body.maSP;
    const SoLuong = req.body.SoLuong ?? req.body.soLuong;

    // Kiểm tra đầu vào phía backend
    if (MaPDD === undefined || MaSP === undefined || SoLuong === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp đầy đủ thông tin: MaPDD (Mã phòng đã đặt), MaSP, SoLuong trong body request!'
      });
    }

    // Gọi Stored Procedure
    const [results] = await db.query('CALL sp_ThemDichVu(?, ?, ?)', [MaPDD, MaSP, SoLuong]);
    
    const spResult = results[0] && results[0][0];

    return res.status(200).json({
      success: true,
      message: spResult?.Message || 'Thêm dịch vụ thành công!'
    });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// 4. POST /api/checkout: Thanh toán và chốt hóa đơn (gọi sp_ThanhToan)
exports.checkout = async (req, res) => {
  try {
    const MaHD = req.body.MaHD ?? req.body.maHD;

    if (MaHD === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp MaHD (Mã hóa đơn) trong body request!'
      });
    }

    // Gọi Stored Procedure
    const [results] = await db.query('CALL sp_ThanhToan(?)', [MaHD]);
    
    // Vì sp_ThanhToan trả về 2 kết quả (SELECT MaHD khóa hóa đơn và SELECT tính tiền cuối cùng),
    // Ta cần duyệt qua các kết quả để tìm đúng phần tử chứa TienPhong
    let invoiceDetail = null;
    if (Array.isArray(results)) {
      for (const resultSet of results) {
        if (Array.isArray(resultSet) && resultSet[0] && 'TienPhong' in resultSet[0]) {
          invoiceDetail = resultSet[0];
          break;
        }
      }
    }
    // Fallback
    if (!invoiceDetail) {
      invoiceDetail = results[0] && results[0][0];
    }

    return res.status(200).json({
      success: true,
      message: 'Thanh toán hóa đơn thành công!',
      data: {
        TienPhong: Number(invoiceDetail?.TienPhong || 0),
        TienDichVu: Number(invoiceDetail?.TienDichVu || 0),
        TongCong: Number(invoiceDetail?.TongCong || 0),
        TongGioTinhTien: Number(invoiceDetail?.TongGioTinhTien || 0),
        TongSoPhutThucTe: Number(invoiceDetail?.TongSoPhutThucTe || 0)
      }
    });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// 5. POST /api/salary/close: Chốt lương hệ thống (gọi sp_Transaction_ChotLuongHeThong)
exports.closeSalary = async (req, res) => {
  try {
    const Thang = req.body.Thang ?? req.body.thang;
    const Nam = req.body.Nam ?? req.body.nam;

    if (Thang === undefined || Nam === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp đầy đủ thông tin: Thang, Nam trong body request!'
      });
    }

    // Gọi Stored Procedure
    const [results] = await db.query('CALL sp_Transaction_ChotLuongHeThong(?, ?)', [Thang, Nam]);
    
    const spResult = results[0] && results[0][0];

    return res.status(200).json({
      success: true,
      message: spResult?.Result || 'Chốt lương hệ thống thành công!'
    });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// 6. POST /api/salary/pay: Thanh toán lương cho nhân viên (gọi sp_ThanhToanLuong)
exports.paySalary = async (req, res) => {
  try {
    const MaNV = req.body.MaNV ?? req.body.maNV ?? null; // null tức là trả lương cho tất cả nhân viên
    const Thang = req.body.Thang ?? req.body.thang;
    const Nam = req.body.Nam ?? req.body.nam;

    if (Thang === undefined || Nam === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp đầy đủ thông tin: Thang, Nam (MaNV có thể có hoặc null) trong body request!'
      });
    }

    // Gọi Stored Procedure
    const [results] = await db.query('CALL sp_ThanhToanLuong(?, ?, ?)', [MaNV, Thang, Nam]);
    
    const spResult = results[0] && results[0][0];

    return res.status(200).json({
      success: true,
      message: spResult?.ThongBao || 'Thanh toán lương thành công!',
      data: {
        SoNhanVienDaTra: spResult?.SoNhanVienDaTra || 0,
        TongTienDaChi: Number(spResult?.TongTienDaChi || 0)
      }
    });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// 7. GET /api/rooms/:roomId/active: Lấy thông tin đặt phòng active và các dịch vụ
exports.getActiveBooking = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // 1. Lấy thông tin đặt phòng active (chưa thanh toán) kết hợp với View v_PhongDangDung
    const bookingQuery = `
      SELECT 
        pdd.MaPhongDaDat,
        pdd.GioVao,
        hd.MaHD,
        hd.MaNV,
        hd.MaKH,
        kh.HoTen AS TenKhachHang,
        nv.HoTen AS TenNhanVien,
        v.ThoiGianSuDung,
        v.TienPhongTamTinh,
        v.TienDichVuTamTinh,
        v.TongTamTinh
      FROM PhongDaDat pdd
      JOIN HoaDon hd ON pdd.MaPhongDaDat = hd.MaPhongDaDat
      LEFT JOIN KhachHang kh ON hd.MaKH = kh.MaKH
      LEFT JOIN NhanVien nv ON hd.MaNV = nv.MaNV
      LEFT JOIN v_PhongDangDung v ON pdd.MaPhongDaDat = v.MaPhongDaDat
      WHERE pdd.MaPhong = ? AND hd.TrangThai = 'Chưa Thanh Toán'
      ORDER BY pdd.MaPhongDaDat DESC
      LIMIT 1
    `;
    
    const [bookings] = await db.query(bookingQuery, [roomId]);
    
    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy hóa đơn chưa thanh toán cho phòng này.'
      });
    }
    
    const activeBooking = bookings[0];
    
    // 2. Lấy chi tiết các dịch vụ/sản phẩm đã gọi
    const servicesQuery = `
      SELECT 
        ct.MaChiTietSanPham,
        ct.MaSP,
        sp.TenSP,
        ct.SoLuong,
        ct.DonGia,
        (ct.SoLuong * ct.DonGia) AS ThanhTien
      FROM ChiTietSanPham ct
      JOIN SanPham sp ON ct.MaSP = sp.MaSP
      WHERE ct.MaPhongDaDat = ?
    `;
    
    const [services] = await db.query(servicesQuery, [activeBooking.MaPhongDaDat]);
    
    return res.status(200).json({
      success: true,
      data: {
        ...activeBooking,
        dichVu: services
      }
    });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// 8. POST /api/services/update: Sửa số lượng dịch vụ đã gọi (gọi sp_CapNhatSoLuongDichVu)
exports.updateServiceQuantity = async (req, res) => {
  try {
    const MaCTSP = req.body.MaCTSP ?? req.body.maCTSP;
    const SoLuongMoi = req.body.SoLuongMoi ?? req.body.soLuongMoi;

    if (MaCTSP === undefined || SoLuongMoi === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp đầy đủ: MaCTSP (Mã chi tiết sản phẩm), SoLuongMoi!'
      });
    }

    const [results] = await db.query('CALL sp_CapNhatSoLuongDichVu(?, ?)', [MaCTSP, SoLuongMoi]);
    const spResult = results[0] && results[0][0];

    return res.status(200).json({
      success: true,
      message: spResult?.Message || 'Cập nhật số lượng sản phẩm thành công!'
    });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// 9. POST /api/services/delete: Xóa dịch vụ đã gọi (gọi sp_DeleteChiTietSanPham)
exports.deleteService = async (req, res) => {
  try {
    const MaCTSP = req.body.MaCTSP ?? req.body.maCTSP;

    if (MaCTSP === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp MaCTSP (Mã chi tiết sản phẩm) trong body!'
      });
    }

    const [results] = await db.query('CALL sp_DeleteChiTietSanPham(?)', [MaCTSP]);
    const spResult = results[0] && results[0][0];

    return res.status(200).json({
      success: true,
      message: spResult?.Message || 'Xóa dịch vụ thành công và đã hoàn trả kho!'
    });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// 10. GET /api/salary/list: Lấy danh sách bảng lương đã chốt từ CSDL
exports.getSalaryList = async (req, res) => {
  try {
    const queryStr = `
      SELECT 
        bl.MaBangLuong,
        bl.MaNV,
        nv.HoTen AS TenNhanVien,
        bl.Thang,
        bl.Nam,
        bl.LuongTrachNhiem,
        bl.TienPhuCapChucVu,
        bl.TongCaLam,
        bl.LuongCa,
        bl.TongThuong,
        bl.TongPhat,
        bl.TongLuong,
        bl.TrangThai
      FROM BangLuong bl
      JOIN NhanVien nv ON bl.MaNV = nv.MaNV
      ORDER BY bl.Nam DESC, bl.Thang DESC, bl.TongLuong DESC
    `;
    const [rows] = await db.query(queryStr);
    return res.status(200).json({
      success: true,
      data: rows
    });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// ==================== A. CÁC API DANH MỤC META (DROPDOWNS) ====================

// 11. GET /api/products: Lấy danh sách toàn bộ sản phẩm
exports.getProducts = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT MaSP, TenSP, Gia, SoLuongTon FROM SanPham ORDER BY TenSP ASC');
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// 12. GET /api/room-types: Lấy danh sách loại phòng
exports.getRoomTypes = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT MaLoaiPhong, TenLoaiPhong, GiaTheoGio FROM LoaiPhong ORDER BY TenLoaiPhong ASC');
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// 13. GET /api/salary-levels: Lấy danh sách các chức vụ mức lương
exports.getSalaryLevels = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT MaMucLuong, TenChucVu, LuongTrachNhiem, PhuCapChucVu FROM MucLuong ORDER BY TenChucVu ASC');
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// ==================== B. CRUD CÁC BẢNG (ROOMS, CUSTOMERS, EMPLOYEES) ====================

// --- 1. PHÒNG (Rooms) ---
// POST /api/rooms: Thêm phòng mới
exports.createRoom = async (req, res) => {
  try {
    const { TenPhong, MaLoaiPhong } = req.body;
    if (!TenPhong || !MaLoaiPhong) {
      return res.status(400).json({ success: false, error: 'Vui lòng điền đầy đủ TenPhong, MaLoaiPhong!' });
    }
    const [result] = await db.query('INSERT INTO Phong (TenPhong, MaLoaiPhong, TrangThai) VALUES (?, ?, "Trống")', [TenPhong, MaLoaiPhong]);
    return res.status(201).json({ success: true, message: 'Thêm phòng mới thành công!', data: { MaPhong: result.insertId } });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// PUT /api/rooms/:id: Sửa phòng
exports.updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { TenPhong, MaLoaiPhong, TrangThai } = req.body;
    if (!TenPhong || !MaLoaiPhong || !TrangThai) {
      return res.status(400).json({ success: false, error: 'Vui lòng điền đầy đủ TenPhong, MaLoaiPhong, TrangThai!' });
    }
    await db.query('UPDATE Phong SET TenPhong = ?, MaLoaiPhong = ?, TrangThai = ? WHERE MaPhong = ?', [TenPhong, MaLoaiPhong, TrangThai, id]);
    return res.status(200).json({ success: true, message: 'Cập nhật phòng thành công!' });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// DELETE /api/rooms/:id: Xóa phòng
exports.deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM Phong WHERE MaPhong = ?', [id]);
    return res.status(200).json({ success: true, message: 'Xóa phòng thành công!' });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// --- 2. KHÁCH HÀNG (Customers) ---
// GET /api/customers: Lấy danh sách khách hàng
exports.getCustomers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT MaKH, HoTen, SoDienThoai FROM KhachHang ORDER BY HoTen ASC');
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// POST /api/customers: Thêm khách hàng mới
exports.createCustomer = async (req, res) => {
  try {
    const { HoTen, SoDienThoai } = req.body;
    if (!HoTen || !SoDienThoai) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập HoTen, SoDienThoai!' });
    }
    const [result] = await db.query('INSERT INTO KhachHang (HoTen, SoDienThoai) VALUES (?, ?)', [HoTen, SoDienThoai]);
    return res.status(201).json({ success: true, message: 'Thêm khách hàng thành công!', data: { MaKH: result.insertId } });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// PUT /api/customers/:id: Cập nhật khách hàng
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { HoTen, SoDienThoai } = req.body;
    if (!HoTen || !SoDienThoai) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập HoTen, SoDienThoai!' });
    }
    await db.query('UPDATE KhachHang SET HoTen = ?, SoDienThoai = ? WHERE MaKH = ?', [HoTen, SoDienThoai, id]);
    return res.status(200).json({ success: true, message: 'Cập nhật khách hàng thành công!' });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// DELETE /api/customers/:id: Xóa khách hàng
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM KhachHang WHERE MaKH = ?', [id]);
    return res.status(200).json({ success: true, message: 'Xóa khách hàng thành công!' });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// --- 3. NHÂN VIÊN (Employees) ---
// GET /api/employees: Lấy danh sách nhân viên
exports.getEmployees = async (req, res) => {
  try {
    const queryStr = `
      SELECT nv.MaNV, nv.HoTen, nv.SoDienThoai, nv.MaMucLuong, ml.TenChucVu 
      FROM NhanVien nv
      LEFT JOIN MucLuong ml ON nv.MaMucLuong = ml.MaMucLuong
      ORDER BY nv.HoTen ASC
    `;
    const [rows] = await db.query(queryStr);
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// POST /api/employees: Thêm nhân viên mới
exports.createEmployee = async (req, res) => {
  try {
    const { HoTen, SoDienThoai, MaMucLuong } = req.body;
    if (!HoTen || !SoDienThoai || !MaMucLuong) {
      return res.status(400).json({ success: false, error: 'Vui lòng điền đầy đủ HoTen, SoDienThoai, MaMucLuong!' });
    }
    const [result] = await db.query('INSERT INTO NhanVien (HoTen, SoDienThoai, MaMucLuong) VALUES (?, ?, ?)', [HoTen, SoDienThoai, MaMucLuong]);
    return res.status(201).json({ success: true, message: 'Thêm nhân viên thành công!', data: { MaNV: result.insertId } });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// PUT /api/employees/:id: Cập nhật nhân viên
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { HoTen, SoDienThoai, MaMucLuong } = req.body;
    if (!HoTen || !SoDienThoai || !MaMucLuong) {
      return res.status(400).json({ success: false, error: 'Vui lòng điền đầy đủ HoTen, SoDienThoai, MaMucLuong!' });
    }
    await db.query('UPDATE NhanVien SET HoTen = ?, SoDienThoai = ?, MaMucLuong = ? WHERE MaNV = ?', [HoTen, SoDienThoai, MaMucLuong, id]);
    return res.status(200).json({ success: true, message: 'Cập nhật nhân viên thành công!' });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// DELETE /api/employees/:id: Xóa nhân viên
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM NhanVien WHERE MaNV = ?', [id]);
    return res.status(200).json({ success: true, message: 'Xóa nhân viên thành công!' });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// ==================== C. CÁC API TỪ SQL VIEWS (REPORTS/ALERTS) ====================

// 14. GET /api/stats/invoices: Lấy danh sách doanh thu hóa đơn từ View v_DoanhThuHoaDon
exports.getInvoicesFromView = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM v_DoanhThuHoaDon ORDER BY MaHD DESC');
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// 15. GET /api/stats/inventory-alerts: Lấy cảnh báo tồn kho từ View v_CanhBaoTonKho
exports.getInventoryAlerts = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM v_CanhBaoTonKho');
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return handleDbError(err, res);
  }
};

// 16. POST /api/checkout/rollback: Hoàn tác thanh toán hóa đơn (Rollback Checkout)
exports.rollbackCheckout = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const MaHD = req.body.MaHD ?? req.body.maHD;
    if (MaHD === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp MaHD (Mã hóa đơn) để rollback!'
      });
    }

    await connection.beginTransaction();

    // 1. Lấy thông tin đặt phòng liên quan đến hóa đơn
    const [hdRows] = await connection.query('SELECT MaPhongDaDat, TrangThai FROM HoaDon WHERE MaHD = ? FOR UPDATE', [MaHD]);
    if (hdRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy hóa đơn cần rollback!'
      });
    }

    const { MaPhongDaDat, TrangThai } = hdRows[0];
    if (TrangThai !== 'Đã Thanh Toán') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'Hóa đơn chưa thanh toán hoặc đã ở trạng thái khác, không thể rollback!'
      });
    }

    // 2. Lấy mã phòng từ PhongDaDat
    const [pddRows] = await connection.query('SELECT MaPhong FROM PhongDaDat WHERE MaPhongDaDat = ? FOR UPDATE', [MaPhongDaDat]);
    const MaPhong = pddRows[0]?.MaPhong;

    if (!MaPhong) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy thông tin đặt phòng liên quan!'
      });
    }

    // 3. Re-open đặt phòng: cập nhật GioRa = NULL
    await connection.query('UPDATE PhongDaDat SET GioRa = NULL WHERE MaPhongDaDat = ?', [MaPhongDaDat]);

    // 4. Chuyển hóa đơn về 'Chưa Thanh Toán' và tổng tiền = 0
    await connection.query('UPDATE HoaDon SET TrangThai = \'Chưa Thanh Toán\', TongTien = 0 WHERE MaHD = ?', [MaHD]);

    // 5. Chuyển phòng vật lý về trạng thái 'Đang Sử Dụng'
    await connection.query('UPDATE Phong SET TrangThai = \'Đang Sử Dụng\' WHERE MaPhong = ?', [MaPhong]);

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: 'Hoàn tác thanh toán (Rollback Checkout) thành công!'
    });
  } catch (err) {
    await connection.rollback();
    return handleDbError(err, res);
  } finally {
    connection.release();
  }
};


