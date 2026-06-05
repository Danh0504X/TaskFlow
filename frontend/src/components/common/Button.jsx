import React from 'react';

// Một component Button dùng chung cho toàn bộ dự án
const Button = ({ children, onClick, type = 'button', variant = 'primary', style = {} }) => {
  const baseStyle = {
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    border: 'none',
    fontWeight: 'bold',
    transition: 'opacity 0.2s',
    ...style
  };

  const variants = {
    primary: { backgroundColor: '#007bff', color: 'white' },
    danger: { backgroundColor: '#dc3545', color: 'white' },
    outline: { backgroundColor: 'transparent', border: '1px solid #007bff', color: '#007bff' }
  };

  return (
    <button 
      type={type} 
      onClick={onClick} 
      style={{ ...baseStyle, ...variants[variant] }}
      onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
      onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
    >
      {children}
    </button>
  );
};

export default Button;
