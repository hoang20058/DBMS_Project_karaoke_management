import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, Play, User, Users, RefreshCw, UserPlus, Save } from 'lucide-react';

export default function CheckInModal({ room, onClose, onSuccess, showToast }) {
  const [maNV, setMaNV] = useState('');
  const [maKH, setMaKH] = useState('');
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State phục vụ Thêm nhanh Khách Hàng mới
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  // Tải danh sách Nhân viên và Khách hàng
  const loadLists = async () => {
    try {
      const [empRes, custRes] = await Promise.all([
        api.getEmployees(),
        api.getCustomers()
      ]);
      setEmployees(empRes.data || []);
      setCustomers(custRes.data || []);
    } catch (err) {
      showToast('Lỗi khi tải danh sách: ' + err.message, 'error');
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoadingLists(true);
      await loadLists();
      setLoadingLists(false);
    };
    initData();
  }, []);

  // Submit mở phòng
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!maNV || !maKH) {
      showToast('Vui lòng chọn đầy đủ Nhân Viên và Khách Hàng!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createBooking(room.MaPhong, Number(maNV), Number(maKH));
      showToast(res.message || 'Mở phòng hát thành công!', 'success');
      onSuccess(); // Tải lại danh sách phòng
      onClose(); // Đóng modal
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit tạo nhanh khách hàng mới
  const handleQuickAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      showToast('Vui lòng điền đầy đủ Tên và Số điện thoại khách hàng!', 'error');
      return;
    }

    setIsSavingCustomer(true);
    try {
      const res = await api.createCustomer(newCustName.trim(), newCustPhone.trim());
      showToast('Thêm khách hàng mới thành công!', 'success');
      
      // Load lại danh sách khách hàng từ CSDL
      const custRes = await api.getCustomers();
      const updatedCustomers = custRes.data || [];
      setCustomers(updatedCustomers);

      // Tự động gán mã khách hàng vừa tạo làm khách hàng được chọn
      const newlyCreated = updatedCustomers.find(c => c.SoDienThoai === newCustPhone.trim());
      if (newlyCreated) {
        setMaKH(newlyCreated.MaKH);
      } else {
        // Fallback: nếu có id trả về từ insertId
        if (res.data?.MaKH) setMaKH(res.data.MaKH);
      }

      // Reset form nhanh
      setNewCustName('');
      setNewCustPhone('');
      setShowQuickAdd(false);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSavingCustomer(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Modal Card */}
      <div className="glass-panel w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center bg-slate-900 px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <h3 className="font-bold text-lg tracking-wide text-gray-200">
              {showQuickAdd ? 'THÊM KHÁCH HÀNG MỚI' : 'MỞ PHÒNG HÁT'}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition bg-white/5 hover:bg-white/10 p-1.5 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        {loadingLists ? (
          <div className="p-10 flex flex-col items-center justify-center text-gray-400">
            <RefreshCw size={24} className="animate-spin text-emerald-500 mb-3" />
            <p className="text-xs">Đang tải danh sách từ CSDL...</p>
          </div>
        ) : showQuickAdd ? (
          /* GIAO DIỆN THÊM NHANH KHÁCH HÀNG */
          <form onSubmit={handleQuickAddCustomer} className="p-6 space-y-4">
            <div className="bg-slate-900/50 p-4 rounded-xl text-xs text-gray-400 border border-white/5">
              Nhập thông tin khách hàng mới để lưu danh bạ và tự động áp dụng đặt phòng này.
            </div>

            <div>
              <label className="block text-xs text-gray-400 font-medium mb-1.5 uppercase">Họ và Tên Khách Hàng *</label>
              <input
                type="text"
                value={newCustName}
                onChange={e => setNewCustName(e.target.value)}
                placeholder="Nhập họ và tên..."
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500 text-gray-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 font-medium mb-1.5 uppercase">Số Điện Thoại *</label>
              <input
                type="text"
                value={newCustPhone}
                onChange={e => setNewCustPhone(e.target.value)}
                placeholder="Nhập số điện thoại..."
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500 text-gray-100"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-2.5 rounded-xl font-medium text-sm transition"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={isSavingCustomer}
                className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-slate-950 font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-1.5 shadow-lg"
              >
                {isSavingCustomer ? (
                  <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Save size={15} />
                    Lưu & Chọn
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* GIAO DIỆN ĐẶT PHÒNG THÔNG THƯỜNG */
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Room info banner */}
            <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-emerald-400 uppercase font-bold tracking-wider">Tên Phòng</p>
                <h4 className="text-xl font-bold text-gray-100">{room.TenPhong}</h4>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Giá theo giờ</p>
                <p className="font-bold text-emerald-300">
                  {Number(room.GiaTheoGio).toLocaleString('vi-VN')} đ/h
                </p>
              </div>
            </div>

            {/* Form Inputs */}
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs text-gray-400 uppercase font-medium mb-1.5">
                  <User size={14} className="text-emerald-400" />
                  Chọn Nhân Viên Phục Vụ <span className="text-red-500">*</span>
                </label>
                <select
                  value={maNV}
                  onChange={(e) => setMaNV(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 text-gray-100"
                  required
                >
                  <option value="" disabled>-- Chọn nhân viên --</option>
                  {employees.map((emp) => (
                    <option key={emp.MaNV} value={emp.MaNV}>
                      {emp.HoTen} (Chức vụ: {emp.TenChucVu || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="flex items-center gap-1.5 text-xs text-gray-400 uppercase font-medium">
                    <Users size={14} className="text-emerald-400" />
                    Chọn Khách Hàng <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowQuickAdd(true)}
                    className="text-rose-400 hover:text-rose-300 text-[11px] font-bold flex items-center gap-0.5 hover:underline"
                  >
                    <UserPlus size={11} />
                    + Khách hàng mới
                  </button>
                </div>
                
                <select
                  value={maKH}
                  onChange={(e) => setMaKH(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 text-gray-100"
                  required
                >
                  <option value="" disabled>-- Chọn khách hàng --</option>
                  {customers.map((cust) => (
                    <option key={cust.MaKH} value={cust.MaKH}>
                      {cust.HoTen} - SĐT: {cust.SoDienThoai}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-2.5 rounded-xl font-medium text-sm transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" />
                    Mở Phòng Hát
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
