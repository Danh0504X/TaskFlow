import React from 'react';

const Home = () => {
  return (
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h1>🏠 Tổng quan (Dashboard)</h1>
      <p>Đây là phần nội dung trang chủ. Bạn có thể hiển thị danh sách Dự án, Tasks hoặc các biểu đồ tại đây.</p>
      <p>Để ý rằng Header và nút Đăng xuất đã được tách ra dùng chung ở Layout, giúp code trang này gọn gàng hơn rất nhiều!</p>
    </div>
  );
};

export default Home;
