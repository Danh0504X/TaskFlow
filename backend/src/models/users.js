import mongoose from 'mongoose'
import { USER_ROLE } from '../utils/constants.js'

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

    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },

    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
      required: true,
    },

    googleId: {
      type: String,
      // KHÔNG dùng default:null + unique ở đây. Tài khoản local không có googleId;
      // ràng buộc unique chỉ áp khi googleId là chuỗi (xem partial index bên dưới).
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

    // Vai trò: 'user' (mặc định khi đăng ký) hoặc 'admin'
    role: {
      type: String,
      enum: Object.values(USER_ROLE),
      default: USER_ROLE.USER,
    },
  },
  {
    // Bật cả createdAt + updatedAt để trang Profile theo dõi lần sửa gần nhất.
    timestamps: true,
  },
)

// Chỉ áp ràng buộc unique cho googleId khi nó là chuỗi (tài khoản Google).
// Tài khoản local không có googleId -> không bị tính vào index -> không đụng nhau.
userSchema.index(
  { googleId: 1 },
  { unique: true, partialFilterExpression: { googleId: { $type: 'string' } } },
)

// Không trả passwordHash ra ngoài API
userSchema.set('toJSON', {
  transform: function (doc, ret) {
    // Thêm dòng này để frontend biết user có mật khẩu chưa
    ret.hasPassword = !!ret.passwordHash;
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('user', userSchema)