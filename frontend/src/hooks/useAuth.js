import useAuthStore from '../stores/authStore';

/**
 * Custom hook này bọc lại authStore để lấy các state và action một cách gọn gàng.
 * Nơi này cũng là chỗ tuyệt vời để viết thêm các logic mở rộng liên quan đến Auth.
 */
export const useAuth = () => {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  
  // Ví dụ tiện ích kiểm tra quyền của User
  const checkRole = (role) => {
    return user?.role === role;
  };

  return { user, isAuthenticated, login, logout, checkRole };
};
