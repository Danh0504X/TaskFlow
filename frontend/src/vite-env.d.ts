/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL của backend API, ví dụ: http://localhost:5001/api */
  readonly VITE_API_BASE_URL: string
  /** Google OAuth Client ID (lấy từ Google Cloud Console) */
  readonly VITE_GOOGLE_CLIENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
