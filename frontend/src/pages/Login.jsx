import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    // Giả lập gọi API thành công và lấy được dữ liệu User & Token
    const fakeUser = { _id: '1', fullName: 'Tester', email: 'test@gmail.com' };
    const fakeToken = 'fake-jwt-token-123';
    
    // Gọi hàm login từ Hook
    login(fakeUser, fakeToken);
    
    // Chuyển hướng người dùng về trang chủ
    navigate('/');
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>🔐 Đăng nhập hệ thống</h1>
      <p>Trang này hiện đang dùng đăng nhập giả lập để test cấu trúc Router & Store.</p>
      <button 
        onClick={handleLogin}
        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
      >
        Click để Đăng nhập
      </button>
    </div>
  );
};

export default Login;
