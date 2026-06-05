import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import Button from '../components/common/Button';

// Định nghĩa Interface (Kiểu dữ liệu) cho cấu trúc trả về từ API SignIn của Backend
interface SignInResponse {
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    fullName: string;
    // Tùy theo authService backend trả về thêm gì thì định nghĩa ở đây
    user?: any; 
  };
}

const Login: React.FC = () => {
  // Khai báo state với TypeScript
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn chặn reload trang
    
    // Validate cơ bản
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Gọi API thực tế xuống backend bằng axios (đã được cấu hình trong api.js)
      const response = await api.post<any, SignInResponse>('/auth/sign-in', {
        email,
        password
      });

      // Bóc tách dữ liệu từ API Backend trả về
      const token = response.data?.accessToken;
      
      // Tạo cục data giả lập dựa trên những gì Backend trả về để ném vào Store
      const userData = response.data?.user || { 
        fullName: response.data?.fullName || 'Người dùng', 
        email 
      };

      if (token) {
        // Gọi action login từ Zustand Store để lưu token & thông tin user
        login(userData, token);
        
        // Chuyển hướng người dùng về trang chủ
        navigate('/');
      } else {
        setError('Đăng nhập thất bại: Không nhận được token từ server');
      }
    } catch (err: any) {
      // Bắt lỗi từ backend quăng ra (Ví dụ: Sai mật khẩu)
      setError(err.response?.data?.message || 'Lỗi kết nối đến server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
      <h1>🔐 Đăng nhập hệ thống</h1>
      
      {error && (
        <div style={{ color: '#721c24', backgroundColor: '#f8d7da', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label htmlFor="email" style={{ fontWeight: 'bold' }}>Email</label>
          <input 
            id="email"
            type="email" 
            placeholder="Nhập email của bạn..." 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label htmlFor="password" style={{ fontWeight: 'bold' }}>Mật khẩu</label>
          <input 
            id="password"
            type="password" 
            placeholder="Nhập mật khẩu..." 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        
        <Button type="submit" variant="primary" style={{ marginTop: '10px', padding: '12px' }}>
          {loading ? 'Đang xử lý...' : 'Đăng nhập'}
        </Button>
      </form>
    </div>
  );
};

export default Login;
