import { Kanban, Sparkles } from 'lucide-react'

const pillars = [
  { title: 'Trực quan hóa', desc: 'Mọi đầu việc được trình bày trực quan trên thẻ thuộc các cột trạng thái.' },
  { title: 'Giới hạn WIP', desc: 'Giới hạn số lượng đầu việc tối đa trong một cột để tránh quá tải team.' },
  { title: 'Tập trung cải tiến', desc: 'Đo lường thời gian xử lý trung bình và tối ưu quy trình liên tục.' },
]

const KanbanIntro = () => {
  return (
    <div className="space-y-6 max-w-2xl mx-auto text-left">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-brand/5 text-brand rounded-full flex items-center justify-center mx-auto mb-4">
          <Kanban size={26} />
        </div>
        <h2 className="text-2xl font-extrabold text-brand tracking-tight">Phương pháp Kanban trực quan</h2>
        <p className="text-muted mt-2 text-xs font-semibold leading-relaxed">
          Tối ưu năng lực bàn giao, quản trị luồng công việc trơn tru, hạn chế tắc nghẽn.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-sm text-ink uppercase tracking-wide">3 Nguyên tắc vàng</h3>
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
            Phù hợp cho đội ngũ hỗ trợ kỹ thuật, vận hành liên tục hoặc luồng yêu cầu xuất hiện bất định kỳ.
          </p>
        </div>
      </div>
    </div>
  )
}

export default KanbanIntro
