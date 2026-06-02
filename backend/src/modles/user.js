import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: function () {
        return this.authProvider === 'local'
      },
      default: null,
    },

    avatarUrl: {
      type: String,
      default: null,
    },

    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
      required: true,
    },

    googleId: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'banned'],
      default: 'active',
    },
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: false,
    },
  },
)

// Không trả passwordHash ra ngoài API
userSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.passwordHash
    delete ret.__v
    return ret
  },
})

export default mongoose.model('User', userSchema)