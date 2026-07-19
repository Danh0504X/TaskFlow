import React from 'react';

export function AvatarCard() {
  return (
    <section className="bg-white rounded-3xl p-8 flex flex-col items-center text-center shadow-sm border border-[#c7c4d7]/30">
      <div className="relative group cursor-pointer mb-6">
        <div className="w-32 h-32 rounded-full ring-4 ring-[#e1e0ff] overflow-hidden bg-[#e6eeff]">
          <img
            className="w-full h-full object-cover"
            alt="Ảnh đại diện"
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600"
          />
        </div>
        {/* CSS-only Hover Overlay: Hiện khi di chuột vào ảnh */}
        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-white backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-1">
            <span className="material-symbols-outlined">photo_camera</span>
            <span className="text-xs font-bold uppercase tracking-wider">
              Thay đổi
            </span>
          </div>
        </div>
      </div>
      <h3 className="text-xl font-bold text-[#121c2a] mb-1">
        ANH NGUYỄN THỊ VÂN
      </h3>
      <p className="text-[#464554] text-base mb-5">
        anhvannguyen1114@gmail.com
      </p>
      <span className="px-4 py-1.5 bg-[#dee9fc] text-[#4648d4] rounded-full text-xs font-semibold tracking-wide">
        Thành viên hệ thống
      </span>
    </section>
  );
}