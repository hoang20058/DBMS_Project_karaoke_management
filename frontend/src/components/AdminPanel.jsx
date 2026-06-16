import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Edit2, Trash2, Home, Users, UserCheck, Receipt, Save, RefreshCw } from 'lucide-react';

export default function AdminPanel({ showToast, refreshRooms }) {
  const [subTab, setSubTab] = useState('rooms'); // 'rooms' | 'employees' | 'customers' | 'invoices'
  
  // Lists data
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [salaryLevels, setSalaryLevels] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Forms state
  const [roomForm, setRoomForm] = useState({ id: null, TenPhong: '', MaLoaiPhong: '' });
  const [empForm, setEmpForm] = useState({ id: null, HoTen: '', SoDienThoai: '', MaMucLuong: '' });
  const [custForm, setCustForm] = useState({ id: null, HoTen: '', SoDienThoai: '' });

  // Loaders
  const loadRooms = async () => {
    try {
      const res = await api.getRooms();
      setRooms(res.data || []);
    } catch (err) { showToast(err.message, 'error'); }
  };

  const loadEmployees = async () => {
    try {
      const res = await api.getEmployees();
      setEmployees(res.data || []);
    } catch (err) { showToast(err.message, 'error'); }
  };

  const loadCustomers = async () => {
    try {
      const res = await api.getCustomers();
      setCustomers(res.data || []);
    } catch (err) { showToast(err.message, 'error'); }
  };

  const loadInvoices = async () => {
    try {
      const res = await api.getInvoicesFromView();
      setInvoices(res.data || []);
    } catch (err) { showToast(err.message, 'error'); }
  };

  const loadMeta = async () => {
    try {
      const [rtRes, slRes] = await Promise.all([
        api.getRoomTypes(),
        api.getSalaryLevels()
      ]);
      setRoomTypes(rtRes.data || []);
      setSalaryLevels(slRes.data || []);
    } catch (err) {
      showToast('Không thể tải siêu dữ liệu: ' + err.message, 'error');
    }
  };

  useEffect(() => {
    setLoading(true);
    loadMeta();
    if (subTab === 'rooms') loadRooms();
    else if (subTab === 'employees') loadEmployees();
    else if (subTab === 'customers') loadCustomers();
    else if (subTab === 'invoices') loadInvoices();
    setLoading(false);
  }, [subTab]);

  // ==================== 1. CRUD PHÒNG ====================
  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    try {
      if (roomForm.id) {
        // Edit - Mặc định giữ TrangThai ban đầu
        const targetRoom = rooms.find(r => r.MaPhong === roomForm.id);
        await api.updateRoom(roomForm.id, roomForm.TenPhong, Number(roomForm.MaLoaiPhong), targetRoom.TrangThai);
        showToast('Cập nhật phòng thành công!', 'success');
      } else {
        // Create
        await api.createRoom(roomForm.TenPhong, Number(roomForm.MaLoaiPhong));
        showToast('Tạo phòng mới thành công!', 'success');
      }
      setRoomForm({ id: null, TenPhong: '', MaLoaiPhong: '' });
      loadRooms();
      refreshRooms();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const deleteRoom = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phòng này?')) return;
    try {
      await api.deleteRoom(id);
      showToast('Xóa phòng thành công!', 'success');
      loadRooms();
      refreshRooms();
    } catch (err) { showToast(err.message, 'error'); }
  };

  // ==================== 2. CRUD NHÂN VIÊN ====================
  const handleEmpSubmit = async (e) => {
    e.preventDefault();
    try {
      if (empForm.id) {
        await api.updateEmployee(empForm.id, empForm.HoTen, empForm.SoDienThoai, Number(empForm.MaMucLuong));
        showToast('Cập nhật nhân viên thành công!', 'success');
      } else {
        await api.createEmployee(empForm.HoTen, empForm.SoDienThoai, Number(empForm.MaMucLuong));
        showToast('Tạo nhân viên thành công!', 'success');
      }
      setEmpForm({ id: null, HoTen: '', SoDienThoai: '', MaMucLuong: '' });
      loadEmployees();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const deleteEmployee = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) return;
    try {
      await api.deleteEmployee(id);
      showToast('Xóa nhân viên thành công!', 'success');
      loadEmployees();
    } catch (err) { showToast(err.message, 'error'); }
  };

  // ==================== 3. CRUD KHÁCH HÀNG ====================
  const handleCustSubmit = async (e) => {
    e.preventDefault();
    try {
      if (custForm.id) {
        await api.updateCustomer(custForm.id, custForm.HoTen, custForm.SoDienThoai);
        showToast('Cập nhật thông tin khách hàng thành công!', 'success');
      } else {
        await api.createCustomer(custForm.HoTen, custForm.SoDienThoai);
        showToast('Tạo khách hàng mới thành công!', 'success');
      }
      setCustForm({ id: null, HoTen: '', SoDienThoai: '' });
      loadCustomers();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) return;
    try {
      await api.deleteCustomer(id);
      showToast('Xóa khách hàng thành công!', 'success');
      loadCustomers();
    } catch (err) { showToast(err.message, 'error'); }
  };

  return (
    <div className="space-y-6">
      
      {/* Sub tabs navigation */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-4">
        <button
          onClick={() => setSubTab('rooms')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            subTab === 'rooms' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'text-gray-400 hover:text-white bg-white/5'
          }`}
        >
          <Home size={14} />
          Quản lý Phòng
        </button>
        <button
          onClick={() => setSubTab('employees')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            subTab === 'employees' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'text-gray-400 hover:text-white bg-white/5'
          }`}
        >
          <UserCheck size={14} />
          Quản lý Nhân Viên
        </button>
        <button
          onClick={() => setSubTab('customers')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            subTab === 'customers' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'text-gray-400 hover:text-white bg-white/5'
          }`}
        >
          <Users size={14} />
          Quản lý Khách Hàng
        </button>
        <button
          onClick={() => setSubTab('invoices')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            subTab === 'invoices' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'text-gray-400 hover:text-white bg-white/5'
          }`}
        >
          <Receipt size={14} />
          Hóa Đơn Doanh Thu (Views)
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw size={28} className="animate-spin text-rose-500 mb-3" />
          <p className="text-gray-500 text-xs">Đang tải dữ liệu danh mục...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CỘT 1 + 2: HIỂN THỊ BẢNG DANH SÁCH (2/3 width) */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 border-b border-white/5 pb-2">
              Danh sách {subTab === 'rooms' ? 'Phòng Hát' : subTab === 'employees' ? 'Nhân Viên' : subTab === 'customers' ? 'Khách Hàng' : 'Hóa Đơn'}
            </h3>

            {/* Render tương ứng từng Tab */}
            {subTab === 'rooms' && (
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left text-xs text-gray-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 text-gray-500 font-bold border-b border-white/5 text-[10px] uppercase">
                      <th className="px-4 py-3">Mã</th>
                      <th className="px-4 py-3">Tên Phòng</th>
                      <th className="px-4 py-3">Loại Phòng</th>
                      <th className="px-4 py-3">Giá Giờ</th>
                      <th className="px-4 py-3">Trạng Thái</th>
                      <th className="px-4 py-3 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map(r => (
                      <tr key={r.MaPhong} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="px-4 py-3 font-semibold text-gray-400">#{r.MaPhong}</td>
                        <td className="px-4 py-3 font-bold text-gray-200">{r.TenPhong}</td>
                        <td className="px-4 py-3 text-gray-300">{r.TenLoaiPhong}</td>
                        <td className="px-4 py-3 text-emerald-400 font-semibold">{Number(r.GiaTheoGio).toLocaleString('vi-VN')} đ/h</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            r.TrangThai === 'Trống' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20' : 'bg-rose-950/20 text-rose-400 border-rose-500/20'
                          }`}>{r.TrangThai}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1.5">
                            <button onClick={() => setRoomForm({ id: r.MaPhong, TenPhong: r.TenPhong, MaLoaiPhong: r.MaLoaiPhong })} className="p-1.5 hover:bg-blue-500/10 text-blue-400 rounded-lg transition"><Edit2 size={13} /></button>
                            <button onClick={() => deleteRoom(r.MaPhong)} disabled={r.TrangThai === 'Đang Sử Dụng'} className="p-1.5 hover:bg-rose-500/10 text-rose-400 rounded-lg transition disabled:opacity-30"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {subTab === 'employees' && (
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left text-xs text-gray-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 text-gray-500 font-bold border-b border-white/5 text-[10px] uppercase">
                      <th className="px-4 py-3">Mã</th>
                      <th className="px-4 py-3">Họ Tên</th>
                      <th className="px-4 py-3">Số Điện Thoại</th>
                      <th className="px-4 py-3">Chức vụ</th>
                      <th className="px-4 py-3 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(e => (
                      <tr key={e.MaNV} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="px-4 py-3 font-semibold text-gray-400">#{e.MaNV}</td>
                        <td className="px-4 py-3 font-bold text-gray-200">{e.HoTen}</td>
                        <td className="px-4 py-3 text-gray-300">{e.SoDienThoai}</td>
                        <td className="px-4 py-3 text-yellow-500 font-semibold">{e.TenChucVu || 'N/A'}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1.5">
                            <button onClick={() => setEmpForm({ id: e.MaNV, HoTen: e.HoTen, SoDienThoai: e.SoDienThoai, MaMucLuong: e.MaMucLuong })} className="p-1.5 hover:bg-blue-500/10 text-blue-400 rounded-lg transition"><Edit2 size={13} /></button>
                            <button onClick={() => deleteEmployee(e.MaNV)} className="p-1.5 hover:bg-rose-500/10 text-rose-400 rounded-lg transition"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {subTab === 'customers' && (
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left text-xs text-gray-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 text-gray-500 font-bold border-b border-white/5 text-[10px] uppercase">
                      <th className="px-4 py-3">Mã</th>
                      <th className="px-4 py-3">Họ Tên</th>
                      <th className="px-4 py-3 text-center">Số Điện Thoại</th>
                      <th className="px-4 py-3 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(c => (
                      <tr key={c.MaKH} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="px-4 py-3 font-semibold text-gray-400">#{c.MaKH}</td>
                        <td className="px-4 py-3 font-bold text-gray-200">{c.HoTen}</td>
                        <td className="px-4 py-3 text-gray-300">{c.SoDienThoai}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1.5">
                            <button onClick={() => setCustForm({ id: c.MaKH, HoTen: c.HoTen, SoDienThoai: c.SoDienThoai })} className="p-1.5 hover:bg-blue-500/10 text-blue-400 rounded-lg transition"><Edit2 size={13} /></button>
                            <button onClick={() => deleteCustomer(c.MaKH)} className="p-1.5 hover:bg-rose-500/10 text-rose-400 rounded-lg transition"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {subTab === 'invoices' && (
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left text-xs text-gray-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 text-gray-500 font-bold border-b border-white/5 text-[10px] uppercase">
                      <th className="px-4 py-3">Mã HD</th>
                      <th className="px-4 py-3">Khách Hàng</th>
                      <th className="px-4 py-3">Nhân Viên Lập</th>
                      <th className="px-4 py-3">Phòng Hát</th>
                      <th className="px-4 py-3 text-right">Tổng Tiền</th>
                      <th className="px-4 py-3 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.MaHD} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="px-4 py-3 font-semibold text-gray-400">#{inv.MaHD}</td>
                        <td className="px-4 py-3 font-bold text-gray-200">{inv.KhachHang}</td>
                        <td className="px-4 py-3 text-gray-300">{inv.NhanVienLap}</td>
                        <td className="px-4 py-3 text-gray-300">{inv.TenPhong}</td>
                        <td className="px-4 py-3 text-right text-emerald-450 font-bold">{Number(inv.TongTien || 0).toLocaleString('vi-VN')} đ</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            inv.TrangThai === 'Đã Thanh Toán' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20' : 'bg-yellow-950/20 text-yellow-400 border-yellow-500/20'
                          }`}>{inv.TrangThai}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* CỘT 3: FORM THÊM / SỬA (1/3 width) - Không hiển thị ở Tab Hóa đơn */}
          <div className="lg:col-span-1">
            {subTab === 'invoices' ? (
              <div className="glass-panel p-6 rounded-2xl text-center space-y-4">
                <Receipt size={36} className="mx-auto text-rose-500/40 animate-pulse" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-300">Lịch sử doanh thu</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Bảng danh sách bên trái được liên kết trực tiếp từ SQL View <strong>`v_DoanhThuHoaDon`</strong> của hệ thống quản trị MySQL để thống kê các giao dịch đã hoàn tất.
                </p>
              </div>
            ) : (
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 border-b border-white/5 pb-2">
                  {subTab === 'rooms' 
                    ? (roomForm.id ? 'Sửa Phòng Hát' : 'Thêm Phòng Hát')
                    : subTab === 'employees'
                      ? (empForm.id ? 'Sửa Nhân Viên' : 'Thêm Nhân Viên')
                      : (custForm.id ? 'Sửa Khách Hàng' : 'Thêm Khách Hàng')
                  }
                </h3>

                {/* FORM PHÒNG */}
                {subTab === 'rooms' && (
                  <form onSubmit={handleRoomSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Tên phòng hát</label>
                      <input
                        type="text"
                        value={roomForm.TenPhong}
                        onChange={e => setRoomForm({...roomForm, TenPhong: e.target.value})}
                        placeholder="Ví dụ: Phòng VIP 301..."
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500 text-gray-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Loại phòng</label>
                      <select
                        value={roomForm.MaLoaiPhong}
                        onChange={e => setRoomForm({...roomForm, MaLoaiPhong: e.target.value})}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500 text-gray-100"
                        required
                      >
                        <option value="">-- Chọn Loại Phòng --</option>
                        {roomTypes.map(t => (
                          <option key={t.MaLoaiPhong} value={t.MaLoaiPhong}>{t.TenLoaiPhong} ({Number(t.GiaTheoGio).toLocaleString('vi-VN')}đ/h)</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      {roomForm.id && (
                        <button type="button" onClick={() => setRoomForm({ id: null, TenPhong: '', MaLoaiPhong: '' })} className="flex-1 bg-white/5 text-gray-400 py-2 rounded-xl text-xs transition">Hủy</button>
                      )}
                      <button type="submit" className="flex-1 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5">
                        <Save size={13} />
                        Lưu phòng
                      </button>
                    </div>
                  </form>
                )}

                {/* FORM NHÂN VIÊN */}
                {subTab === 'employees' && (
                  <form onSubmit={handleEmpSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Họ tên nhân viên</label>
                      <input
                        type="text"
                        value={empForm.HoTen}
                        onChange={e => setEmpForm({...empForm, HoTen: e.target.value})}
                        placeholder="Nhập tên nhân viên..."
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500 text-gray-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Số điện thoại</label>
                      <input
                        type="text"
                        value={empForm.SoDienThoai}
                        onChange={e => setEmpForm({...empForm, SoDienThoai: e.target.value})}
                        placeholder="Nhập SĐT..."
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500 text-gray-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Chức vụ (Hệ số lương)</label>
                      <select
                        value={empForm.MaMucLuong}
                        onChange={e => setEmpForm({...empForm, MaMucLuong: e.target.value})}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500 text-gray-100"
                        required
                      >
                        <option value="">-- Chọn chức vụ mức lương --</option>
                        {salaryLevels.map(sl => (
                          <option key={sl.MaMucLuong} value={sl.MaMucLuong}>{sl.TenChucVu} (TN: {Number(sl.LuongTrachNhiem).toLocaleString('vi-VN')}đ)</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2 pt-2">
                      {empForm.id && (
                        <button type="button" onClick={() => setEmpForm({ id: null, HoTen: '', SoDienThoai: '', MaMucLuong: '' })} className="flex-1 bg-white/5 text-gray-400 py-2 rounded-xl text-xs transition">Hủy</button>
                      )}
                      <button type="submit" className="flex-1 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5">
                        <Save size={13} />
                        Lưu nhân viên
                      </button>
                    </div>
                  </form>
                )}

                {/* FORM KHÁCH HÀNG */}
                {subTab === 'customers' && (
                  <form onSubmit={handleCustSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Họ tên khách hàng</label>
                      <input
                        type="text"
                        value={custForm.HoTen}
                        onChange={e => setCustForm({...custForm, HoTen: e.target.value})}
                        placeholder="Nhập tên khách..."
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500 text-gray-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Số điện thoại</label>
                      <input
                        type="text"
                        value={custForm.SoDienThoai}
                        onChange={e => setCustForm({...custForm, SoDienThoai: e.target.value})}
                        placeholder="Nhập SĐT..."
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500 text-gray-100"
                        required
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      {custForm.id && (
                        <button type="button" onClick={() => setCustForm({ id: null, HoTen: '', SoDienThoai: '' })} className="flex-1 bg-white/5 text-gray-400 py-2 rounded-xl text-xs transition">Hủy</button>
                      )}
                      <button type="submit" className="flex-1 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5">
                        <Save size={13} />
                        Lưu khách hàng
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
