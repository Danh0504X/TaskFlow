import mongoose from 'mongoose'

const emailRateLimitSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    purpose: {
      type: String,
      enum: ['VERIFY_EMAIL', 'RESET_PASSWORD', 'LOGIN_OTP'],
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    firstAttemptAt: {
      type: Date,
      default: Date.now,
    },

    lastAttemptAt: {
      type: Date,
      default: Date.now,
    },

    blockedUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

emailRateLimitSchema.index({ email: 1, purpose: 1 }, { unique: true })

const EmailRateLimit = mongoose.model('EmailRateLimit', emailRateLimitSchema)

export default EmailRateLimit