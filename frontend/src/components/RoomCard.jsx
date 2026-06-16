import React from 'react';
import { Mic, Music, Lock, CheckCircle } from 'lucide-react';

export default function RoomCard({ room, onClick, isSelected }) {
  const isAvailable = room.TrangThai === 'Trống';
  const priceFormatted = Number(room.GiaTheoGio).toLocaleString('vi-VN') + ' đ/h';

  return (
    <div
      onClick={() => onClick(room)}
      className={`glass-panel p-5 rounded-2xl cursor-pointer select-none transition-all duration-300 relative overflow-hidden group ${
        isSelected 
          ? isAvailable
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 translate-y-[-4px]'
            : 'border-rose-500 ring-2 ring-rose-500/20 translate-y-[-4px]'
          : 'hover:translate-y-[-4px]'
      }`}
    >
      {/* Decorative background glow on hover */}
      <div className={`absolute -right-10 -bottom-10 w-24 h-24 rounded-full blur-2xl opacity-15 transition duration-500 group-hover:scale-150 ${
        isAvailable ? 'bg-emerald-500' : 'bg-rose-500'
      }`}></div>

      {/* Card Header */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">
            Mã Phòng: {room.MaPhong}
          </span>
          <h4 className="font-bold text-lg text-gray-200 tracking-wide truncate max-w-[130px] group-hover:text-white transition">
            {room.TenPhong}
          </h4>
        </div>
        
        {/* Status pill */}
        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider border shadow-sm ${
          isAvailable 
            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20' 
            : 'bg-rose-950/40 text-rose-400 border-rose-500/20'
        }`}>
          {room.TrangThai}
        </span>
      </div>

      {/* Card Content info */}
      <div className="flex items-center justify-between text-xs mt-6 pt-3 border-t border-white/5 relative z-10 text-gray-400">
        <div className="flex items-center gap-1.5">
          {isAvailable ? (
            <Music size={14} className="text-emerald-400" />
          ) : (
            <Mic size={14} className="text-rose-400 animate-pulse" />
          )}
          <span>{room.TenLoaiPhong}</span>
        </div>
        <span className="font-semibold text-gray-300">{priceFormatted}</span>
      </div>

      {/* Floating icon indicator on hover */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-40 transition-opacity duration-300">
        {isAvailable ? (
          <CheckCircle size={14} className="text-emerald-400" />
        ) : (
          <Lock size={14} className="text-rose-400" />
        )}
      </div>
    </div>
  );
}
