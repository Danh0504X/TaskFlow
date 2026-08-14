import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { Link } from 'react-router-dom'
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react'
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  GitBranch,
  Kanban,
  Layers,
  Pencil,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Zap,
} from 'lucide-react'
import { APP_LOGO_URL } from '@/lib/constants'

/**
 * Trang giới thiệu (landing page) v2 — trục chính là tính năng AI Breakdown (SẮP RA MẮT,
 * chưa build xong — mọi nội dung AI trong file này đều gắn nhãn "Sắp ra mắt" rõ ràng, không
 * viết như đã dùng được). Nội dung AI (cơ chế nháp/duyệt, chống trùng, dọn rác TTL, quyền
 * PM-only...) lấy từ bản mô tả tính năng do người dùng cung cấp trực tiếp trong yêu cầu —
 * KHÔNG tìm thấy file AI_FEATURE_DESIGN.md/TASKFLOW_CONTEXT.md trong repo nên không đọc được,
 * dùng đúng nguyên văn nội dung đã được cung cấp, không suy diễn thêm.
 *
 * Nguyên tắc animation xuyên suốt: chỉ animate transform/opacity (ngoại lệ duy nhất: FAQ
 * accordion dùng height vì chỉ chạy khi click, không phải khi cuộn). Tôn trọng
 * prefers-reduced-motion qua `useMotionPrefs` — tắt hẳn mọi animation lặp vô hạn, giữ lại
 * fade đơn giản. Hiệu ứng theo con trỏ (tilt/spotlight/nam châm) tắt trên thiết bị không có
 * con trỏ chính xác (chạm) qua `useHasFinePointer`.
 */

const EASE_OUT = [0.16, 1, 0.3, 1] as const

// ============================================================================
// Hạ tầng dùng chung: tôn trọng prefers-reduced-motion + phát hiện thiết bị có chuột thật.
// ============================================================================

const useMotionPrefs = () => {
  const reduceMotion = useReducedMotion() ?? false
  return { reduceMotion, revealY: reduceMotion ? 0 : 16 }
}

/** true nếu thiết bị có con trỏ chính xác (chuột) — dùng để tắt tilt/spotlight/nam châm trên
 * điện thoại/tablet chạm, nơi các hiệu ứng bám chuột không có ý nghĩa và có thể gây giật. */
const useHasFinePointer = () => {
  const [hasFinePointer, setHasFinePointer] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)')
    const update = () => setHasFinePointer(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return hasFinePointer
}

// Khối cuộn-vào-hiện dùng chung cho mọi section — chỉ animate transform/opacity, kích hoạt
// qua viewport (IntersectionObserver nội bộ của motion), chỉ chạy 1 lần.
const Reveal = ({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) => {
  const { revealY } = useMotionPrefs()
  return (
    <motion.div
      initial={{ opacity: 0, y: revealY }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const springContainer = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const springItem = {
  hidden: { opacity: 0, scale: 0.85, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 22 } },
}

/** Nút "nam châm": lệch nhẹ theo vị trí chuột trong phạm vi nút (tối đa `range`px), trả về vị
 * trí ban đầu khi rời chuột. Tắt hẳn trên thiết bị chạm và khi bật giảm chuyển động. */
const MagneticLink = ({ to, className, children, range = 6 }: { to: string; className?: string; children: ReactNode; range?: number }) => {
  const hasFinePointer = useHasFinePointer()
  const { reduceMotion } = useMotionPrefs()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 200, damping: 15, mass: 0.4 })
  const springY = useSpring(y, { stiffness: 200, damping: 15, mass: 0.4 })
  const active = hasFinePointer && !reduceMotion

  const handleMouseMove = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    if (!active) return
    const rect = e.currentTarget.getBoundingClientRect()
    x.set(((e.clientX - rect.left) / rect.width - 0.5) * range * 2)
    y.set(((e.clientY - rect.top) / rect.height - 0.5) * range * 2)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div style={active ? { x: springX, y: springY } : undefined} className="inline-block">
      <Link to={to} onMouseMove={handleMouseMove} onMouseLeave={reset} className={className}>
        {children}
      </Link>
    </motion.div>
  )
}

/** Card có quầng sáng nhỏ bám theo con trỏ (spotlight) — chỉ bật trên thiết bị có chuột. */
const SpotlightCard = ({ children, className }: { children: ReactNode; className?: string }) => {
  const hasFinePointer = useHasFinePointer()
  const mx = useMotionValue(50)
  const my = useMotionValue(50)

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!hasFinePointer) return
    const rect = e.currentTarget.getBoundingClientRect()
    mx.set(((e.clientX - rect.left) / rect.width) * 100)
    my.set(((e.clientY - rect.top) / rect.height) * 100)
  }

  const background = useTransform([mx, my], ([latestMx, latestMy]) =>
    `radial-gradient(220px circle at ${latestMx}% ${latestMy}%, rgba(139,92,246,0.14), transparent 70%)`,
  )

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: EASE_OUT }}
      className={`group relative overflow-hidden ${className ?? ''}`}
    >
      {hasFinePointer && (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background }}
        />
      )}
      <div className="relative">{children}</div>
    </motion.div>
  )
}

// ============================================================================
// Aurora hero: 5 quầng màu, chu kỳ lệch theo số nguyên tố (không bao giờ lặp đồng bộ), chia
// làm 3 lớp parallax với hệ số khác nhau, phủ nhiễu SVG để khử dải màu (banding), viền mờ
// dần tạo chiều sâu.
// ============================================================================
const HERO_BLOBS = [
  { color: 'rgba(139,92,246,0.35)', size: 520, top: '-15%', left: '0%', duration: 17, parallax: 0.2 },
  { color: 'rgba(56,189,248,0.24)', size: 440, top: '10%', left: '65%', duration: 23, parallax: 0.5 },
  { color: 'rgba(244,114,182,0.2)', size: 400, top: '55%', left: '35%', duration: 19, parallax: 0.8 },
  { color: 'rgba(52,211,153,0.16)', size: 340, top: '5%', left: '30%', duration: 29, parallax: 0.5 },
  { color: 'rgba(250,204,21,0.14)', size: 300, top: '65%', left: '70%', duration: 31, parallax: 0.2 },
]

const HeroAurora = () => {
  const { reduceMotion } = useMotionPrefs()
  const { scrollY } = useScroll()

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {HERO_BLOBS.map((b, i) => (
        <AuroraBlob key={i} blob={b} scrollY={scrollY} reduceMotion={reduceMotion} />
      ))}

      {/* Nhiễu rất mờ phủ toàn khối — khử dải màu của các quầng blur, tạo cảm giác vật liệu. */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.035]" aria-hidden>
        <filter id="landing-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#landing-noise)" />
      </svg>

      {/* Viền mờ dần vào giữa — thêm chiều sâu, tránh cảm giác "phẳng" của nền gradient. */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 40%, transparent 30%, rgba(24,24,27,0.5) 100%)' }}
      />
    </div>
  )
}

const AuroraBlob = ({
  blob,
  scrollY,
  reduceMotion,
}: {
  blob: (typeof HERO_BLOBS)[number]
  scrollY: ReturnType<typeof useScroll>['scrollY']
  reduceMotion: boolean
}) => {
  const parallaxY = useTransform(scrollY, [0, 700], [0, 160 * blob.parallax])

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: blob.size,
        height: blob.size,
        top: blob.top,
        left: blob.left,
        background: blob.color,
        filter: 'blur(100px)',
        y: parallaxY,
      }}
      animate={reduceMotion ? undefined : { x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.1, 0.95, 1] }}
      transition={{ duration: blob.duration, repeat: reduceMotion ? 0 : Infinity, ease: 'easeInOut' }}
    />
  )
}

// ============================================================================
// Navbar — sticky, thanh tiến trình cuộn ở đáy, nền đậm dần theo cuộn, pill chỉ báo mục đang
// xem trượt mượt (layoutId, cùng kỹ thuật với Tabs.tsx dùng chung của app).
// ============================================================================
const NAV_LINKS = [
  { href: '#ai', label: 'AI' },
  { href: '#features', label: 'Tính năng' },
  { href: '#how-it-works', label: 'Quy trình' },
  { href: '#faq', label: 'FAQ' },
]
const SECTION_IDS = NAV_LINKS.map((l) => l.href.slice(1))

// Dùng IntersectionObserver thay vì đọc `el.offsetTop` trong scroll handler — đọc offsetTop
// mỗi frame khi cuộn ép trình duyệt tính lại layout (forced reflow), IntersectionObserver
// không đụng tới layout nên không có chi phí đó.
const useActiveSection = () => {
  const [active, setActive] = useState<string | null>(null)
  useEffect(() => {
    const elements = SECTION_IDS.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el)
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-140px 0px -60% 0px', threshold: 0 },
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
  return active
}

const LandingNavbar = () => {
  const { scrollYProgress } = useScroll()
  const bgOpacity = useTransform(scrollYProgress, [0, 0.05], [0.75, 0.96])
  const activeSection = useActiveSection()

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="sticky top-0 z-30 border-b border-hairline/60 backdrop-blur-md"
    >
      <motion.div className="absolute inset-0 -z-10 bg-canvas" style={{ opacity: bgOpacity }} />

      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2.5">
          <img src={APP_LOGO_URL} alt="TaskFlow" className="h-8 w-8 object-contain" />
          <span className="font-editorial text-lg font-medium text-ink">TaskFlow</span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.href.slice(1)
            return (
              <a
                key={link.href}
                href={link.href}
                className={`relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  isActive ? 'text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-surface"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{link.label}</span>
              </a>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/login" className="rounded-lg px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface">
            Đăng nhập
          </Link>
          <MagneticLink
            to="/register"
            className="block rounded-lg bg-ink px-3.5 py-2 text-sm font-semibold text-canvas transition-colors hover:bg-[#e4e4e5]"
          >
            Bắt đầu miễn phí
          </MagneticLink>
        </div>
      </div>

      {/* Thanh tiến trình cuộn trang. */}
      <motion.div className="h-[2px] origin-left bg-ink" style={{ scaleX: scrollYProgress }} />
    </motion.header>
  )
}

// ============================================================================
// Hero — demo tự chạy 3 chặng (Nhập → Xử lý → Kết quả), lặp ~9s/vòng. Tilt 3D theo chuột giữ
// nguyên từ bản v1. Badge AI luôn có nhãn "Sắp ra mắt".
// ============================================================================
const REQUIREMENT_TEXT = 'Xây hệ thống đăng nhập có xác thực email và Google OAuth'
type DemoStage = 'input' | 'processing' | 'result'
const STAGE_MS: Record<DemoStage, number> = { input: 2500, processing: 1500, result: 5000 }

const useHeroDemo = (reduceMotion: boolean, inView: boolean) => {
  const [stage, setStage] = useState<DemoStage>(reduceMotion ? 'result' : 'input')
  const [typedChars, setTypedChars] = useState(reduceMotion ? REQUIREMENT_TEXT.length : 0)

  useEffect(() => {
    // Tôn trọng giảm chuyển động: dừng hẳn ở khung kết quả tĩnh, không tự chạy vòng lặp.
    if (reduceMotion) return
    // Ngoài viewport (đã cuộn qua khỏi hero): tạm dừng hẳn timer, không setState/re-render nền
    // liên tục ở nơi người dùng không nhìn thấy. Giữ nguyên stage hiện tại, chạy tiếp khi quay lại.
    if (!inView) return

    if (stage === 'input') {
      if (typedChars < REQUIREMENT_TEXT.length) {
        const t = setTimeout(() => setTypedChars((c) => c + 1), STAGE_MS.input / REQUIREMENT_TEXT.length)
        return () => clearTimeout(t)
      }
      const t = setTimeout(() => setStage('processing'), 350)
      return () => clearTimeout(t)
    }

    const t = setTimeout(() => {
      if (stage === 'processing') {
        setStage('result')
      } else {
        setTypedChars(0)
        setStage('input')
      }
    }, STAGE_MS[stage])
    return () => clearTimeout(t)
  }, [stage, typedChars, reduceMotion, inView])

  return { stage, typedText: REQUIREMENT_TEXT.slice(0, typedChars) }
}

const DEMO_TREE = {
  epic: 'Xác thực người dùng',
  tasks: [
    { title: 'API đăng nhập', subtasks: ['Validate email'] },
    { title: 'API đăng ký', subtasks: [] as string[] },
  ],
}

const HeroDemoInput = ({ typedText }: { typedText: string }) => (
  <motion.div
    key="input"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    className="flex h-full flex-col justify-center gap-3 p-6"
  >
    <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle">Bản yêu cầu</span>
    <p className="min-h-[3.5em] rounded-lg border border-hairline bg-canvas p-3.5 text-[13px] leading-relaxed text-ink">
      {typedText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
        className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-ink"
      />
    </p>
    <button
      disabled
      className="flex w-fit items-center gap-1.5 rounded-lg bg-pastel-blue px-3 py-2 text-[11px] font-bold text-pastel-blue-ink"
    >
      <Sparkles size={12} />
      AI Phân rã công việc
    </button>
  </motion.div>
)

const HeroDemoProcessing = () => (
  <motion.div
    key="processing"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    className="flex h-full flex-col justify-center gap-3 p-6"
  >
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-pastel-yellow px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-pastel-yellow-ink">
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="h-2.5 w-2.5 rounded-full border-2 border-pastel-yellow-ink border-t-transparent"
      />
      Đang xử lý
    </span>
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
          className="h-9 rounded-lg border border-hairline bg-canvas"
        />
      ))}
    </div>
  </motion.div>
)

const HeroDemoResult = () => (
  <motion.div
    key="result"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    className="h-full space-y-2 overflow-hidden p-5"
  >
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center gap-2 rounded-lg border border-hairline bg-canvas p-2.5"
    >
      <Zap size={13} className="shrink-0 text-brand" />
      <span className="truncate text-[11px] font-semibold text-ink">{DEMO_TREE.epic}</span>
      <span className="ml-auto shrink-0 rounded bg-pastel-blue px-1.5 py-0.5 text-[8px] font-bold uppercase text-pastel-blue-ink">AI</span>
    </motion.div>

    <div className="ml-4 space-y-2 border-l border-hairline pl-3">
      {DEMO_TREE.tasks.map((task, i) => (
        <div key={task.title} className="space-y-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.15 }}
            className="flex items-center gap-2 rounded-lg border border-hairline bg-canvas p-2.5"
          >
            <CheckCircle2 size={12} className="shrink-0 text-pastel-blue-ink" />
            <span className="truncate text-[11px] font-medium text-ink">{task.title}</span>
            <span className="ml-auto shrink-0 rounded bg-pastel-blue px-1.5 py-0.5 text-[8px] font-bold uppercase text-pastel-blue-ink">AI</span>
          </motion.div>
          {task.subtasks.map((sub, j) => (
            <motion.div
              key={sub}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.15 + j * 0.15 }}
              className="ml-4 flex items-center gap-2 rounded-lg border border-hairline bg-canvas p-2 pl-3"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-pastel-green-ink" />
              <span className="truncate text-[10px] font-medium text-muted">{sub}</span>
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  </motion.div>
)

const HeroBoardMockup = ({ inView }: { inView: boolean }) => {
  const { reduceMotion } = useMotionPrefs()
  const hasFinePointer = useHasFinePointer()
  const { stage, typedText } = useHeroDemo(reduceMotion, inView)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [7, -7])
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-7, 7])

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!hasFinePointer) return
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }
  const resetTilt = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <div className="relative">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={resetTilt}
        initial={{ opacity: 0, y: 30, rotate: 2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: EASE_OUT }}
        style={hasFinePointer ? { rotateX, rotateY, transformPerspective: 1200 } : undefined}
        className="h-[280px] w-full max-w-xl overflow-hidden rounded-lg border border-hairline bg-surface shadow-2xl shadow-black/40"
      >
        <div className="flex items-center gap-1.5 border-b border-hairline bg-canvas px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-pastel-red" />
          <span className="h-2.5 w-2.5 rounded-full bg-pastel-yellow" />
          <span className="h-2.5 w-2.5 rounded-full bg-pastel-green" />
          <span className="ml-3 text-[11px] font-medium text-subtle">taskflow.app/projects/web-revamp</span>
        </div>

        <AnimatePresence mode="wait">
          {stage === 'input' && <HeroDemoInput typedText={typedText} />}
          {stage === 'processing' && <HeroDemoProcessing />}
          {stage === 'result' && <HeroDemoResult />}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, y: reduceMotion ? 0 : [0, -10, 0] }}
        transition={{
          opacity: { duration: 0.6, delay: 1.1 },
          scale: { duration: 0.6, delay: 1.1 },
          y: { duration: 4, repeat: reduceMotion ? 0 : Infinity, ease: 'easeInOut', delay: 1.6 },
        }}
        className="absolute -bottom-6 -left-6 hidden items-center gap-2 rounded-full border border-hairline bg-surface px-3.5 py-2 shadow-xl shadow-black/30 sm:flex"
      >
        <Sparkles size={14} className="text-pastel-blue-ink" />
        <span className="whitespace-nowrap text-[11px] font-semibold text-ink">4 issue được đề xuất · chờ duyệt</span>
      </motion.div>
    </div>
  )
}

const heroTextContainer = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } } }
const heroWordItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
}

const AnimatedHeadline = () => {
  const { reduceMotion } = useMotionPrefs()
  const words = 'Từ một đoạn yêu cầu →'.split(' ')
  return (
    <motion.h1
      variants={heroTextContainer}
      initial="hidden"
      animate="show"
      className="font-editorial mt-5 text-[34px] font-medium leading-[1.2] tracking-tight text-ink sm:text-[42px] lg:text-[48px]"
    >
      {words.map((word, i) => (
        <motion.span key={i} variants={heroWordItem} className="mr-[0.28em] inline-block">
          {word}
        </motion.span>
      ))}
      <motion.span
        variants={heroWordItem}
        className="inline-block bg-gradient-to-r from-[#c4b5fd] via-[#93c5fd] to-[#f9a8d4] bg-clip-text text-transparent"
        style={{ backgroundSize: '200% 100%' }}
        animate={reduceMotion ? undefined : { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 6, repeat: reduceMotion ? 0 : Infinity, ease: 'easeInOut' }}
      >
        cả backlog có cấu trúc
      </motion.span>
    </motion.h1>
  )
}

const HeroSection = () => {
  const heroRef = useRef<HTMLElement>(null)
  const heroInView = useInView(heroRef, { margin: '0px' })
  const { reduceMotion } = useMotionPrefs()

  return (
    <section id="top" ref={heroRef} className="relative overflow-hidden">
    <HeroAurora />

    <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-6 py-20 md:py-28 lg:grid-cols-2">
      <div>
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="inline-flex items-center gap-1.5 rounded-full bg-pastel-blue px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-pastel-blue-ink"
        >
          <Sparkles size={12} />
          AI Breakdown · Sắp ra mắt
        </motion.span>

        <AnimatedHeadline />

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: EASE_OUT }}
          className="mt-5 max-w-lg text-base leading-relaxed text-muted sm:text-lg"
        >
          TaskFlow đọc bản yêu cầu của bạn và đề xuất sẵn Epic → Task → Subtask — bạn duyệt,
          sửa, hoặc bỏ trước khi vào board. Kèm đầy đủ Kanban, Sprint và báo cáo tiến độ.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6, ease: EASE_OUT }}
          className="mt-8 flex flex-wrap items-center gap-3"
        >
          <MagneticLink
            to="/register"
            className="flex items-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-canvas transition-colors hover:bg-[#e4e4e5]"
          >
            Dùng thử miễn phí
            <ArrowRight size={16} />
          </MagneticLink>
          <a
            href="#ai"
            className="rounded-lg border border-hairline px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink/25"
          >
            Xem AI hoạt động ↓
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.75 }}
          className="mt-4 text-xs text-subtle"
        >
          Miễn phí · Không cần thẻ · Đăng nhập bằng Google
        </motion.p>
      </div>

      <div className="flex justify-center lg:justify-end">
        <HeroBoardMockup inView={heroInView} />
      </div>
    </div>

    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, y: reduceMotion ? 0 : [0, 8, 0] }}
      transition={{ opacity: { duration: 0.6, delay: 1 }, y: { duration: 1.8, repeat: reduceMotion ? 0 : Infinity, ease: 'easeInOut', delay: 1.2 } }}
      className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-subtle md:flex"
    >
      <span className="text-[10px] font-medium uppercase tracking-wider">Cuộn xuống</span>
      <ChevronDown size={16} />
    </motion.div>
    </section>
  )
}

// ============================================================================
// AI Showcase — section lớn nhất trang. Cột trái sticky (tiêu đề + 3 tab), cột phải cuộn dài
// để tự đổi tab theo scrollYProgress (mốc 1/3 - 2/3), chỉ báo tab layoutId. Bấm tay vào 1 tab
// vẫn được — `manualUntilRef` khoá đồng bộ theo cuộn trong 1.2s sau cú bấm để lựa chọn thủ
// công không bị scroll handler ghi đè ngay lập tức (v.d. cuộn thêm 1px ngay sau khi bấm).
// ============================================================================
const AI_TABS = ['breakdown', 'sprint', 'review'] as const
type AiTab = (typeof AI_TABS)[number]
const AI_TAB_LABELS: Record<AiTab, string> = {
  breakdown: 'AI Breakdown',
  sprint: 'AI Sprint Planning',
  review: 'Màn duyệt',
}
const MANUAL_TAB_LOCK_MS = 1200

const AiShowcaseSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<AiTab>('breakdown')
  const manualUntilRef = useRef(0)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (Date.now() < manualUntilRef.current) return
    if (v < 0.34) setActiveTab('breakdown')
    else if (v < 0.67) setActiveTab('sprint')
    else setActiveTab('review')
  })

  return (
    <section id="ai" ref={sectionRef} className="relative border-t border-hairline bg-surface md:min-h-[180vh]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-20 md:sticky md:top-16 md:grid-cols-12 md:py-0 md:pt-24">
        <div className="md:col-span-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pastel-blue px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-pastel-blue-ink">
            <Sparkles size={12} />
            Sắp ra mắt
          </span>
          <h2 className="font-editorial mt-4 text-[30px] font-medium tracking-tight text-ink sm:text-[36px]">
            AI làm nháp. Bạn giữ quyền quyết định.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            Bấm từng bước để xem AI hỗ trợ bạn từ yêu cầu tới backlog sẵn sàng chạy sprint.
          </p>

          <div className="mt-8 flex flex-col gap-1">
            {AI_TABS.map((tab, i) => {
              const isActive = activeTab === tab
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    manualUntilRef.current = Date.now() + MANUAL_TAB_LOCK_MS
                    setActiveTab(tab)
                  }}
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                    isActive ? 'text-ink' : 'text-muted hover:text-ink'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="ai-tab-pill"
                      className="absolute inset-0 rounded-lg bg-canvas"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className={`relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${isActive ? 'bg-ink text-canvas' : 'bg-canvas text-subtle'}`}>
                    {i + 1}
                  </span>
                  <span className="relative">{AI_TAB_LABELS[tab]}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center md:col-span-7">
          <AiTabPanel tab={activeTab} />
        </div>
      </div>
    </section>
  )
}

const AiTabPanel = ({ tab }: { tab: AiTab }) => (
  <div className="group relative w-full overflow-hidden rounded-lg border border-hairline bg-canvas">
    <RotatingBorderGlow />
    <AnimatePresence mode="wait">
      {tab === 'breakdown' && <AiBreakdownPanel key="breakdown" />}
      {tab === 'sprint' && <AiSprintPanel key="sprint" />}
      {tab === 'review' && <AiReviewPanel key="review" />}
    </AnimatePresence>
  </div>
)

/** Viền gradient xoay chậm phía sau card minh hoạ, chỉ hiện khi hover — thuần trang trí,
 * dùng CSS animation (conic-gradient quay) thay vì JS để nhẹ. */
const RotatingBorderGlow = () => (
  <div className="pointer-events-none absolute -inset-px rounded-lg opacity-0 transition-opacity duration-500 group-hover:opacity-100">
    <div
      className="absolute inset-0 rounded-lg motion-safe:animate-[spin_6s_linear_infinite]"
      style={{
        background: 'conic-gradient(from 0deg, #8b5cf6, #38bdf8, #f472b6, #8b5cf6)',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        padding: 1,
      }}
    />
  </div>
)

const AiBreakdownPanel = () => (
  <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.3 }} className="space-y-4 p-6 sm:p-8">
    <div className="space-y-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle">Bản yêu cầu</span>
      <p className="rounded-lg border border-hairline bg-surface p-3 text-[13px] text-ink">
        Xây tính năng thanh toán: tích hợp cổng thanh toán, xử lý webhook, gửi email xác nhận.
      </p>
    </div>
    <button disabled className="flex items-center gap-1.5 rounded-lg bg-pastel-blue px-3.5 py-2 text-[11px] font-bold text-pastel-blue-ink">
      <Sparkles size={13} />
      AI Phân rã công việc
    </button>
    <motion.div variants={springContainer} initial="hidden" animate="show" className="space-y-1.5 pt-2">
      {['Tích hợp cổng thanh toán', 'Xử lý webhook thanh toán', 'Gửi email xác nhận đơn hàng'].map((t) => (
        <motion.div key={t} variants={springItem} className="flex items-center gap-2 rounded-lg border border-hairline bg-surface p-2.5">
          <CheckCircle2 size={12} className="shrink-0 text-pastel-blue-ink" />
          <span className="text-[12px] font-medium text-ink">{t}</span>
          <span className="ml-auto shrink-0 rounded bg-pastel-blue px-1.5 py-0.5 text-[8px] font-bold uppercase text-pastel-blue-ink">AI</span>
        </motion.div>
      ))}
    </motion.div>
  </motion.div>
)

const SPRINT_DEMO_ITEMS = ['Tích hợp cổng thanh toán', 'Xử lý webhook thanh toán', 'Gửi email xác nhận đơn hàng', 'Viết test thanh toán']

/** Demo AI Sprint Planning: 2 việc đầu được AI chọn "bay" từ Backlog sang Sprint (dùng chung
 * `layoutId` giữa 2 vị trí — motion tự nội suy vị trí/khung cũ sang mới, chỉ transform/opacity,
 * không tự vẽ animation tay); 2 việc còn lại ở lại Backlog và mờ dần đi (opacity → 0.35) để
 * làm nổi bật 2 việc vừa được chuyển. */
const AiSprintPanel = () => {
  const [sorted, setSorted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setSorted(true), 700)
    return () => clearTimeout(t)
  }, [])

  const movingItems = SPRINT_DEMO_ITEMS.slice(0, 2)
  const stayingItems = SPRINT_DEMO_ITEMS.slice(2)

  return (
    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.3 }} className="grid grid-cols-2 gap-4 p-6 sm:p-8">
      <div className="space-y-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle">Backlog</span>
        <div className="space-y-1.5">
          <AnimatePresence>
            {!sorted &&
              movingItems.map((t) => (
                <motion.div
                  key={t}
                  layoutId={`sprint-demo-${t}`}
                  exit={{ opacity: 0 }}
                  className="rounded-lg border border-hairline bg-surface p-2 text-[11px] font-medium text-ink"
                >
                  {t}
                </motion.div>
              ))}
          </AnimatePresence>
          {stayingItems.map((t) => (
            <motion.div
              key={t}
              animate={{ opacity: sorted ? 0.35 : 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-lg border border-hairline bg-surface p-2 text-[11px] font-medium text-ink"
            >
              {t}
            </motion.div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle">Sprint 5</span>
        <div className="space-y-1.5">
          {sorted &&
            movingItems.map((t) => (
              <motion.div
                key={t}
                layoutId={`sprint-demo-${t}`}
                className="rounded-lg border border-pastel-blue-ink/40 bg-pastel-blue/15 p-2 text-[11px] font-medium text-ink"
              >
                {t}
              </motion.div>
            ))}
        </div>
      </div>
      <p className="col-span-2 text-[11px] italic text-subtle">Đề xuất theo độ ưu tiên & khối lượng còn trống.</p>
    </motion.div>
  )
}

const AiReviewPanel = () => (
  <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.3 }} className="space-y-3 p-6 sm:p-8">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle">3 đề xuất chờ duyệt</span>
    <motion.div variants={springContainer} initial="hidden" animate="show" className="space-y-1.5">
      {['Tích hợp cổng thanh toán', 'Xử lý webhook thanh toán', 'Gửi email xác nhận đơn hàng'].map((t, i) => (
        <motion.div key={t} variants={springItem} className="flex items-center gap-2.5 rounded-lg border border-hairline bg-surface p-2.5">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 + i * 0.15, type: 'spring', stiffness: 400, damping: 20 }}
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-pastel-green-ink bg-pastel-green"
          >
            <Check size={11} className="text-pastel-green-ink" />
          </motion.span>
          <span className="flex-1 text-[12px] font-medium text-ink">{t}</span>
          <Pencil size={12} className="shrink-0 text-subtle" />
        </motion.div>
      ))}
    </motion.div>
    <button disabled className="mt-2 w-full rounded-lg bg-ink py-2.5 text-[11px] font-bold text-canvas">
      Chấp nhận hàng loạt (3)
    </button>
  </motion.div>
)

// ============================================================================
// Vì sao AI ở đây đáng tin — 4 thẻ, spotlight theo con trỏ.
// ============================================================================
const AI_TRUST_POINTS: { icon: typeof ShieldCheck; title: string; desc: string }[] = [
  {
    icon: ShieldCheck,
    title: 'AI chỉ đề xuất, bạn quyết định',
    desc: 'AI chỉ tạo nháp. Không có issue thật nào được tạo cho tới khi bạn chấp nhận.',
  },
  {
    icon: Copy,
    title: 'Không tạo trùng',
    desc: 'Hệ thống nạp danh sách epic/task hiện có trong phạm vi trước khi sinh, tránh lặp lại.',
  },
  {
    icon: GitBranch,
    title: 'Cây luôn hợp lệ',
    desc: 'Bỏ epic cha thì nhánh con bên dưới bỏ theo. Không bao giờ có task mồ côi.',
  },
  {
    icon: Trash2,
    title: 'Nháp tự dọn',
    desc: 'Draft chưa duyệt tự hết hạn sau 7 ngày. Không tích rác trong dự án.',
  },
]

const AiTrustSection = () => (
  <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
    <Reveal className="mx-auto max-w-2xl text-center">
      <h2 className="font-editorial text-[32px] font-medium tracking-tight text-ink sm:text-[38px]">
        Vì sao AI ở đây đáng tin
      </h2>
    </Reveal>

    <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {AI_TRUST_POINTS.map((point, i) => (
        <Reveal key={point.title} delay={i * 0.06}>
          <SpotlightCard className="h-full rounded-lg border border-hairline bg-surface p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pastel-green text-pastel-green-ink">
              <point.icon size={18} />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-ink">{point.title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{point.desc}</p>
          </SpotlightCard>
        </Reveal>
      ))}
    </div>
  </section>
)

// ============================================================================
// Tính năng — bố cục bento, ô AI Breakdown lớn nhất (2x2), phần còn lại chia bậc rõ ràng.
// ============================================================================
const FeaturesSection = () => (
  <section id="features" className="border-t border-hairline">
    <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-editorial text-[32px] font-medium tracking-tight text-ink sm:text-[38px]">
          Mọi thứ đội nhóm cần, trong một nơi
        </h2>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Reveal className="md:col-span-2 md:row-span-2">
          <SpotlightCard className="flex h-full flex-col justify-between rounded-lg border border-hairline bg-surface p-7">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-pastel-blue px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pastel-blue-ink">
                <Sparkles size={11} />
                Sắp ra mắt
              </span>
              <h3 className="mt-3 text-lg font-semibold text-ink">AI Breakdown</h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
                Dán bản yêu cầu, nhận về cây Epic → Task → Subtask có cấu trúc. Bạn sửa, chọn,
                hoặc bỏ trước khi issue nào được tạo thật.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2">
              {['Epic', 'Task', 'Task', 'Subtask'].map((t, i) => (
                <span key={i} className="rounded-md border border-hairline bg-canvas px-2.5 py-1 text-[10px] font-semibold text-muted">
                  {t}
                </span>
              ))}
            </div>
          </SpotlightCard>
        </Reveal>

        <Reveal delay={0.05}>
          <SpotlightCard className="h-full rounded-lg border border-hairline bg-surface p-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pastel-green text-pastel-green-ink">
              <Kanban size={16} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-ink">Kanban kéo-thả</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              TODO → IN_PROGRESS → IN_REVIEW → DONE. Vị trí lưu tự động.
            </p>
          </SpotlightCard>
        </Reveal>

        <Reveal delay={0.1}>
          <SpotlightCard className="h-full rounded-lg border border-hairline bg-surface p-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pastel-yellow text-pastel-yellow-ink">
              <Layers size={16} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-ink">Sprint & Backlog</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              Backlog là việc chưa gán sprint. Kéo ra kéo vào không đổi trạng thái.
            </p>
          </SpotlightCard>
        </Reveal>

        <Reveal delay={0.2}>
          <SpotlightCard className="h-full rounded-lg border border-hairline bg-surface p-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pastel-blue text-pastel-blue-ink">
              <Users size={16} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-ink">PM & Member</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">PM toàn quyền và điều khiển AI; Member tập trung việc được giao.</p>
          </SpotlightCard>
        </Reveal>

        <Reveal delay={0.25}>
          <SpotlightCard className="h-full rounded-lg border border-hairline bg-surface p-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pastel-green text-pastel-green-ink">
              <BarChart3 size={16} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-ink">Tiến độ thời gian thực</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">Trạng thái, deadline, khối lượng theo từng người.</p>
          </SpotlightCard>
        </Reveal>
      </div>
    </div>
  </section>
)

// ============================================================================
// Quy trình — 4 bước, đường nối tự vẽ bám theo tiến độ cuộn (không chỉ trigger 1 lần).
// ============================================================================
const STEPS: { title: string; desc: string }[] = [
  { title: 'Tạo dự án', desc: 'Chọn Scrum hoặc Kanban, đặt tên và mã dự án.' },
  { title: 'Dán yêu cầu', desc: 'Mô tả sản phẩm bằng lời thường, không cần format.' },
  { title: 'Duyệt đề xuất', desc: 'Sửa, chọn, bỏ. Chấp nhận hàng loạt khi ưng.' },
  { title: 'Chạy sprint', desc: 'Kéo thả trên board, theo dõi tiến độ thật.' },
]

const HowItWorksSection = () => {
  const trackRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start 0.7', 'end 0.4'] })

  return (
    <section id="how-it-works" className="border-t border-hairline bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-editorial text-[32px] font-medium tracking-tight text-ink sm:text-[38px]">
            Bắt đầu chỉ với 4 bước
          </h2>
        </Reveal>

        <div ref={trackRef} className="relative mt-14">
          <div className="absolute left-0 right-0 top-5 hidden h-px bg-hairline md:block" />
          <motion.div
            style={{ scaleX: scrollYProgress, transformOrigin: 'left' }}
            className="absolute left-0 right-0 top-5 hidden h-px bg-ink md:block"
          />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.1} className="relative">
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18, delay: i * 0.1 }}
                  className="font-editorial relative z-10 inline-block bg-surface pr-3 text-3xl font-medium text-ink"
                >
                  {String(i + 1).padStart(2, '0')}
                </motion.span>
                <h3 className="mt-3 text-base font-semibold text-ink">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// FAQ — accordion, ngoại lệ duy nhất được phép animate height (chỉ chạy khi bấm, không cuộn).
// ============================================================================
const FAQ_ITEMS: { q: string; a: string }[] = [
  { q: 'AI có tự tạo task vào dự án của tôi không?', a: 'Không. Mọi thứ ở dạng nháp cho tới khi bạn duyệt.' },
  { q: 'Sinh lại nhiều lần có bị trùng không?', a: 'Không. Danh sách hiện có luôn được đưa vào để né trùng.' },
  { q: 'Ai được dùng AI?', a: 'PM của dự án. Member làm việc trên issue đã tạo.' },
]

const FaqItem = ({ item, isOpen, onToggle }: { item: (typeof FAQ_ITEMS)[number]; isOpen: boolean; onToggle: () => void }) => (
  <div className="border-b border-hairline">
    <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-4 py-4 text-left">
      <span className="text-sm font-semibold text-ink">{item.q}</span>
      <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0 text-subtle">
        <ChevronDown size={16} />
      </motion.span>
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
          className="overflow-hidden"
        >
          <p className="pb-4 text-sm leading-relaxed text-muted">{item.a}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)

const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  return (
    <section id="faq" className="border-t border-hairline">
      <div className="mx-auto max-w-2xl px-6 py-20 md:py-28">
        <Reveal className="text-center">
          <h2 className="font-editorial text-[32px] font-medium tracking-tight text-ink sm:text-[38px]">Câu hỏi thường gặp</h2>
        </Reveal>
        <div className="mt-10">
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem key={item.q} item={item} isOpen={openIndex === i} onToggle={() => setOpenIndex(openIndex === i ? null : i)} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// CTA — quầng aurora thứ 4 bám theo con trỏ trong toàn khối.
// ============================================================================
const CTASection = () => {
  const hasFinePointer = useHasFinePointer()
  const { reduceMotion } = useMotionPrefs()
  const mx = useMotionValue(50)
  const my = useMotionValue(50)
  const springMx = useSpring(mx, { stiffness: 50, damping: 20 })
  const springMy = useSpring(my, { stiffness: 50, damping: 20 })

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!hasFinePointer) return
    const rect = e.currentTarget.getBoundingClientRect()
    mx.set(((e.clientX - rect.left) / rect.width) * 100)
    my.set(((e.clientY - rect.top) / rect.height) * 100)
  }
  const cursorGlow = useTransform([springMx, springMy], ([latestMx, latestMy]) =>
    `radial-gradient(420px circle at ${latestMx}% ${latestMy}%, rgba(139,92,246,0.28), transparent 60%)`,
  )

  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <Reveal>
        <div onMouseMove={handleMouseMove} className="relative overflow-hidden rounded-lg border border-hairline bg-surface px-8 py-14 text-center sm:px-14">
          {hasFinePointer ? (
            <motion.div className="pointer-events-none absolute inset-0" style={{ background: cursorGlow }} />
          ) : (
            <motion.div
              className="pointer-events-none absolute inset-0"
              animate={reduceMotion ? undefined : { opacity: [0.3, 0.55, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                background:
                  'radial-gradient(circle at 20% 20%, rgba(139,92,246,0.3) 0%, transparent 45%), radial-gradient(circle at 80% 80%, rgba(56,189,248,0.25) 0%, transparent 45%)',
              }}
            />
          )}
          <div className="relative">
            <motion.div
              animate={reduceMotion ? undefined : { scale: [1, 1.08, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-pastel-green"
            >
              <ShieldCheck size={22} className="text-pastel-green-ink" />
            </motion.div>
            <h2 className="font-editorial mt-4 text-[28px] font-medium tracking-tight text-ink sm:text-[34px]">
              Lần cuối bạn gõ tay cả một backlog là khi nào?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted sm:text-base">
              Để lần này AI làm nháp. Bạn chỉ việc duyệt.
            </p>
            <MagneticLink
              to="/register"
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-ink px-6 py-3 text-sm font-semibold text-canvas transition-colors hover:bg-[#e4e4e5]"
            >
              Bắt đầu miễn phí
              <ArrowRight size={16} />
            </MagneticLink>
            <p className="mt-3 text-xs text-subtle">Không cần thẻ tín dụng · Đăng nhập bằng Google</p>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

// ============================================================================
// Footer
// ============================================================================
const LandingFooter = () => (
  <footer className="border-t border-hairline">
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-xs space-y-2">
        <div className="flex items-center gap-2.5">
          <img src={APP_LOGO_URL} alt="TaskFlow" className="h-7 w-7 object-contain" />
          <span className="font-editorial text-base font-medium text-ink">TaskFlow</span>
        </div>
        <p className="text-[13px] leading-relaxed text-muted">
          Dán yêu cầu. Nhận backlog. Bạn giữ quyền quyết định.
        </p>
      </div>

      <div className="flex flex-wrap gap-12 text-sm">
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Sản phẩm</p>
          <a href="#ai" className="block text-muted transition-colors hover:text-ink">AI</a>
          <a href="#features" className="block text-muted transition-colors hover:text-ink">Tính năng</a>
          <a href="#how-it-works" className="block text-muted transition-colors hover:text-ink">Quy trình</a>
        </div>
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Tài khoản</p>
          <Link to="/login" className="block text-muted transition-colors hover:text-ink">Đăng nhập</Link>
          <Link to="/register" className="block text-muted transition-colors hover:text-ink">Đăng ký</Link>
        </div>
      </div>
    </div>
    <div className="border-t border-hairline px-6 py-5 text-center text-xs text-subtle">
      © {new Date().getFullYear()} TaskFlow. Mọi quyền được bảo lưu.
    </div>
  </footer>
)

// ============================================================================
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-canvas">
      <LandingNavbar />
      <HeroSection />
      <AiShowcaseSection />
      <AiTrustSection />
      <FeaturesSection />
      <HowItWorksSection />
      <FaqSection />
      <CTASection />
      <LandingFooter />
    </div>
  )
}

export default LandingPage
