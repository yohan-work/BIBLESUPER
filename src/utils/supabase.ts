import { createClient } from '@supabase/supabase-js';
import { User, Comment } from '../types/bible';

// Supabase URL과 API 키는 환경 변수나 설정 파일에서 가져옵니다.
// 실제 프로젝트에서는 이 값들을 .env 파일에 저장하세요.
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseKey);

// 사용자 인증 관련 함수들
export const authUtils = {
  // 현재 로그인한 사용자 정보 가져오기
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // 이메일/비밀번호로 로그인
  signInWithEmail: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // 이메일/비밀번호로 회원가입
  signUpWithEmail: async (email: string, password: string, name: string) => {
    // 1. 회원가입
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    // 2. 사용자 프로필 생성
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        name,
        created_at: new Date(),
      });
    }

    return { data, error };
  },

  // 로그아웃
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },
};

// 댓글 관련 함수들
export const commentUtils = {
  // 특정 구절의 댓글 가져오기
  getCommentsByVerse: async (verseKey: string): Promise<Comment[]> => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (
          name,
          profile_image
        )
      `)
      .eq('verse_key', verseKey)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('댓글 로드 중 오류:', error);
      return [];
    }

    return data.map((item) => ({
      id: item.id,
      userId: item.user_id,
      verseKey: item.verse_key,
      content: item.content,
      timestamp: new Date(item.created_at).getTime(),
      likes: item.likes || [],
    }));
  },

  // 댓글 작성하기
  addComment: async (userId: string, verseKey: string, content: string): Promise<Comment | null> => {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: userId,
        verse_key: verseKey,
        content,
        created_at: new Date(),
        likes: [],
      })
      .select()
      .single();

    if (error) {
      console.error('댓글 작성 중 오류:', error);
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      verseKey: data.verse_key,
      content: data.content,
      timestamp: new Date(data.created_at).getTime(),
      likes: data.likes || [],
    };
  },

  // 댓글 수정하기
  updateComment: async (commentId: string, content: string): Promise<boolean> => {
    const { error } = await supabase
      .from('comments')
      .update({
        content,
        updated_at: new Date(),
      })
      .eq('id', commentId);

    if (error) {
      console.error('댓글 수정 중 오류:', error);
      return false;
    }

    return true;
  },

  // 댓글 삭제하기
  deleteComment: async (commentId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('댓글 삭제 중 오류:', error);
      return false;
    }

    return true;
  },

  // 댓글 좋아요 토글
  toggleLike: async (commentId: string, userId: string): Promise<boolean> => {
    // 먼저 현재 댓글 정보 가져오기
    const { data, error } = await supabase
      .from('comments')
      .select('likes')
      .eq('id', commentId)
      .single();

    if (error) {
      console.error('댓글 정보 로드 중 오류:', error);
      return false;
    }

    // 좋아요 목록 업데이트
    const likes = data.likes || [];
    const hasLiked = likes.includes(userId);
    
    const newLikes = hasLiked
      ? likes.filter((id: string) => id !== userId)
      : [...likes, userId];

    // 업데이트된 좋아요 목록 저장
    const { error: updateError } = await supabase
      .from('comments')
      .update({
        likes: newLikes,
      })
      .eq('id', commentId);

    if (updateError) {
      console.error('좋아요 업데이트 중 오류:', updateError);
      return false;
    }

    return true;
  },

  // 구절별 댓글 수 가져오기
  getCommentCounts: async (bookId: string, chapterNum: number): Promise<Record<string, number>> => {
    const { data, error } = await supabase
      .from('comments')
      .select('verse_key, count')
      .like('verse_key', `${bookId}-${chapterNum}-%`)
      .select();

    if (error) {
      console.error('댓글 수 로드 중 오류:', error);
      return {};
    }

    // 구절별로 댓글 수 집계
    const counts: Record<string, number> = {};
    
    data.forEach((item) => {
      counts[item.verse_key] = (counts[item.verse_key] || 0) + 1;
    });

    return counts;
  },
};

// 실시간 업데이트 설정
export const setupRealtimeComments = (verseKey: string, callback: (comment: Comment) => void) => {
  const channel = supabase
    .channel(`comments:${verseKey}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `verse_key=eq.${verseKey}`,
      },
      (payload) => {
        const newComment: Comment = {
          id: payload.new.id,
          userId: payload.new.user_id,
          verseKey: payload.new.verse_key,
          content: payload.new.content,
          timestamp: new Date(payload.new.created_at).getTime(),
          likes: payload.new.likes || [],
        };
        callback(newComment);
      }
    )
    .subscribe();

  // 구독 해제 함수 반환
  return () => {
    supabase.removeChannel(channel);
  };
}; 