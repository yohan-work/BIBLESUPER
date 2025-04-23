import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (isLogin) {
        // 로그인
        const { error } = await signIn(email, password);
        if (error) {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        } else {
          onClose();
        }
      } else {
        // 회원가입
        if (!name.trim()) {
          setError('이름을 입력해주세요.');
          setIsLoading(false);
          return;
        }
        
        const { error } = await signUp(email, password, name);
        if (error) {
          if (error.message.includes('email')) {
            setError('이미 사용 중인 이메일입니다.');
          } else if (error.message.includes('password')) {
            setError('비밀번호는 6자 이상이어야 합니다.');
          } else {
            setError('회원가입 중 오류가 발생했습니다.');
          }
        } else {
          onClose();
        }
      }
    } catch (error) {
      setError('로그인/회원가입 처리 중 오류가 발생했습니다.');
      console.error('Authentication error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <button className="close-modal-btn" onClick={onClose}>×</button>
        
        <h2>{isLogin ? '로그인' : '회원가입'}</h2>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">이름</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="이름을 입력하세요"
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="이메일을 입력하세요"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="비밀번호를 입력하세요"
              minLength={6}
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading 
              ? '처리 중...' 
              : isLogin 
                ? '로그인' 
                : '회원가입'
            }
          </button>
        </form>
        
        <div className="auth-toggle">
          {isLogin ? (
            <p>
              계정이 없으신가요?{' '}
              <button type="button" onClick={toggleAuthMode}>
                회원가입
              </button>
            </p>
          ) : (
            <p>
              이미 계정이 있으신가요?{' '}
              <button type="button" onClick={toggleAuthMode}>
                로그인
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal; 