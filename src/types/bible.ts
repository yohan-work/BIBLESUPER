export interface Verse {
  book: string;     // 책 이름 (예: '창세기')
  chapter: number;  // 장 번호
  verse: number;    // 절 번호
  content: string;  // 절 내용
  isHighlighted?: boolean; // 하이라이트 여부
  comment?: string; // 사용자 코멘트
}

export interface Chapter {
  book: string;     // 책 이름
  chapter: number;  // 장 번호
  verses: Verse[];  // 절 목록
}

export interface Book {
  id: string;       // 책 식별자 (예: '창세기')
  name: string;     // 책 이름 (한글)
  testament: 'old' | 'new';  // 구약 또는 신약
  chapters: number[]; // 장 목록 (장 번호 배열)
}

export interface BibleData {
  books: Book[];    // 성경책 목록
} 