import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/Login';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../hooks/useAuth';

// Component bọc ngoài để bảo vệ trang
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// Định nghĩa toàn bộ cây URL
const router = createBrowserRouter([
  {
    path: '/',
    // Thiết lập MainLayout làm giao diện gốc cho các trang cần đăng nhập
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    // Tất cả các trang con sẽ được render vào thẻ <Outlet /> của MainLayout
    children: [
      {
        index: true, // Trang mặc định khi gõ "/"
        element: <Home />,
      },
      // Ví dụ: Sau này tạo trang quản lý Dự án:
      // { path: 'projects', element: <ProjectPage /> }
    ]
  },
  {
    path: '/login', // Trang Login đứng độc lập, không dùng MainLayout
    element: <Login />,
  },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
