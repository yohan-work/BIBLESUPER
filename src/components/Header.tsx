import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import AuthModal from "./AuthModal";
import RecentComments from "./RecentComments";
import "../styles/Header.css";

interface HeaderProps {
  onNavigateToVerse?: (verseKey: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigateToVerse }) => {
  const { user, signOut, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRecentComments, setShowRecentComments] = useState(false);

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    if (showRecentComments) setShowRecentComments(false);
  };

  const toggleRecentComments = () => {
    setShowRecentComments(!showRecentComments);
    if (showUserMenu) setShowUserMenu(false);
  };

  const handleNavigateToVerse = (verseKey: string) => {
    if (onNavigateToVerse) {
      onNavigateToVerse(verseKey);
    } else {
      console.warn("Navigation handler not provided to Header component");
    }
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <h1 className="app-title">혜인순</h1>

        <div className="header-actions">
          <button
            className="comments-button"
            onClick={toggleRecentComments}
            title="최근 댓글"
          >
            <span role="img" aria-label="최근 댓글">
              💬
            </span>
          </button>

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
      </div>

      {showRecentComments && (
        <RecentComments
          onNavigateToVerse={handleNavigateToVerse}
          onClose={() => setShowRecentComments(false)}
        />
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </header>
  );
};

export default Header;
