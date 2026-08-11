import mongoose from 'mongoose'
import dotenv from 'dotenv'
import dns from 'node:dns'
import bcrypt from 'bcrypt'
import User from '../models/users.js'

try {
  dns.setServers(['8.8.8.8', '1.1.1.1'])
} catch (e) {}

dotenv.config()

const MOCK_USERS = [
  {
    fullName: 'Nguyễn Văn An',
    email: 'an.nguyen.demo@gmail.com',
    bio: 'Frontend Developer yêu thích React và UI/UX',
    status: 'active',
    role: 'user',
    plan: 'PRO',
    currentPlanExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    fullName: 'Trần Thị Bình',
    email: 'binh.tran.demo@gmail.com',
    bio: 'Backend Engineer | Node.js & MongoDB',
    status: 'active',
    role: 'user',
    plan: 'FREE',
  },
  {
    fullName: 'Lê Hoàng Cường',
    email: 'cuong.le.demo@gmail.com',
    bio: 'Project Manager & Agile Coach',
    status: 'active',
    role: 'user',
    plan: 'PRO',
    currentPlanExpiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  },
  {
    fullName: 'Phạm Minh Dũng',
    email: 'dung.pham.demo@gmail.com',
    bio: 'DevOps & Cloud Engineer',
    status: 'active',
    role: 'user',
    plan: 'FREE',
  },
  {
    fullName: 'Hoàng Thị Giang',
    email: 'giang.hoang.demo@gmail.com',
    bio: 'Product Designer / Figma Fanatic',
    status: 'active',
    role: 'user',
    plan: 'PRO',
    currentPlanExpiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
  },
  {
    fullName: 'Vũ Quốc Hùng',
    email: 'hung.vu.demo@gmail.com',
    bio: 'QA Automation Engineer',
    status: 'banned',
    role: 'user',
    plan: 'FREE',
  },
  {
    fullName: 'Đặng Mai Phương',
    email: 'phuong.dang.demo@gmail.com',
    bio: 'Fullstack Developer',
    status: 'active',
    role: 'user',
    plan: 'FREE',
  },
  {
    fullName: 'Bùi Anh Tuấn',
    email: 'tuan.bui.demo@gmail.com',
    bio: 'AI & Data Specialist',
    status: 'active',
    role: 'user',
    plan: 'PRO',
    currentPlanExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  },
]

const seedUsers = async () => {
  try {
    const mongoUri = process.env.MONGODB_CONNECTION_STRING
    if (!mongoUri) {
      console.error('❌ MONGODB_CONNECTION_STRING missing')
      process.exit(1)
    }

    console.log('🔄 Connecting to MongoDB...')
    await mongoose.connect(mongoUri)

    const defaultPasswordHash = await bcrypt.hash('123456', 10)

    for (const u of MOCK_USERS) {
      const existing = await User.findOne({ email: u.email })
      if (!existing) {
        await User.create({
          ...u,
          passwordHash: defaultPasswordHash,
          isEmailVerified: true,
        })
        console.log(`➕ Added demo user: ${u.fullName} <${u.email}>`)
      } else {
        console.log(`ℹ️ User ${u.email} already exists. Skipping.`)
      }
    }

    console.log('✅ Seeded demo users successfully!')
    await mongoose.disconnect()
    process.exit(0)
  } catch (err) {
    console.error('❌ Error seeding users:', err)
    process.exit(1)
  }
}

seedUsers()
