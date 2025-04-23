import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, authUtils } from '../utils/supabase';
import { User } from '../types/bible';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 사용자 정보를 가져오는 함수
  const getUser = async () => {
    try {
      const supabaseUser = await authUtils.getCurrentUser();
      
      if (supabaseUser) {
        // 사용자 프로필 정보 가져오기
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        if (error) {
          console.error('프로필 로드 중 오류:', error);
          return;
        }

        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: profile.name || supabaseUser.email?.split('@')[0] || '익명',
          profileImage: profile.profile_image,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('사용자 정보 로드 중 오류:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await authUtils.signInWithEmail(email, password);
      
      if (error) {
        return { error };
      }

      await getUser();
      return { error: null };
    } catch (error) {
      console.error('로그인 중 오류:', error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  // 회원가입
  const signUp = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await authUtils.signUpWithEmail(email, password, name);
      
      if (error) {
        return { error };
      }

      await getUser();
      return { error: null };
    } catch (error) {
      console.error('회원가입 중 오류:', error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃
  const signOut = async () => {
    try {
      setIsLoading(true);
      await authUtils.signOut();
      setUser(null);
    } catch (error) {
      console.error('로그아웃 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Supabase 인증 상태 변경 리스너 설정
  useEffect(() => {
    // 현재 사용자 정보 가져오기
    getUser();

    // 인증 상태 변경 리스너 등록
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        getUser();
      } else {
        setUser(null);
      }
    });

    // 클린업 함수
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 