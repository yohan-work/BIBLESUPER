import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import '../styles/Header.css';

const Header: React.FC = () => {
  const { user, signOut, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const handleLogin = () => {
    setShowAuthModal(true);
  };
  
  const handleLogout = async () => {
    await signOut();
    setShowUserMenu(false);
  };
  
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };
  
  return (
    <header className="app-header">
      <div className="header-content">
        <h1 className="app-title">성경 함께 읽기</h1>
        
        <div className="user-section">
          {isLoading ? (
            <div className="loading-indicator">로딩 중...</div>
          ) : user ? (
            <div className="user-profile">
              <button className="profile-button" onClick={toggleUserMenu}>
                {user.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={`${user.name} 프로필`} 
                    className="profile-image" 
                  />
                ) : (
                  <div className="profile-initial">
                    {user.name[0].toUpperCase()}
                  </div>
                )}
                <span className="user-name">{user.name}</span>
              </button>
              
              {showUserMenu && (
                <div className="user-menu">
                  <button className="menu-item" onClick={handleLogout}>
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="login-button" onClick={handleLogin}>
              로그인
            </button>
          )}
        </div>
      </div>
      
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </header>
  );
};

export default Header; 