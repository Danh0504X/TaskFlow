import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

// MainLayout sẽ bọc toàn bộ các trang bên trong. 
// Outlet chính là nơi các Page (như Home, Project...) sẽ được render (thay thế) vào.
const MainLayout = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f4f6f8' }}>
      {/* Header luôn cố định nằm trên cùng ở mọi trang */}
      <Header />
      
      {/* Nội dung thay đổi của từng trang sẽ nằm ở đây */}
      <main style={{ flex: 1, padding: '30px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
