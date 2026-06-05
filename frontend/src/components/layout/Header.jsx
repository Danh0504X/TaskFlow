import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '15px 30px', 
      backgroundColor: '#f8f9fa',
      borderBottom: '1px solid #e9ecef',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <h2 style={{ margin: 0, color: '#2c3e50' }}>WEBSALER RE</h2>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <span>Xin chào, <strong style={{ color: '#007bff' }}>{user?.fullName}</strong></span>
        <Button variant="danger" onClick={logout}>Đăng xuất</Button>
      </div>
    </header>
  );
};

export default Header;
