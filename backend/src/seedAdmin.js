import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import User from './models/users.js'

dotenv.config()

const createAdminUser = async () => {
  try {
    const mongoUri = process.env.MONGODB_CONNECTION_STRING
    if (!mongoUri) {
      console.error('❌ MONGODB_CONNECTION_STRING is missing in .env')
      process.exit(1)
    }

    console.log('Connecting to MongoDB...')
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB successfully!')

    const adminEmail = 'admin@gmail.com'
    let admin = await User.findOne({ email: adminEmail })

    if (admin) {
      console.log(`User ${adminEmail} already exists. Updating role to admin and status to active...`)
      admin.role = 'admin'
      admin.status = 'active'
      admin.isEmailVerified = true
      admin.passwordHash = await bcrypt.hash('123456', 10)
      await admin.save()
      console.log('✅ Admin account updated successfully!')
    } else {
      console.log(`Creating new admin user: ${adminEmail}...`)
      const passwordHash = await bcrypt.hash('123456', 10)
      admin = await User.create({
        fullName: 'System Admin',
        email: adminEmail,
        passwordHash,
        authProvider: 'local',
        isEmailVerified: true,
        status: 'active',
        role: 'admin',
      })
      console.log('✅ Admin account created successfully!')
    }

    console.log('\n--- ADMIN ACCOUNT CREDENTIALS ---')
    console.log('Email:', adminEmail)
    console.log('Password:', '123456')
    console.log('Role:', admin.role)
    console.log('---------------------------------\n')

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    process.exit(1)
  }
}

createAdminUser()
