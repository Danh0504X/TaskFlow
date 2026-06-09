import { motion } from 'motion/react'
import AuthBackground from '../components/AuthBackground'
import RegisterForm from '../components/RegisterForm'

// Ảnh minh hoạ lấy từ thiết kế Stitch.
const LOGO_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB1wa-JYBA_m6AVYdsZWqYTTFhoO1nQKERlYL4UalaJ4pTdqEVbUwp4hw4I0H7Ffhjb9_QHrFtrmObdbrWHlw7x-MJx2y0WqtrPBA6grn0SOWsD7dDpgBf_znfD2MMei3HOEdcpeVMOinVc1Ezgj6PJf6JLM5LZnCp1I2DGo5ciKEs81JgpI_Un7x4bWUQvT4uKpmzBswjSNZV3Adp-e1i2fe9FzC8CG7ttELln9kXCj3pXDP1IjlQcyUn6iEtCL4bVJ8bTsoXvgS0'
const HERO_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCIiPJUoT0htTf3rQlZjQSpgUswX3PtjpvydhB4N8RGZfn7vlQ_sSUl7mkSBd4pjFAjHwfjXTXeexBM99irGmmZR8Z8rr85Hs1nQ_NYPS9PUUeQhbps-LiDPRWA5UA4h_cfmztAx2tyxaD2reOPaqeRoCCNCfPmf5-ETJWoOw5p43fMRmkpy9F3dKOWFNSv--jD97qkuoizhIVpNc0WncEo7dn_dPLfwGF76Kg39aCore4nxikLXr4uLW4-Thbla6nPXVVLQdHlEz8'

const RegisterPage = () => {
  return (
    <AuthBackground>
      <main className="relative z-10 grid w-full max-w-[1080px] grid-cols-1 items-center gap-y-10 font-sans md:grid-cols-12 md:gap-x-8">
        {/* Khung trái: logo + artwork */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col justify-center space-y-2 p-4 pl-4 md:col-span-5"
        >
          <div className="mt-8 flex flex-col items-start space-y-4">
            <img
              alt="TaskFlow AI Logo"
              className="-ml-4 h-24 w-24 object-contain"
              src={LOGO_URL}
            />
            <h1 className="text-[48px] font-extrabold leading-[1.1] tracking-tight text-[#0b1c30]">
              TaskFlow AI
            </h1>
            <p className="max-w-sm text-[18px] leading-[1.6] text-[#494454]">
              Revolutionizing productivity with ethereal <br />
              precision and intelligent automation.
            </p>
          </div>

          <div className="relative -ml-14 mt-12 flex w-full max-w-sm justify-center">
            <motion.img
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              alt="AI Assistant"
              className="h-96 w-96 object-contain transition-transform duration-700 hover:scale-110"
              style={{ filter: 'drop-shadow(rgba(139, 92, 246, 0.2) 15px -10px 50px)' }}
              src={HERO_URL}
            />
          </div>
        </motion.div>

        {/* Khung phải: form đăng ký (glassmorphism) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="ml-auto flex w-full max-w-[420px] flex-col justify-center space-y-6 rounded-[28px] border border-white/60 bg-white/40 p-9 shadow-[0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur-3xl md:col-span-6 md:col-start-7"
        >
          <header className="text-center md:text-left">
            <h2 className="mb-1.5 text-[26px] font-bold leading-[1.2] tracking-tight text-[#0b1c30]">
              Start your journey
            </h2>
            <p className="text-[15px] text-[#494454]">
              Create your workspace in seconds.
            </p>
          </header>

          <RegisterForm />
        </motion.div>
      </main>
    </AuthBackground>
  )
}

export default RegisterPage
