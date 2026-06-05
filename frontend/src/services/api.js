import axios from 'axios';

// Khởi tạo instance axios
const api = axios.create({
  baseURL: 'http://localhost:5001/api', // Đã trỏ về đúng cổng mặc định của Backend (5001)
  timeout: 10000,
  withCredentials: true, // Quan trọng: Cho phép trình duyệt tự động đính kèm Cookie (chứa token) vào request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Xử lý trước khi gửi request (ví dụ: tự động gắn token)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor: Xử lý sau khi nhận response (ví dụ: bắt lỗi chung)
api.interceptors.response.use(
  (response) => {
    return response.data; // Chỉ lấy phần data, loại bỏ header của axios
  },
  (error) => {
    // Nếu lỗi 401 (Hết hạn token) thì có thể xử lý logout ở đây
    return Promise.reject(error);
  }
);

export default api;
