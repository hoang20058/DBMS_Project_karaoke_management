const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Xử lý phản hồi từ API.
 * Nếu status không nằm trong khoảng 2xx, bóc tách lỗi ném ra từ Backend.
 */
async function handleResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = {};
  }
  
  if (!response.ok) {
    // Trích xuất thông điệp lỗi từ Backend { success: false, error: '...' }
    const errorMessage = data.error || 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại!';
    throw new Error(errorMessage);
  }
  return data;
}

export const api = {
  // 1. Lấy danh sách toàn bộ phòng và trạng thái
  getRooms: async () => {
    const response = await fetch(`${API_BASE_URL}/rooms`);
    return handleResponse(response);
  },
  
  // 2. Mở phòng (Check-in)
  createBooking: async (MaPhong, MaNV, MaKH) => {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ MaPhong, MaNV, MaKH })
    });
    return handleResponse(response);
  },
  
  // 3. Thêm dịch vụ
  addService: async (MaPDD, MaSP, SoLuong) => {
    const response = await fetch(`${API_BASE_URL}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ MaPDD, MaSP, SoLuong })
    });
    return handleResponse(response);
  },
  
  // 4. Thanh toán hóa đơn
  checkout: async (MaHD) => {
    const response = await fetch(`${API_BASE_URL}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ MaHD })
    });
    return handleResponse(response);
  },
  
  // 4b. Hoàn tác thanh toán hóa đơn
  rollbackCheckout: async (MaHD) => {
    const response = await fetch(`${API_BASE_URL}/checkout/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ MaHD })
    });
    return handleResponse(response);
  },
  
  // 5. Chốt lương hệ thống
  closeSalary: async (Thang, Nam) => {
    const response = await fetch(`${API_BASE_URL}/salary/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Thang, Nam })
    });
    return handleResponse(response);
  },
  
  // 6. Thanh toán lương cho nhân viên
  paySalary: async (MaNV, Thang, Nam) => {
    const response = await fetch(`${API_BASE_URL}/salary/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ MaNV, Thang, Nam })
    });
    return handleResponse(response);
  },

  // 7. Lấy chi tiết đặt phòng active và dịch vụ của phòng đó
  getActiveBooking: async (roomId) => {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/active`);
    return handleResponse(response);
  },

  // 8. Sửa số lượng dịch vụ
  updateServiceQuantity: async (MaCTSP, SoLuongMoi) => {
    const response = await fetch(`${API_BASE_URL}/services/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ MaCTSP, SoLuongMoi })
    });
    return handleResponse(response);
  },

  // 9. Xóa dịch vụ
  deleteService: async (MaCTSP) => {
    const response = await fetch(`${API_BASE_URL}/services/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ MaCTSP })
    });
    return handleResponse(response);
  },

  // 10. Lấy danh sách bảng lương đã chốt
  getSalaryList: async () => {
    const response = await fetch(`${API_BASE_URL}/salary/list`);
    return handleResponse(response);
  },

  // 11. Dropdown Lookup - Sản phẩm
  getProducts: async () => {
    const response = await fetch(`${API_BASE_URL}/products`);
    return handleResponse(response);
  },

  // 12. Dropdown Lookup - Loại phòng
  getRoomTypes: async () => {
    const response = await fetch(`${API_BASE_URL}/room-types`);
    return handleResponse(response);
  },

  // 13. Dropdown Lookup - Chức vụ/Mức lương
  getSalaryLevels: async () => {
    const response = await fetch(`${API_BASE_URL}/salary-levels`);
    return handleResponse(response);
  },

  // 14. CRUD Phòng (Rooms)
  createRoom: async (TenPhong, MaLoaiPhong) => {
    const response = await fetch(`${API_BASE_URL}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ TenPhong, MaLoaiPhong })
    });
    return handleResponse(response);
  },

  updateRoom: async (id, TenPhong, MaLoaiPhong, TrangThai) => {
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ TenPhong, MaLoaiPhong, TrangThai })
    });
    return handleResponse(response);
  },

  deleteRoom: async (id) => {
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },

  // 15. CRUD Khách hàng (Customers)
  getCustomers: async () => {
    const response = await fetch(`${API_BASE_URL}/customers`);
    return handleResponse(response);
  },

  createCustomer: async (HoTen, SoDienThoai) => {
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ HoTen, SoDienThoai })
    });
    return handleResponse(response);
  },

  updateCustomer: async (id, HoTen, SoDienThoai) => {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ HoTen, SoDienThoai })
    });
    return handleResponse(response);
  },

  deleteCustomer: async (id) => {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },

  // 16. CRUD Nhân viên (Employees)
  getEmployees: async () => {
    const response = await fetch(`${API_BASE_URL}/employees`);
    return handleResponse(response);
  },

  createEmployee: async (HoTen, SoDienThoai, MaMucLuong) => {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ HoTen, SoDienThoai, MaMucLuong })
    });
    return handleResponse(response);
  },

  updateEmployee: async (id, HoTen, SoDienThoai, MaMucLuong) => {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ HoTen, SoDienThoai, MaMucLuong })
    });
    return handleResponse(response);
  },

  deleteEmployee: async (id) => {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },

  // 17. SQL Views - Hóa đơn doanh thu
  getInvoicesFromView: async () => {
    const response = await fetch(`${API_BASE_URL}/stats/invoices`);
    return handleResponse(response);
  },

  // 18. SQL Views - Cảnh báo tồn kho
  getInventoryAlerts: async () => {
    const response = await fetch(`${API_BASE_URL}/stats/inventory-alerts`);
    return handleResponse(response);
  }
};
export default api;
