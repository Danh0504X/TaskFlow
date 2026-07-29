export function AiQuotaCard() {
  return (
    <section className="bg-surface rounded-2xl p-5 shadow-sm border border-[#c7c4d7]/30">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-[#121c2a] uppercase tracking-wider">
          Hạn mức AI
        </h4>
        <span
          className="material-symbols-outlined text-[18px] text-[#4648d4]"
          style={{ fontVariationSettings: '"FILL" 1' }}
        >
          bolt
        </span>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <span className="text-2xl font-bold text-[#121c2a] leading-none">
            5 <span className="text-sm font-normal text-[#464554]">/ 15 lượt</span>
          </span>
          <span className="text-xs font-bold text-[#4648d4]">
            Còn lại 67%
          </span>
        </div>
        <div className="w-full h-2 bg-[#e6eeff] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#4648d4] rounded-full transition-all duration-1000 ease-out"
            style={{ width: '33.33%' }}
          ></div>
        </div>
        <p className="text-xs text-[#464554] leading-relaxed">
          Hạn mức sẽ được làm mới vào lúc 00:00 ngày mai. Nâng cấp để nhận lượt dùng không giới hạn.
        </p>
      </div>
    </section>
  );
}