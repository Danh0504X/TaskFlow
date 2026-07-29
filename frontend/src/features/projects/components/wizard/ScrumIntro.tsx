import { Layers, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { staggerContainer, fadeUpItem } from '@/lib/motion'

const pillars = [
  { title: 'Minh bạch', desc: 'Mọi thành viên đều nắm bắt được toàn bộ thông tin dự án hiện tại.' },
  { title: 'Thanh tra', desc: 'Liên tục đánh giá tiến độ hướng tới mục tiêu chung của Sprint.' },
  { title: 'Thích nghi', desc: 'Điều chỉnh quy trình ngay khi phát hiện điểm bất thường.' },
]

const ScrumIntro = () => {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6 max-w-2xl mx-auto text-left">
      <motion.div variants={fadeUpItem} className="text-center mb-8">
        <div className="w-14 h-14 bg-pastel-yellow text-pastel-yellow-ink rounded-full flex items-center justify-center mx-auto mb-4">
          <Layers size={26} />
        </div>
        <h2 className="font-editorial text-2xl font-medium text-ink tracking-tight">Phương pháp Scrum lặp ngắn</h2>
        <p className="text-muted mt-2 text-xs leading-relaxed">
          Scrum giúp đội ngũ của bạn thích ứng nhanh và bàn giao sản phẩm đều đặn.
        </p>
      </motion.div>

      <motion.div variants={fadeUpItem} className="space-y-4">
        <h3 className="font-semibold text-sm text-ink uppercase tracking-wide">3 Trụ cột cốt lõi</h3>
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3.5">
          {pillars.map((p, idx) => (
            <motion.div key={p.title} variants={fadeUpItem} className="flex gap-2.5">
              <div className="w-5 h-5 rounded-full bg-pastel-yellow text-pastel-yellow-ink flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
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

      <motion.div variants={fadeUpItem} className="p-4 bg-pastel-yellow/40 border border-hairline rounded-lg flex items-start gap-3 mt-6">
        <Sparkles className="text-pastel-yellow-ink shrink-0 mt-0.5" size={16} />
        <div>
          <h4 className="font-semibold text-xs text-ink">Khuyên dùng</h4>
          <p className="text-[10px] text-muted mt-0.5 leading-relaxed">
            Phù hợp cho dự án phát triển sản phẩm có tính biến động cao, cần thử nghiệm liên tục.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ScrumIntro
