import { Kanban, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { staggerContainer, fadeUpItem } from '@/lib/motion'

const pillars = [
  { title: 'Trực quan hóa', desc: 'Mọi đầu việc được trình bày trực quan trên thẻ thuộc các cột trạng thái.' },
  { title: 'Giới hạn WIP', desc: 'Giới hạn số lượng đầu việc tối đa trong một cột để tránh quá tải team.' },
  { title: 'Tập trung cải tiến', desc: 'Đo lường thời gian xử lý trung bình và tối ưu quy trình liên tục.' },
]

const KanbanIntro = () => {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6 max-w-2xl mx-auto text-left">
      <motion.div variants={fadeUpItem} className="text-center mb-8">
        <div className="w-14 h-14 bg-pastel-blue text-pastel-blue-ink rounded-full flex items-center justify-center mx-auto mb-4">
          <Kanban size={26} />
        </div>
        <h2 className="font-editorial text-2xl font-medium text-ink tracking-tight">Phương pháp Kanban trực quan</h2>
        <p className="text-muted mt-2 text-xs leading-relaxed">
          Tối ưu năng lực bàn giao, quản trị luồng công việc trơn tru, hạn chế tắc nghẽn.
        </p>
      </motion.div>

      <motion.div variants={fadeUpItem} className="space-y-4">
        <h3 className="font-semibold text-sm text-ink uppercase tracking-wide">3 Nguyên tắc vàng</h3>
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3.5">
          {pillars.map((p, idx) => (
            <motion.div key={p.title} variants={fadeUpItem} className="flex gap-2.5">
              <div className="w-5 h-5 rounded-full bg-pastel-blue text-pastel-blue-ink flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div>
                <h4 className="font-semibold text-xs text-ink">{p.title}</h4>
                <p className="text-[10px] text-muted mt-0.5">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div variants={fadeUpItem} className="p-4 bg-pastel-blue/40 border border-hairline rounded-lg flex items-start gap-3 mt-6">
        <Sparkles className="text-pastel-blue-ink shrink-0 mt-0.5" size={16} />
        <div>
          <h4 className="font-semibold text-xs text-ink">Khuyên dùng</h4>
          <p className="text-[10px] text-muted mt-0.5 leading-relaxed">
            Phù hợp cho đội ngũ hỗ trợ kỹ thuật, vận hành liên tục hoặc luồng yêu cầu xuất hiện bất định kỳ.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default KanbanIntro
