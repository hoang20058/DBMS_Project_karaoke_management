import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, CreditCard, Clock, User, Coffee, FileText, CheckCircle2, ChevronRight, Trash2, HelpCircle, Undo2 } from 'lucide-react';

export default function RoomDetails({ room, onClose, onCheckoutSuccess, showToast }) {
  const [activeBooking, setActiveBooking] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [maSP, setMaSP] = useState('');
  const [soLuong, setSoLuong] = useState('1');
  const [isAddingService, setIsAddingService] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  // State chứa biên lai sau khi thanh toán thành công
  const [receipt, setReceipt] = useState(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  // Fetch active booking info (kết hợp View v_PhongDangDung từ Backend)
  const fetchActiveBooking = async () => {
    try {
      const res = await api.getActiveBooking(room.MaPhong);
      setActiveBooking(res.data);
    } catch (err) {
      showToast(err.message, 'error');
      onClose(); // Đóng panel nếu có lỗi
    }
  };

  // Fetch danh sách sản phẩm để hiển thị dropdown
  const fetchProducts = async () => {
    try {
      const res = await api.getProducts();
      setProducts(res.data || []);
    } catch (err) {
      console.error('Lỗi tải sản phẩm:', err.message);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchActiveBooking(),
      fetchProducts()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    if (room && room.TrangThai === 'Đang Sử Dụng') {
      loadData();
    }
  }, [room]);

  // Sửa số lượng dịch vụ
  const handleUpdateQuantity = async (maCTSP, currentQty, direction) => {
    const newQty = direction === 'inc' ? currentQty + 1 : currentQty - 1;
    if (newQty <= 0) {
      handleDeleteService(maCTSP);
      return;
    }
    try {
      await api.updateServiceQuantity(maCTSP, newQty);
      showToast('Cập nhật số lượng dịch vụ thành công!', 'success');
      await Promise.all([fetchActiveBooking(), fetchProducts()]); // Reload dữ liệu phòng & sản phẩm (tồn kho)
    } catch (err) {
      // Bắt lỗi custom 45000 ném ra từ trigger hoặc procedure của CSDL
      showToast(err.message, 'error');
    }
  };

  // Xóa dịch vụ khỏi phòng
  const handleDeleteService = async (maCTSP) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này khỏi phòng và hoàn kho?')) return;
    try {
      const res = await api.deleteService(maCTSP);
      showToast(res.message || 'Đã xóa dịch vụ thành công!', 'success');
      await Promise.all([fetchActiveBooking(), fetchProducts()]); // Reload
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Thêm dịch vụ
  const handleAddService = async (e) => {
    e.preventDefault();
    if (!maSP || !soLuong.trim()) return;
    
    setIsAddingService(true);
    try {
      const res = await api.addService(
        activeBooking.MaPhongDaDat,
        Number(maSP),
        Number(soLuong)
      );
      showToast(res.message || 'Thêm dịch vụ thành công!', 'success');
      setMaSP(''); // Reset form
      setSoLuong('1');
      await Promise.all([fetchActiveBooking(), fetchProducts()]); // Reload
    } catch (err) {
      // Bắt lỗi custom SIGNAL SQLSTATE 45000 (Ví dụ: Không đủ hàng trong kho!)
      showToast(err.message, 'error');
    } finally {
      setIsAddingService(false);
    }
  };

  // Thanh toán
  const handleCheckout = async () => {
    if (!activeBooking) return;
    
    setIsCheckingOut(true);
    try {
      const res = await api.checkout(activeBooking.MaHD);
      showToast(res.message || 'Thanh toán thành công!', 'success');
      setReceipt({
        ...res.data,
        roomName: room.TenPhong,
        maHD: activeBooking.MaHD,
        gioVao: activeBooking.GioVao,
        tenKH: activeBooking.TenKhachHang || `Khách hàng (Mã KH: ${activeBooking.MaKH})`,
        tenNV: activeBooking.TenNhanVien || `Nhân viên (Mã NV: ${activeBooking.MaNV})`,
        dichVu: activeBooking.dichVu || []
      });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleFinishCheckout = () => {
    setReceipt(null);
    onCheckoutSuccess(); // Reload rooms list and reset parent state
  };

  const handleRollbackCheckout = async () => {
    if (!receipt || !receipt.maHD) return;
    if (!window.confirm('Bạn có chắc chắn muốn hoàn tác thanh toán và tiếp tục sử dụng phòng này?')) return;
    
    setIsRollingBack(true);
    try {
      const res = await api.rollbackCheckout(receipt.maHD);
      showToast(res.message || 'Hoàn tác thanh toán thành công!', 'success');
      setReceipt(null);
      await loadData(); // Reload active booking data to reflect re-occupancy
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsRollingBack(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 text-sm">Đang tải hóa đơn phòng...</p>
      </div>
    );
  }

  // Giao diện Hóa đơn thanh toán (Receipt)
  if (receipt) {
    return (
      <div className="glass-panel p-6 rounded-2xl border-emerald-500/20 relative overflow-hidden animate-in fade-in duration-300">
        <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 p-4 rounded-bl-3xl">
          <CheckCircle2 size={32} />
        </div>

        <div className="text-center pb-6 border-b border-white/10">
          <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">Thanh toán hoàn tất</p>
          <h3 className="text-2xl font-bold tracking-wide">BIÊN LAI ĐIỆN TỬ</h3>
          <p className="text-gray-500 text-xs mt-1">Hóa đơn #{receipt.maHD}</p>
        </div>

        <div className="py-6 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-400 border-b border-white/5 pb-4">
            <div>Phòng hát:</div>
            <div className="text-right text-gray-200 font-bold">{receipt.roomName}</div>
            <div>Khách hàng:</div>
            <div className="text-right text-gray-200">{receipt.tenKH}</div>
            <div>Nhân viên phục vụ:</div>
            <div className="text-right text-gray-200">{receipt.tenNV}</div>
            <div>Giờ vào:</div>
            <div className="text-right text-gray-200">{new Date(receipt.gioVao).toLocaleString('vi-VN')}</div>
            <div>Giờ thanh toán:</div>
            <div className="text-right text-gray-200">{new Date().toLocaleString('vi-VN')}</div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs text-gray-400 uppercase font-bold tracking-wider">Chi tiết thanh toán</h4>
            
            {/* Tiền phòng */}
            <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-white/5">
              <div className="flex items-center gap-2">
                <Clock className="text-rose-400 w-4 h-4" />
                <div>
                  <p className="font-semibold text-gray-200">Tiền giờ hát</p>
                  <p className="text-xs text-gray-500">Số giờ tính: {receipt.TongGioTinhTien}h (Thực tế {receipt.TongSoPhutThucTe} phút)</p>
                </div>
              </div>
              <span className="font-bold text-gray-100">{receipt.TienPhong.toLocaleString('vi-VN')} đ</span>
            </div>

            {/* Tiền dịch vụ */}
            <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-white/5">
              <div className="flex items-center gap-2">
                <Coffee className="text-yellow-400 w-4 h-4" />
                <div>
                  <p className="font-semibold text-gray-200">Tiền dịch vụ</p>
                  <p className="text-xs text-gray-500">Tổng cộng {receipt.dichVu.length} món ăn/uống</p>
                </div>
              </div>
              <span className="font-bold text-gray-100">{receipt.TienDichVu.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          {/* Tổng thu */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex justify-between items-center mt-6">
            <span className="text-base font-bold text-emerald-400">TỔNG THANH TOÁN:</span>
            <span className="text-2xl font-black text-emerald-400">{receipt.TongCong.toLocaleString('vi-VN')} đ</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={handleRollbackCheckout}
            disabled={isRollingBack}
            className="bg-white/5 hover:bg-white/10 text-rose-400 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 border border-rose-500/20 disabled:opacity-50 text-sm shadow-md"
          >
            {isRollingBack ? (
              <span className="w-5 h-5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Undo2 size={16} />
                Quay lại (Hoàn tác)
              </>
            )}
          </button>
          <button
            onClick={handleFinishCheckout}
            disabled={isRollingBack}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 disabled:opacity-50 text-sm"
          >
            Xác nhận giải phóng
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl border-rose-500/10 space-y-6 animate-in fade-in duration-300">
      
      {/* Room Details Header */}
      <div className="flex justify-between items-start border-b border-white/10 pb-4">
        <div>
          <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider inline-block mb-1.5 animate-pulse">
            Đang Sử Dụng
          </span>
          <h3 className="text-2xl font-bold text-gray-100">{room.TenPhong}</h3>
          <p className="text-xs text-gray-400 mt-1">Loại: {room.TenLoaiPhong} - {Number(room.GiaTheoGio).toLocaleString('vi-VN')} đ/h</p>
        </div>
        <button 
          onClick={onClose} 
          className="text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg text-xs"
        >
          Đóng
        </button>
      </div>

      {/* Booking Details Grid & View Statistics */}
      {activeBooking && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 bg-slate-900/50 p-4 rounded-2xl border border-white/5 text-xs text-gray-400">
            <div className="flex items-center gap-1.5 col-span-2">
              <Clock size={14} className="text-rose-400 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-medium">Thời gian sử dụng (CSDL Tạm Tính)</p>
                <p className="font-bold text-emerald-400 text-sm">{activeBooking.ThoiGianSuDung || 'Đang mở...'}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-2 border-t border-white/5 col-span-2">
              <User size={14} className="text-rose-400" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-medium">Khách hàng</p>
                <p className="font-semibold text-gray-200">{activeBooking.TenKhachHang || `Mã KH: ${activeBooking.MaKH}`}</p>
              </div>
            </div>
            
            <div className="col-span-2 pt-2 border-t border-white/5 flex justify-between text-[11px] text-gray-500">
              <span>Hóa đơn: <strong>#{activeBooking.MaHD}</strong></span>
              <span>Mở bởi: <strong>{activeBooking.TenNhanVien || `Mã NV: ${activeBooking.MaNV}`}</strong></span>
            </div>
          </div>

          {/* Realtime temporary cost breakdown from DBMS view */}
          <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Tiền phòng tạm tính:</span>
              <span className="font-semibold text-gray-200">{Number(activeBooking.TienPhongTamTinh || 0).toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tiền dịch vụ tạm tính:</span>
              <span className="font-semibold text-gray-200">{Number(activeBooking.TienDichVuTamTinh || 0).toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/5 text-sm font-bold">
              <span className="text-rose-400">TỔNG TẠM TÍNH:</span>
              <span className="text-rose-400">{Number(activeBooking.TongTamTinh || 0).toLocaleString('vi-VN')} đ</span>
            </div>
          </div>
        </div>
      )}

      {/* Services ordered section */}
      <div className="space-y-3">
        <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider">Dịch vụ đã gọi</h4>

        {/* Services Table */}
        <div className="bg-slate-900/40 rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full text-left text-xs text-gray-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/80 text-gray-500 font-bold uppercase tracking-wider text-[10px] border-b border-white/5">
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-3 py-3 text-center">SL</th>
                <th className="px-3 py-3 text-right">Đơn giá</th>
                <th className="px-4 py-3 text-right">Thành tiền</th>
                <th className="px-2 py-3 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {!activeBooking?.dichVu || activeBooking.dichVu.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-gray-500">Chưa có dịch vụ nào được thêm vào phòng.</td>
                </tr>
              ) : (
                activeBooking.dichVu.map((item) => (
                  <tr key={item.MaChiTietSanPham} className="border-b border-white/5 hover:bg-white/5 transition animate-in fade-in duration-150">
                    <td className="px-4 py-2.5 font-medium text-gray-200">{item.TenSP}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.MaChiTietSanPham, item.SoLuong, 'dec')}
                          className="w-4 h-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded flex items-center justify-center text-gray-400 hover:text-white transition font-mono text-[10px]"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-bold text-gray-100">{item.SoLuong}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.MaChiTietSanPham, item.SoLuong, 'inc')}
                          className="w-4 h-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded flex items-center justify-center text-gray-400 hover:text-white transition font-mono text-[10px]"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right">{Number(item.DonGia).toLocaleString('vi-VN')} đ</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-100">{Number(item.ThanhTien).toLocaleString('vi-VN')} đ</td>
                    <td className="px-2 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteService(item.MaChiTietSanPham)}
                        className="text-gray-500 hover:text-rose-400 transition p-1.5 hover:bg-rose-500/10 rounded-lg"
                        title="Xóa dịch vụ"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form order services with dropdown */}
      <form onSubmit={handleAddService} className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 space-y-3">
        <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider">Gọi dịch vụ nhanh</h4>
        <div className="grid grid-cols-5 gap-2">
          <div className="col-span-3">
            <select
              value={maSP}
              onChange={(e) => setMaSP(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500 text-gray-200"
              required
            >
              <option value="" disabled>-- Chọn sản phẩm --</option>
              {products.map((p) => (
                <option key={p.MaSP} value={p.MaSP} disabled={p.SoLuongTon <= 0}>
                  {p.TenSP} ({Number(p.Gia).toLocaleString('vi-VN')}đ - Tồn: {p.SoLuongTon})
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <input
              type="number"
              value={soLuong}
              onChange={(e) => setSoLuong(e.target.value)}
              placeholder="SL..."
              min="1"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500 text-gray-200 text-center"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isAddingService || !maSP}
          className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold py-2 rounded-xl text-xs transition duration-300 flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {isAddingService ? (
            <span className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <Plus size={14} />
              Thêm món vào phòng
            </>
          )}
        </button>
      </form>

      {/* Action Button: Checkout */}
      <button
        onClick={handleCheckout}
        disabled={isCheckingOut || !activeBooking}
        className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-slate-950 font-black py-3.5 rounded-2xl text-sm transition duration-300 flex items-center justify-center gap-2 shadow-lg shadow-rose-500/10 disabled:opacity-50"
      >
        {isCheckingOut ? (
          <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
        ) : (
          <>
            <CreditCard size={18} />
            YÊU CẦU THANH TOÁN (CHECKOUT)
          </>
        )}
      </button>

    </div>
  );
}
