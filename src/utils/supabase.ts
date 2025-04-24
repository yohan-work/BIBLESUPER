import { createClient } from "@supabase/supabase-js";
import { User, Comment, DailyVerse, Verse } from "../types/bible";

// Supabase URL과 API 키는 환경 변수에서 가져옵니다.
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// 환경 변수가 설정되어 있는지 확인
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "환경 변수가 설정되지 않았습니다. .env 파일에 REACT_APP_SUPABASE_URL과 REACT_APP_SUPABASE_ANON_KEY를 설정해주세요."
  );
}

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseKey);

// 사용자 인증 관련 함수들
export const authUtils = {
  // 현재 로그인한 사용자 정보 가져오기
  getCurrentUser: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
      await supabase.from("profiles").insert({
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
    // profiles 테이블과의 join을 제거하고 comments 테이블만 쿼리
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("verse_key", verseKey)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("댓글 로드 중 오류:", error);
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
  addComment: async (
    userId: string,
    verseKey: string,
    content: string
  ): Promise<Comment | null> => {
    const { data, error } = await supabase
      .from("comments")
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
      console.error("댓글 작성 중 오류:", error);
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
  updateComment: async (
    commentId: string,
    content: string
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("comments")
      .update({
        content,
        updated_at: new Date(),
      })
      .eq("id", commentId);

    if (error) {
      console.error("댓글 수정 중 오류:", error);
      return false;
    }

    return true;
  },

  // 댓글 삭제하기
  deleteComment: async (commentId: string): Promise<boolean> => {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("댓글 삭제 중 오류:", error);
      return false;
    }

    return true;
  },

  // 댓글 좋아요 토글
  toggleLike: async (commentId: string, userId: string): Promise<boolean> => {
    // 먼저 현재 댓글 정보 가져오기
    const { data, error } = await supabase
      .from("comments")
      .select("likes")
      .eq("id", commentId)
      .single();

    if (error) {
      console.error("댓글 정보 로드 중 오류:", error);
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
      .from("comments")
      .update({
        likes: newLikes,
      })
      .eq("id", commentId);

    if (updateError) {
      console.error("좋아요 업데이트 중 오류:", updateError);
      return false;
    }

    return true;
  },

  // 구절별 댓글 수 가져오기
  getCommentCounts: async (
    bookId: string,
    chapterNum: number
  ): Promise<Record<string, number>> => {
    const { data, error } = await supabase
      .from("comments")
      .select("verse_key, count")
      .like("verse_key", `${bookId}-${chapterNum}-%`)
      .select();

    if (error) {
      console.error("댓글 수 로드 중 오류:", error);
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
export const setupRealtimeComments = (
  verseKey: string,
  callback: (comment: Comment) => void
) => {
  const channel = supabase
    .channel(`comments:${verseKey}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "comments",
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

// 일일 말씀 관련 함수들
export const dailyVerseUtils = {
  // 오늘의 말씀 가져오기
  getTodayVerse: async (): Promise<DailyVerse | null> => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD 형식

    try {
      // 오늘 날짜에 해당하는 말씀 가져오기
      const { data, error } = await supabase
        .from("daily_verses")
        .select("*")
        .eq("date", today)
        .single();

      if (error) {
        // 오늘 말씀이 없으면 가장 최근 말씀 가져오기
        const { data: latestData, error: latestError } = await supabase
          .from("daily_verses")
          .select("*")
          .order("date", { ascending: false })
          .limit(1)
          .single();

        if (latestError) {
          console.error("일일 말씀 로드 중 오류:", latestError);
          return null;
        }

        // 최근 말씀의 구절 정보 가져오기
        const verse = await getVerseByKey(latestData.verse_key);

        return {
          id: latestData.id,
          date: latestData.date,
          verseKey: latestData.verse_key,
          verse: verse,
          reflection: latestData.reflection,
          theme: latestData.theme,
        };
      }

      // 오늘 말씀의 구절 정보 가져오기
      const verse = await getVerseByKey(data.verse_key);

      return {
        id: data.id,
        date: data.date,
        verseKey: data.verse_key,
        verse: verse,
        reflection: data.reflection,
        theme: data.theme,
      };
    } catch (error) {
      console.error("일일 말씀 로드 중 오류:", error);
      return null;
    }
  },

  // 특정 날짜의 말씀 가져오기
  getVerseByDate: async (date: string): Promise<DailyVerse | null> => {
    try {
      const { data, error } = await supabase
        .from("daily_verses")
        .select("*")
        .eq("date", date)
        .single();

      if (error) {
        console.error(`${date} 날짜의 말씀 로드 중 오류:`, error);
        return null;
      }

      // 구절 정보 가져오기
      const verse = await getVerseByKey(data.verse_key);

      return {
        id: data.id,
        date: data.date,
        verseKey: data.verse_key,
        verse: verse,
        reflection: data.reflection,
        theme: data.theme,
      };
    } catch (error) {
      console.error(`${date} 날짜의 말씀 로드 중 오류:`, error);
      return null;
    }
  },

  // 말씀 목록 가져오기 (최근 순)
  getRecentVerses: async (limit: number = 7): Promise<DailyVerse[]> => {
    try {
      const { data, error } = await supabase
        .from("daily_verses")
        .select("*")
        .order("date", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("최근 말씀 목록 로드 중 오류:", error);
        return [];
      }

      // 각 말씀의 구절 정보 가져오기
      const dailyVerses = await Promise.all(
        data.map(async (item) => {
          const verse = await getVerseByKey(item.verse_key);
          return {
            id: item.id,
            date: item.date,
            verseKey: item.verse_key,
            verse: verse,
            reflection: item.reflection,
            theme: item.theme,
          };
        })
      );

      return dailyVerses;
    } catch (error) {
      console.error("최근 말씀 목록 로드 중 오류:", error);
      return [];
    }
  },
};

// 구절 키로 구절 정보 가져오기 (내부 도우미 함수)
const getVerseByKey = async (verseKey: string): Promise<Verse> => {
  try {
    // verseKey 형식: 'book-chapter-verse' (예: '창세기-1-1')
    const [book, chapterStr, verseStr] = verseKey.split("-");
    const chapter = parseInt(chapterStr);
    const verse = parseInt(verseStr);

    // 로컬 데이터를 사용하는 대신 하드코딩된 성경 구절 데이터를 사용
    const bibleTexts: Record<string, string> = {
      "요한복음-3-16":
        "하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라",
      "시편-23-1": "여호와는 나의 목자시니 내게 부족함이 없으리로다",
      "잠언-3-5":
        "너는 마음을 다하여 여호와를 신뢰하고 네 명철을 의지하지 말라",
      "빌립보서-4-13":
        "내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라",
      "마태복음-11-28":
        "수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라",
      "이사야-41-10":
        "두려워하지 말라 내가 너와 함께 함이라 놀라지 말라 나는 네 하나님이 됨이라 내가 너를 굳세게 하리라 참으로 너를 도와 주리라 참으로 나의 의로운 오른손으로 너를 붙들리라",
      "로마서-8-28":
        "우리가 알거니와 하나님을 사랑하는 자 곧 그의 뜻대로 부르심을 입은 자들에게는 모든 것이 합력하여 선을 이루느니라",
    };

    // 구절 키에 해당하는 성경 구절 텍스트 가져오기
    const content = bibleTexts[verseKey];

    if (!content) {
      throw new Error(
        `구절 키 ${verseKey}에 해당하는 성경 구절을 찾을 수 없습니다.`
      );
    }

    return {
      book,
      chapter,
      verse,
      content,
    };
  } catch (error) {
    console.error(`구절 정보 로드 중 오류 (${verseKey}):`, error);
    // 오류 발생 시 기본값 반환
    return {
      book: "알 수 없음",
      chapter: 0,
      verse: 0,
      content: "구절을 불러올 수 없습니다.",
    };
  }
};
