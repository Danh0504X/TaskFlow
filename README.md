# Project Hub - Full-Stack App

Node.js Express Backend + React Frontend

## 🚀 Quick Start

### 1. Setup lần đầu (5-10 phút)

```bash
# Cài dependencies cho cả backend + frontend
npm run setup

# Setup environment variables (xem hướng dẫn chi tiết tại SETUP.md)
cd backend && cp .env.example .env  # điền giá trị
cd ../frontend && cp .env.example .env  # điền giá trị
```

### 2. Chạy Dev Server

**Option A: 2 Terminal riêng (khuyến nghị)**
```bash
# Terminal 1 - Backend (port 5001)
npm run dev:backend

# Terminal 2 - Frontend (port 5173)
npm run dev:frontend
```

**Option B: 1 Terminal chạy cùng lúc**
```bash
npm run dev
# Yêu cầu: cài concurrently trước (tự động trong setup)
```

### 3. Truy cập
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5001

---

## 📚 Tài liệu Chi tiết

- **[SETUP.md](./SETUP.md)** - Setup guide đầy đủ (MongoDB, Google OAuth, Email...)
- **[frontend/ARCHITECTURE.md](./frontend/ARCHITECTURE.md)** - Cấu trúc frontend & quy tắc code
- **[frontend/README.md](./frontend/README.md)** - Hướng dẫn frontend

---

## 📦 Scripts

```bash
npm run dev:backend      # Chạy backend dev (port 5001)
npm run dev:frontend     # Chạy frontend dev (port 5173)
npm run dev              # Chạy cả 2 cùng lúc
npm run build:backend    # Cài dependencies backend
npm run build:frontend   # Build frontend (tsc + vite build)
npm run build            # Build cả backend + frontend
npm start                # Chạy backend production
npm run setup            # Setup lần đầu (cài deps)
```

---

## 🔧 Tech Stack

**Backend:**
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- Nodemailer (Email service)
- Google OAuth

**Frontend:**
- React 19 + TypeScript
- Vite
- React Router v7
- React Query
- Tailwind CSS
- Zustand (State management)

---

## ⚙️ Environment Variables

### Backend (.env)
- `MONGODB_CONNECTION_STRING` - MongoDB URL
- `ACCESS_TOKEN_SECRET` - JWT secret cho access token
- `REFRESH_TOKEN_SECRET` - JWT secret cho refresh token
- `EMAIL_USER` / `EMAIL_PASS` - Gmail SMTP credentials
- `GOOGLE_CLIENT_ID` - Google OAuth ID

### Frontend (.env)
- `VITE_API_BASE_URL` - Backend API URL (http://localhost:5001/api)
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth ID

📌 **Xem `SETUP.md` để hướng dẫn chi tiết lấy các credentials này**

---

## 🤝 Team Workflow

1. Clone repo
2. Chạy `npm run setup` để cài dependencies
3. Copy `.env.example` thành `.env` ở cả `backend/` và `frontend/`
4. Điền environment variables (hỏi team lead nếu không rõ)
5. Chạy `npm run dev` để start dev server

---

## 📋 Troubleshooting

### ❌ Port bị chiếm
Xem mục "Port 5001 hoặc 5173 đã bị chiếm" trong [SETUP.md](./SETUP.md#-port-5001-hoặc-5173-đã-bị-chiếm)

### ❌ MongoDB lỗi
Xem mục "MongoDB Connection Error" trong [SETUP.md](./SETUP.md#-mongodb-connection-error)

### ❌ Các lỗi khác
Xem phần **Troubleshooting** trong [SETUP.md](./SETUP.md#5️⃣-troubleshooting)

---

**Happy coding! 🎉**
