import React, { useState, useEffect } from 'react';
import RoomCard from './components/RoomCard';
import CheckInModal from './components/CheckInModal';
import RoomDetails from './components/RoomDetails';
import SalaryPanel from './components/SalaryPanel';
import AdminPanel from './components/AdminPanel';
import { api } from './services/api';
import { 
  Mic2, 
  Layers, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Settings,
  X
} from 'lucide-react';

export default function App() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activeTab, setActiveTab] = useState('rooms'); // 'rooms' | 'salary' | 'admin'
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [time, setTime] = useState(new Date());

  // Cảnh báo tồn kho từ SQL View v_CanhBaoTonKho
  const [inventoryAlerts, setInventoryAlerts] = useState([]);

  // Cập nhật đồng hồ thời gian thực
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch danh sách phòng
  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await api.getRooms();
      setRooms(res.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch cảnh báo kho từ View
  const fetchInventoryAlerts = async () => {
    try {
      const res = await api.getInventoryAlerts();
      setInventoryAlerts(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải cảnh báo kho:', err.message);
    }
  };

  const loadDashboardData = () => {
    fetchRooms();
    fetchInventoryAlerts();
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Tạo thông báo Toast
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Tự động tắt sau 4 giây
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Click vào thẻ phòng
  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    if (room.TrangThai === 'Trống') {
      setShowCheckIn(true);
    } else {
      setShowCheckIn(false);
    }
  };

  // Thành công mở phòng
  const handleCheckInSuccess = () => {
    loadDashboardData();
    setSelectedRoom(null);
  };

  // Thành công thanh toán
  const handleCheckoutSuccess = () => {
    loadDashboardData();
    setSelectedRoom(null);
  };

  // Thống kê phòng
  const totalRooms = rooms.length;
  const busyRooms = rooms.filter((r) => r.TrangThai === 'Đang Sử Dụng').length;
  const freeRooms = rooms.filter((r) => r.TrangThai === 'Trống').length;

  return (
    <div className="min-h-screen bg-[#080B11] text-gray-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white pb-12">
      
      {/* 1. Header Bar */}
      <header className="border-b border-white/5 bg-[#0B0F19]/90 backdrop-blur sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Logo Branding */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-rose-500 to-pink-600 p-2.5 rounded-2xl shadow-lg shadow-rose-500/20 text-slate-950 font-bold">
              <Mic2 size={24} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text text-transparent">
                KARAOKE D-LUXURY
              </h1>
              <p className="text-[10px] text-gray-500 tracking-widest uppercase font-bold">CSDL Hệ quản trị Karaoke</p>
            </div>
          </div>

          {/* Realtime Live Clock */}
          <div className="text-sm text-gray-400 font-mono bg-white/5 border border-white/5 px-4 py-2 rounded-2xl hidden md:block">
            📅 {time.toLocaleDateString('vi-VN')} - 🕒 {time.toLocaleTimeString('vi-VN')}
          </div>
        </div>
      </header>

      {/* 2. Main Content Wrapper */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 mt-6 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Section - Sơ đồ hoặc Lương hoặc CRUD) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Statistics Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-panel p-4 rounded-2xl flex flex-col justify-center border-l-4 border-l-blue-500">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Tổng số phòng</span>
              <span className="text-2xl font-black text-blue-400 mt-1">{totalRooms}</span>
            </div>
            <div className="glass-panel p-4 rounded-2xl flex flex-col justify-center border-l-4 border-l-emerald-500">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Phòng Trống</span>
              <span className="text-2xl font-black text-emerald-400 mt-1">{freeRooms}</span>
            </div>
            <div className="glass-panel p-4 rounded-2xl flex flex-col justify-center border-l-4 border-l-rose-500">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Đang sử dụng</span>
              <span className="text-2xl font-black text-rose-400 mt-1">{busyRooms}</span>
            </div>
          </div>

          {/* Navigation Tab bar */}
          <div className="flex gap-2 bg-slate-900/60 border border-white/5 p-1 rounded-2xl">
            <button
              onClick={() => { setActiveTab('rooms'); setSelectedRoom(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                activeTab === 'rooms' 
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-slate-950 shadow-md font-extrabold' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers size={14} />
              Sơ Đồ Phòng
            </button>
            <button
              onClick={() => { setActiveTab('salary'); setSelectedRoom(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                activeTab === 'salary' 
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-slate-950 shadow-md font-extrabold' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <DollarSign size={14} />
              Khóa Sổ & Lương
            </button>
            <button
              onClick={() => { setActiveTab('admin'); setSelectedRoom(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                activeTab === 'admin' 
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-slate-950 shadow-md font-extrabold' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings size={14} />
              Danh Mục & Admin
            </button>
          </div>

          {/* Cảnh báo tồn kho lấy từ View v_CanhBaoTonKho */}
          {activeTab === 'rooms' && inventoryAlerts.length > 0 && (
            <div className="bg-amber-950/30 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-300 animate-in fade-in duration-300">
              <AlertTriangle size={18} className="shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-bold text-[13px] text-amber-400 mb-0.5 uppercase tracking-wide">Cảnh báo tồn kho sắp hết (Tồn kho &lt; 10 từ View CSDL)</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {inventoryAlerts.map(alert => (
                    <span key={alert.MaSP} className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-white/5">
                      {alert.TenSP}: <strong className="text-rose-400">{alert.SoLuongTon}</strong> cái
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tabs Display Content */}
          {activeTab === 'rooms' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold tracking-wide text-gray-200">SƠ ĐỒ PHÒNG HÁT HIỆN TẠI</h2>
                <button 
                  onClick={loadDashboardData}
                  className="text-xs text-gray-400 hover:text-rose-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hover:border-rose-500/20 transition"
                >
                  Tải lại sơ đồ 🔄
                </button>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-900/10 rounded-2xl border border-white/5">
                  <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500 text-sm">Đang tải danh sách phòng hát...</p>
                </div>
              ) : rooms.length === 0 ? (
                <div className="text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-2xl">
                  Không tìm thấy thông tin phòng hát trong cơ sở dữ liệu.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {rooms.map((room) => (
                    <RoomCard
                      key={room.MaPhong}
                      room={room}
                      onClick={handleRoomClick}
                      isSelected={selectedRoom?.MaPhong === room.MaPhong}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'salary' ? (
            <div className="glass-panel p-6 rounded-3xl border-yellow-500/10">
              <SalaryPanel showToast={showToast} />
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-3xl border-rose-500/10">
              <AdminPanel showToast={showToast} refreshRooms={fetchRooms} />
            </div>
          )}

        </div>

        {/* Right Column (Side Panel details / invoice billing / reports info) */}
        <div className="lg:col-span-1">
          {activeTab === 'rooms' && selectedRoom && selectedRoom.TrangThai === 'Đang Sử Dụng' ? (
            <RoomDetails
              room={selectedRoom}
              onClose={() => setSelectedRoom(null)}
              onCheckoutSuccess={handleCheckoutSuccess}
              showToast={showToast}
            />
          ) : activeTab === 'rooms' ? (
            <div className="glass-panel p-8 rounded-3xl border-dashed border-white/5 text-center flex flex-col items-center justify-center min-h-[350px]">
              <div className="w-16 h-16 rounded-full bg-slate-900/80 border border-white/5 flex items-center justify-center text-gray-600 mb-4 animate-bounce">
                <HelpCircle size={32} />
              </div>
              <h3 className="font-bold text-gray-300 text-sm uppercase tracking-wider mb-2">Thông tin hóa đơn</h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[200px] mx-auto">
                Bấm vào phòng có màu <strong>Đỏ (Đang Sử Dụng)</strong> ở sơ đồ để xem chi tiết hóa đơn, gọi dịch vụ hoặc thanh toán.
              </p>
            </div>
          ) : activeTab === 'salary' ? (
            <div className="glass-panel p-8 rounded-3xl border-dashed border-white/5 text-center flex flex-col items-center justify-center min-h-[350px]">
              <div className="w-16 h-16 rounded-full bg-slate-900/80 border border-white/5 flex items-center justify-center text-yellow-500/20 text-yellow-500 mb-4">
                <DollarSign size={32} />
              </div>
              <h3 className="font-bold text-gray-300 text-sm uppercase tracking-wider mb-2">Báo Cáo Tài Chính</h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[200px] mx-auto">
                Sử dụng các form ở cột trái để thực hiện giao dịch tài chính hệ thống. Biên lai phiếu chi sẽ tự động ghi nhận vào database.
              </p>
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-3xl border-dashed border-white/5 text-center flex flex-col items-center justify-center min-h-[350px]">
              <div className="w-16 h-16 rounded-full bg-slate-900/80 border border-white/5 flex items-center justify-center text-rose-500/20 text-rose-500 mb-4">
                <Settings size={32} />
              </div>
              <h3 className="font-bold text-gray-300 text-sm uppercase tracking-wider mb-2">Quản trị danh mục</h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[200px] mx-auto">
                Chọn các danh mục con để thêm, sửa, xóa dữ liệu nền của phòng, nhân viên, khách hàng và xem báo cáo doanh thu từ View.
              </p>
            </div>
          )}
        </div>

      </main>

      {/* 3. Check-In Modal (Trống room click popup) */}
      {showCheckIn && selectedRoom && (
        <CheckInModal
          room={selectedRoom}
          onClose={() => { setShowCheckIn(false); setSelectedRoom(null); }}
          onSuccess={handleCheckInSuccess}
          showToast={showToast}
        />
      )}

      {/* 4. Global Toast Notifications Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3.5 rounded-2xl shadow-2xl border flex items-start gap-3 transition-all duration-300 transform translate-y-0 animate-in slide-in-from-right duration-200 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 backdrop-blur border-emerald-500/20 text-emerald-300 shadow-emerald-500/5'
                : 'bg-rose-950/90 backdrop-blur border-rose-500/20 text-rose-300 shadow-rose-500/5'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            )}
            <div className="flex-1 text-xs font-semibold leading-relaxed">
              {toast.message}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 p-0.5 rounded transition"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
