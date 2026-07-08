import { Layers, Sparkles } from 'lucide-react'

const pillars = [
  { title: 'Minh bạch', desc: 'Mọi thành viên đều nắm bắt được toàn bộ thông tin dự án hiện tại.' },
  { title: 'Thanh tra', desc: 'Liên tục đánh giá tiến độ hướng tới mục tiêu chung của Sprint.' },
  { title: 'Thích nghi', desc: 'Điều chỉnh quy trình ngay khi phát hiện điểm bất thường.' },
]

const ScrumIntro = () => {
  return (
    <div className="space-y-6 max-w-2xl mx-auto text-left">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-brand/5 text-brand rounded-full flex items-center justify-center mx-auto mb-4">
          <Layers size={26} />
        </div>
        <h2 className="text-2xl font-extrabold text-brand tracking-tight">Phương pháp Scrum lặp ngắn</h2>
        <p className="text-muted mt-2 text-xs font-semibold leading-relaxed">
          Scrum giúp đội ngũ của bạn thích ứng nhanh và bàn giao sản phẩm đều đặn.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-sm text-ink uppercase tracking-wide">3 Trụ cột cốt lõi</h3>
        <div className="space-y-3.5">
          {pillars.map((p, idx) => (
            <div key={p.title} className="flex gap-2.5">
              <div className="w-5 h-5 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div>
                <h4 className="font-bold text-xs text-ink">{p.title}</h4>
                <p className="text-[10px] text-muted font-semibold mt-0.5">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-brand/5 border border-brand/10 rounded-2xl flex items-start gap-3 mt-6">
        <Sparkles className="text-brand shrink-0 mt-0.5" size={16} />
        <div>
          <h4 className="font-bold text-xs text-brand">Khuyên dùng</h4>
          <p className="text-[10px] text-muted font-semibold mt-0.5 leading-relaxed">
            Phù hợp cho dự án phát triển sản phẩm có tính biến động cao, cần thử nghiệm liên tục.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ScrumIntro
