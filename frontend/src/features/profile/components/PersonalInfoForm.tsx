import React from 'react';

export function PersonalInfoForm() {
  return (
    <section className="bg-white rounded-3xl p-8 shadow-sm border border-[#c7c4d7]/30">
      <header className="flex items-center gap-3 mb-8">
        <span className="material-symbols-outlined text-[#4648d4]">badge</span>
        <h3 className="text-xl font-bold text-[#121c2a]">
          Thông tin cá nhân
        </h3>
      </header>

      <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-2 group">
          <label className="block text-xs font-bold text-[#464554] mb-2 uppercase tracking-wide">
            Họ và tên
          </label>
          <input
            className="w-full px-4 py-3 bg-[#f8f9ff] rounded-xl border border-[#c7c4d7] focus:border-[#4648d4] focus:ring-4 focus:ring-[#4648d4]/10 outline-none transition-all text-base text-[#121c2a]"
            type="text"
            defaultValue="Anh Nguyễn Thị Vân"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-bold text-[#464554] mb-2 uppercase tracking-wide">
            Email
          </label>
          <input
            className="w-full px-4 py-3 bg-[#eff4ff] rounded-xl border border-[#c7c4d7]/50 text-[#464554] text-base cursor-not-allowed outline-none"
            readOnly
            type="email"
            value="anhvannguyen1114@gmail.com"
          />
        </div>

        <div className="col-span-2 mt-4 pt-8 border-t border-[#c7c4d7]/30 flex justify-end gap-3">
          <button
            type="button"
            className="px-6 py-2.5 rounded-xl text-[#121c2a] font-semibold hover:bg-[#e6eeff] transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-[#c7c4d7] outline-none"
          >
            Hủy
          </button>
          <button
            type="button"
            className="px-6 py-2.5 bg-[#4648d4] text-white rounded-xl font-semibold opacity-50 cursor-not-allowed transition-colors"
            disabled
          >
            Lưu thay đổi
          </button>
        </div>
      </form>
    </section>
  );
}