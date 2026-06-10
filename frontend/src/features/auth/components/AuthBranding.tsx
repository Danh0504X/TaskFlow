import { motion } from 'motion/react'

// Ảnh minh hoạ lấy từ thiết kế Stitch.
const LOGO_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB1wa-JYBA_m6AVYdsZWqYTTFhoO1nQKERlYL4UalaJ4pTdqEVbUwp4hw4I0H7Ffhjb9_QHrFtrmObdbrWHlw7x-MJx2y0WqtrPBA6grn0SOWsD7dDpgBf_znfD2MMei3HOEdcpeVMOinVc1Ezgj6PJf6JLM5LZnCp1I2DGo5ciKEs81JgpI_Un7x4bWUQvT4uKpmzBswjSNZV3Adp-e1i2fe9FzC8CG7ttELln9kXCj3pXDP1IjlQcyUn6iEtCL4bVJ8bTsoXvgS0'
const HERO_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCIiPJUoT0htTf3rQlZjQSpgUswX3PtjpvydhB4N8RGZfn7vlQ_sSUl7mkSBd4pjFAjHwfjXTXeexBM99irGmmZR8Z8rr85Hs1nQ_NYPS9PUUeQhbps-LiDPRWA5UA4h_cfmztAx2tyxaD2reOPaqeRoCCNCfPmf5-ETJWoOw5p43fMRmkpy9F3dKOWFNSv--jD97qkuoizhIVpNc0WncEo7dn_dPLfwGF76Kg39aCore4nxikLXr4uLW4-Thbla6nPXVVLQdHlEz8'

// Cụm branding dùng chung cho mọi trang auth: logo + tên + mô tả + robot AI động.
// Tách riêng để 3 trang (register/login/verify) chia sẻ y hệt phần nền & robot.
const AuthBranding = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center text-center md:col-span-7 md:items-start md:text-left"
    >
      <div className="flex flex-col items-center space-y-5 md:items-start">
        <img
          alt="TaskFlow AI Logo"
          className="h-20 w-20 object-contain md:h-24 md:w-24"
          src={LOGO_URL}
        />
        <h1 className="text-[40px] font-extrabold leading-[1.1] tracking-tight text-ink sm:text-[48px] lg:text-[56px]">
          TaskFlow AI
        </h1>
        <p className="max-w-md text-base leading-relaxed text-muted sm:text-lg">
          Revolutionizing productivity with ethereal precision and intelligent
          automation.
        </p>
      </div>

      <div className="relative mt-10 flex w-full justify-center md:mt-12 md:justify-start md:pl-4">
        {/* Quầng sáng tím mềm nhấp nháy phía sau robot */}
        <motion.div
          aria-hidden
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.85, 0.5] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-glow/25 blur-3xl md:left-[45%]"
        />

        {/* Bóng đổ co giãn theo nhịp nhảy của robot */}
        <motion.div
          aria-hidden
          animate={{ scaleX: [1, 0.7, 1], opacity: [0.35, 0.15, 0.35] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          className="pointer-events-none absolute bottom-2 left-1/2 h-4 w-40 -translate-x-1/2 rounded-[100%] bg-brand/30 blur-md md:left-[45%]"
        />

        <motion.img
          // Nhảy lên nhảy xuống kiểu nảy (bounce) + nghiêng nhẹ qua lại cho sinh động.
          animate={{ y: [0, -28, 0], rotate: [-2.5, 2.5, -2.5] }}
          transition={{
            y: { repeat: Infinity, duration: 1.6, ease: [0.45, 0, 0.55, 1] },
            rotate: { repeat: Infinity, duration: 3.2, ease: 'easeInOut' },
          }}
          // Phóng to nhẹ khi rê chuột vào.
          whileHover={{ scale: 1.08, rotate: 0 }}
          alt="AI Assistant"
          className="relative h-72 w-72 cursor-pointer object-contain sm:h-80 sm:w-80 lg:h-[26rem] lg:w-[26rem]"
          style={{ filter: 'drop-shadow(0 25px 50px rgba(139, 92, 246, 0.3))' }}
          src={HERO_URL}
        />
      </div>
    </motion.div>
  )
}

export default AuthBranding
