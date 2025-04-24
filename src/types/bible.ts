export interface User {
  id: string; // 사용자 고유 ID (Supabase UUID)
  email: string; // 사용자 이메일
  name: string; // 사용자 이름
  profileImage?: string; // 프로필 이미지 URL
  created_at?: string; // 계정 생성 시간
}

export interface Comment {
  id: string; // 댓글 고유 ID
  userId: string; // 작성자 ID
  verseKey: string; // 구절 키 (book-chapter-verse 형식)
  content: string; // 댓글 내용
  timestamp: number; // 작성 시간
  likes: string[]; // 좋아요를 누른 사용자 ID 목록
}

export interface Verse {
  book: string; // 책 이름 (예: '창세기')
  chapter: number; // 장 번호
  verse: number; // 절 번호
  content: string; // 절 내용
  isHighlighted?: boolean; // 하이라이트 여부
  comment?: string; // 사용자 개인 코멘트
  commentCount?: number; // 해당 구절의 댓글 수
}

export interface Chapter {
  book: string; // 책 이름
  chapter: number; // 장 번호
  verses: Verse[]; // 절 목록
}

export interface Book {
  id: string; // 책 식별자 (예: '창세기')
  name: string; // 책 이름 (한글)
  testament: "old" | "new"; // 구약 또는 신약
  chapters: number[]; // 장 목록 (장 번호 배열)
}

export interface BibleData {
  books: Book[]; // 성경책 목록
}

export interface DailyVerse {
  id: string; // 고유 ID
  date: string; // 날짜 (YYYY-MM-DD 형식)
  verseKey: string; // 구절 키 (book-chapter-verse 형식)
  verse: Verse; // 구절 정보
  reflection: string; // 묵상 내용
  theme?: string; // 주제 (선택 사항)
}
