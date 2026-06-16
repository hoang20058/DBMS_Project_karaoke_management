import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DollarSign, ShieldAlert, Award, CreditCard, RefreshCw, CheckCircle, Clock } from 'lucide-react';

export default function SalaryPanel({ showToast }) {
  // State cho Chốt lương
  const [closeMonth, setCloseMonth] = useState(new Date().getMonth() + 1);
  const [closeYear, setCloseYear] = useState(new Date().getFullYear());
  const [isClosing, setIsClosing] = useState(false);

  // State cho Thanh toán lương
  const [payEmpId, setPayEmpId] = useState('');
  const [payMonth, setPayMonth] = useState(new Date().getMonth() + 1);
  const [payYear, setPayYear] = useState(new Date().getFullYear());
  const [isPaying, setIsPaying] = useState(false);

  // State danh sách lương chốt và danh sách nhân viên để chọn dropdown
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingSalaries, setLoadingSalaries] = useState(true);

  // Fetch danh sách lương
  const fetchSalaries = async () => {
    setLoadingSalaries(true);
    try {
      const res = await api.getSalaryList();
      setSalaries(res.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingSalaries(false);
    }
  };

  // Fetch danh sách nhân viên để chọn trả lương
  const fetchEmployees = async () => {
    try {
      const res = await api.getEmployees();
      setEmployees(res.data || []);
    } catch (err) {
      console.error('Không thể tải danh sách nhân viên:', err.message);
    }
  };

  const loadData = async () => {
    setLoadingSalaries(true);
    await Promise.all([
      fetchSalaries(),
      fetchEmployees()
    ]);
    setLoadingSalaries(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Xử lý Chốt lương
  const handleCloseSalary = async (e) => {
    e.preventDefault();
    setIsClosing(true);
    try {
      const res = await api.closeSalary(Number(closeMonth), Number(closeYear));
      showToast(res.message || 'Chốt lương tháng thành công!', 'success');
      await fetchSalaries(); // Load lại bảng lương
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsClosing(false);
    }
  };

  // Xử lý Thanh toán lương
  const handlePaySalary = async (e) => {
    e.preventDefault();
    setIsPaying(true);
    try {
      const maNV = payEmpId === '' ? null : Number(payEmpId);
      const res = await api.paySalary(maNV, Number(payMonth), Number(payYear));
      showToast(res.message || 'Thanh toán lương thành công!', 'success');
      setPayEmpId(''); // Reset form
      await fetchSalaries(); // Load lại bảng lương
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <DollarSign className="text-yellow-500 w-6 h-6" />
        <h2 className="text-xl font-bold tracking-wide">QUẢN LÝ LƯƠNG NHÂN VIÊN</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel Chốt lương */}
        <form onSubmit={handleCloseSalary} className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 bg-yellow-500/10 p-4 rounded-bl-3xl text-yellow-500">
            <Award size={24} />
          </div>
          <h3 className="text-lg font-bold text-yellow-400 mb-2">1. Chốt Lương Hệ Thống</h3>
          <p className="text-gray-400 text-xs mb-6">
            Thực hiện tính toán lương trách nhiệm, phụ cấp, tổng hợp ca làm và thưởng phạt để ghi nhận vào sổ lương tháng.
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase font-medium">Tháng</label>
                <select
                  value={closeMonth}
                  onChange={(e) => setCloseMonth(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-yellow-500 text-gray-100"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>Tháng {m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase font-medium">Năm</label>
                <input
                  type="number"
                  value={closeYear}
                  onChange={(e) => setCloseYear(e.target.value)}
                  placeholder="2026"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-yellow-500 text-gray-100"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isClosing}
              className="w-full mt-4 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-semibold text-sm py-2.5 rounded-xl transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isClosing ? (
                <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Khóa Sổ & Chốt Lương'
              )}
            </button>
          </div>
        </form>

        {/* Panel Thanh toán lương */}
        <form onSubmit={handlePaySalary} className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 bg-emerald-500/10 p-4 rounded-bl-3xl text-emerald-400">
            <CreditCard size={24} />
          </div>
          <h3 className="text-lg font-bold text-emerald-400 mb-2">2. Chi Trả Lương</h3>
          <p className="text-gray-400 text-xs mb-6">
            Thực hiện chi trả lương cho nhân viên cụ thể hoặc toàn hệ thống. Tự động lập phiếu chi tương ứng.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase font-medium">
                Chọn Nhân Viên Nhận Lương
              </label>
              <select
                value={payEmpId}
                onChange={(e) => setPayEmpId(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-gray-100"
              >
                <option value="">-- Trả lương cho toàn bộ nhân viên --</option>
                {employees.map((emp) => (
                  <option key={emp.MaNV} value={emp.MaNV}>
                    {emp.HoTen} (Mã NV: #{emp.MaNV})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase font-medium">Tháng</label>
                <select
                  value={payMonth}
                  onChange={(e) => setPayMonth(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-gray-100"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>Tháng {m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase font-medium">Năm</label>
                <input
                  type="number"
                  value={payYear}
                  onChange={(e) => setPayYear(e.target.value)}
                  placeholder="2026"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-gray-100"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPaying}
              className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold text-sm py-2.5 rounded-xl transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPaying ? (
                <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Thanh Toán Lương'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Bảng lương chốt từ DBMS */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Lịch Sử Chốt Lương (Bảng Lương Hệ Thống)</h3>
          </div>
          <button
            type="button"
            onClick={fetchSalaries}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-white/5 border border-white/5 hover:border-white/10 px-3 py-1.5 rounded-lg transition"
          >
            <RefreshCw size={12} className={loadingSalaries ? 'animate-spin' : ''} />
            Làm mới dữ liệu
          </button>
        </div>

        {loadingSalaries ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <span className="w-7 h-7 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mb-3"></span>
            <p className="text-xs">Đang tải dữ liệu từ CSDL...</p>
          </div>
        ) : salaries.length === 0 ? (
          <div className="text-center py-12 text-xs text-gray-500 border border-dashed border-white/5 rounded-xl">
            Chưa có bảng lương nào được chốt trong hệ thống. Hãy thực hiện "Chốt Lương Hệ Thống" ở trên.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left text-xs text-gray-300 border-collapse">
              <thead>
                <tr className="bg-slate-900/80 text-gray-500 font-bold uppercase tracking-wider text-[10px] border-b border-white/5">
                  <th className="px-4 py-3">Nhân Viên</th>
                  <th className="px-3 py-3 text-center">Tháng/Năm</th>
                  <th className="px-3 py-3 text-right">Lương TN</th>
                  <th className="px-3 py-3 text-right">Phụ Cấp</th>
                  <th className="px-3 py-3 text-center">Ca Làm</th>
                  <th className="px-3 py-3 text-right">Thưởng/Phạt</th>
                  <th className="px-3 py-3 text-right font-bold text-yellow-500">Thực Lĩnh</th>
                  <th className="px-4 py-3 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map((item) => (
                  <tr key={item.MaBangLuong} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-gray-200">{item.TenNhanVien}</p>
                        <p className="text-[10px] text-gray-500">Mã NV: #{item.MaNV}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-gray-200">
                      {item.Thang}/{item.Nam}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {Number(item.LuongTrachNhiem).toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-3 py-3 text-right">
                      {Number(item.TienPhuCapChucVu).toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div>
                        <p className="font-semibold text-gray-200">{item.TongCaLam} ca</p>
                        <p className="text-[10px] text-gray-500">({Number(item.LuongCa).toLocaleString('vi-VN')}đ/ca)</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <p className="text-emerald-400">+{Number(item.TongThuong).toLocaleString('vi-VN')}đ</p>
                      <p className="text-rose-400">-{Number(item.TongPhat).toLocaleString('vi-VN')}đ</p>
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-gray-100">
                      {Number(item.TongLuong).toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider border shadow-sm ${
                        item.TrangThai === 'Đã Trả'
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
                          : 'bg-yellow-950/40 text-yellow-400 border-yellow-500/20 animate-pulse'
                      }`}>
                        {item.TrangThai}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-blue-950/20 border border-blue-500/20 p-4 rounded-xl flex gap-3 text-xs text-blue-300">
        <ShieldAlert size={20} className="shrink-0 text-blue-400" />
        <div>
          <p className="font-semibold mb-1">Quy tắc Nghiệp vụ:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Bạn chỉ có thể <strong>Thanh Toán Lương</strong> sau khi hệ thống đã <strong>Chốt Lương</strong> cho tháng tương ứng.</li>
            <li>Phiếu chi tài chính sẽ được sinh tự động cho mỗi giao dịch thanh toán lương được duyệt.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
