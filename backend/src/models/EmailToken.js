import mongoose from 'mongoose'

const emailTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    purpose: {
      type: String,
      enum: ['VERIFY_EMAIL', 'RESET_PASSWORD', 'LOGIN_OTP'],
      required: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
    },
  },
  { timestamps: true }
)

emailTokenSchema.index({ email: 1, purpose: 1 })

const EmailToken = mongoose.model('EmailToken', emailTokenSchema)

export default EmailToken