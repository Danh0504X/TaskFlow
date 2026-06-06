// Script chạy 1 lần để sửa lỗi E11000 trên index googleId.
// Cách chạy (tại thư mục backend):  node scripts/fixGoogleIdIndex.js
import mongoose from 'mongoose'
import { connectDB } from '../src/lib/db.js'
import User from '../src/models/users.js'

const run = async () => {
  await connectDB()
  const collection = User.collection

  // 1. Xoá index cũ (sparse + unique) nếu còn tồn tại
  try {
    await collection.dropIndex('googleId_1')
    console.log('✅ Đã xoá index cũ googleId_1')
  } catch {
    console.log('ℹ️  Không thấy index googleId_1, bỏ qua')
  }

  // 2. Gỡ field googleId = null khỏi các tài khoản local đã tạo trước đó
  const res = await collection.updateMany(
    { googleId: null },
    { $unset: { googleId: '' } },
  )
  console.log(`✅ Đã gỡ googleId=null khỏi ${res.modifiedCount} document`)

  // 3. Tạo lại index theo schema mới (partial unique)
  await User.syncIndexes()
  console.log('✅ Đã đồng bộ lại index theo schema')

  await mongoose.disconnect()
  console.log('🎉 Hoàn tất')
  process.exit(0)
}

run().catch((err) => {
  console.error('❌ Migration thất bại:', err)
  process.exit(1)
})
