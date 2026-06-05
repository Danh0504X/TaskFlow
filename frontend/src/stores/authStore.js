import { create } from 'zustand';

// Store quản lý trạng thái đăng nhập của người dùng toàn cục
const useAuthStore = create((set) => ({
  user: null,             // Thông tin người dùng (tên, email...)
  isAuthenticated: false, // Trạng thái đã đăng nhập chưa
  
  // Hàm xử lý đăng nhập
  login: (userData, token) => {
    localStorage.setItem('token', token);
    set({ user: userData, isAuthenticated: true });
  },
  
  // Hàm xử lý đăng xuất
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, isAuthenticated: false });
  }
}));

export default useAuthStore;
