import { Verse, Chapter, Book } from '../types/bible';

/**
 * 성경 텍스트 파일을 파싱하여 장과 절로 분리합니다.
 * @param text 성경 텍스트 파일 내용
 * @param bookName 책 이름 (예: '창세기')
 * @returns 파싱된 장 배열
 */
export const parseBookText = (text: string, bookName: string): Chapter[] => {
  // 줄 단위로 분리하고 의미 있는 줄만 필터링
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  const chapters: { [key: number]: Verse[] } = {};
  
  const shortBookName = getShortBookName(bookName);
  
  console.log(`${bookName} 파싱 시작 - 줄 수: ${lines.length}`);
  
  // 다양한 정규식 패턴을 시도
  const patterns = [
    new RegExp(`^${shortBookName}(\\d+):(\\d+)\\s+(.+)$`),           // 기본 패턴 (예: '창1:1 내용')
    new RegExp(`^${shortBookName}\\s*(\\d+)\\s*:\\s*(\\d+)\\s+(.+)$`), // 공백 허용 (예: '창 1 : 1 내용')
    new RegExp(`<${shortBookName}\\s*(\\d+)\\s*:\\s*(\\d+)>\\s*(.+)$`), // 태그 형식 (예: '<창1:1> 내용')
    new RegExp(`${shortBookName}\\s*(\\d+)\\s*장\\s*(\\d+)\\s*절\\s+(.+)$`), // 장절 형식 (예: '창 1장 1절 내용')
    new RegExp(`(\\d+)\\s*:\\s*(\\d+)\\s+(.+)$`), // 책 접두사 없이 숫자만 (예: '1:1 내용')
    new RegExp(`^(\\d+)(\\d{2})\\s+(.+)$`) // 연속된 숫자 형식 (예: '101 내용' -> 1장 1절)
  ];
  
  // 각 줄 파싱
  let matchCount = 0;
  let currentChapter = 1; // 현재 처리 중인 장
  
  for (const line of lines) {
    let matched = false;
    
    // 모든 패턴 시도
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        // 마지막 패턴(연속 숫자)인 경우 특별 처리
        let chapterStr, verseStr, content;
        
        if (pattern === patterns[patterns.length - 1]) {
          // 예: '101'을 '1장 1절'로 해석
          const fullNumber = match[1] + match[2];
          if (fullNumber.length >= 3) {
            chapterStr = fullNumber.substring(0, fullNumber.length - 2);
            verseStr = fullNumber.substring(fullNumber.length - 2);
          } else {
            chapterStr = fullNumber.substring(0, 1);
            verseStr = fullNumber.substring(1);
          }
          content = match[3];
        } else {
          chapterStr = match[1];
          verseStr = match[2];
          content = match[3] || '내용 없음';
        }
        
        const chapter = parseInt(chapterStr, 10);
        const verse = parseInt(verseStr, 10);
        
        if (isNaN(chapter) || isNaN(verse)) continue;
        if (chapter <= 0 || verse <= 0) continue; // 유효하지 않은 장/절 번호 무시
        
        currentChapter = chapter;
        
        if (!chapters[chapter]) {
          chapters[chapter] = [];
        }
        
        // 이미 있는 절 번호면 스킵 (중복 방지)
        const existingVerse = chapters[chapter].find(v => v.verse === verse);
        if (!existingVerse) {
          chapters[chapter].push({
            book: bookName,
            chapter,
            verse,
            content: content.trim()
          });
          
          matched = true;
          matchCount++;
        }
        
        break; // 패턴 매칭 성공하면 다음 패턴은 시도하지 않음
      }
    }
    
    // 패턴에 맞지 않지만 내용이 있는 경우, 이전 절의 연속으로 간주
    if (!matched && line.length > 5 && Object.keys(chapters).length > 0) {
      // 현재 장에 이미 절이 있으면, 마지막 절의 내용에 추가
      if (chapters[currentChapter] && chapters[currentChapter].length > 0) {
        const lastVerseIndex = chapters[currentChapter].length - 1;
        chapters[currentChapter][lastVerseIndex].content += ' ' + line.trim();
      }
    }
    
    // 디버깅용 - 첫 몇 줄이 매칭되지 않으면 출력
    if (!matched && matchCount < 5 && lines.indexOf(line) < 10) {
      console.log(`파싱되지 않는 줄: "${line}"`);
    }
  }
  
  console.log(`${bookName} 파싱 완료 - 총 매칭: ${matchCount}개, 장 ${Object.keys(chapters).length}개 발견`);
  
  // 빈 장이 있으면 경고
  Object.keys(chapters).forEach(chapterKey => {
    const chapterNum = parseInt(chapterKey, 10);
    if (chapters[chapterNum].length === 0) {
      console.warn(`${bookName} ${chapterNum}장에 절이 없습니다.`);
    }
  });
  
  // 장 배열로 변환 및 정렬
  return Object.keys(chapters)
    .map(chapterKey => {
      const chapterNum = parseInt(chapterKey, 10);
      return {
        book: bookName,
        chapter: chapterNum,
        verses: chapters[chapterNum].sort((a, b) => a.verse - b.verse)
      };
    })
    .sort((a, b) => a.chapter - b.chapter);
};

/**
 * 책 이름에서 접두사를 추출합니다. (예: '창세기' -> '창')
 * @param bookName 책 이름
 * @returns 책의 접두사
 */
export const getShortBookName = (bookName: string): string => {
  // 일반적인 성경책 접두사 매핑
  const prefixMap: Record<string, string> = {
    '창세기': '창',
    '출애굽기': '출',
    '레위기': '레',
    '민수기': '민',
    '신명기': '신',
    '여호수아': '수',
    '사사기': '삿',
    '룻기': '룻',
    '사무엘상': '삼상',
    '사무엘하': '삼하',
    '열왕기상': '왕상',
    '열왕기하': '왕하',
    '역대상': '대상',
    '역대하': '대하',
    '마태복음': '마',
    '마가복음': '막',
    '누가복음': '눅',
    '요한복음': '요',
    '사도행전': '행'
    // 다른 책들도 추가 가능
  };
  
  // 매핑에 있으면 해당 접두사 반환, 없으면 첫 글자 반환
  const prefix = prefixMap[bookName] || bookName.charAt(0);
  console.log(`책 이름 '${bookName}'의 접두사: '${prefix}'`);
  
  return prefix;
};

/**
 * 파일 이름에서 책 이름을 추출합니다.
 * @param filename 파일명 (예: '1-01창세기.txt')
 * @returns 책 이름 (예: '창세기')
 */
export const extractBookName = (filename: string): string => {
  const match = filename.match(/\d+-\d+(.+)\.txt$/);
  return match ? match[1] : '';
};

/**
 * 텍스트 파일에서 장 수를 계산합니다.
 * @param text 성경 텍스트 파일 내용
 * @param shortBookName 책의 접두사 (예: '창')
 * @returns 장 수
 */
export const countChapters = (text: string, shortBookName: string): number[] => {
  const chapters = new Set<number>();
  
  console.log(`장 수 계산 - 책 접두사: ${shortBookName}, 텍스트 길이: ${text.length}`);
  
  if (text.length === 0) {
    console.warn(`${shortBookName}에 대한 텍스트가 비어 있습니다.`);
    return [];
  }
  
  // 줄 단위로 분리
  const lines = text.split('\n');
  console.log(`총 ${lines.length}개 줄 분석 시작`);
  
  // 다양한 정규식 패턴을 시도
  const patterns = [
    new RegExp(`^${shortBookName}(\\d+):(\\d+)`),           // 기본 패턴 (예: '창1:1')
    new RegExp(`^${shortBookName}\\s*(\\d+)\\s*:\\s*(\\d+)`), // 공백 허용 (예: '창 1 : 1')
    new RegExp(`<${shortBookName}\\s*(\\d+)\\s*:\\s*(\\d+)>`), // 태그 형식 (예: '<창1:1>')
    new RegExp(`${shortBookName}\\s*(\\d+)\\s*장\\s*(\\d+)\\s*절`), // 장절 형식 (예: '창 1장 1절')
    new RegExp(`(\\d+)\\s*:\\s*(\\d+)\\s+`) // 책 접두사 없이 숫자만 (예: '1:1 ')
  ];
  
  // 각 줄에서 정규식으로 장 번호 추출
  let matchCount = 0;
  for (const line of lines) {
    if (line.trim() === '') continue;
    
    let matched = false;
    // 모든 패턴 시도
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const chapter = parseInt(match[1], 10);
        if (!isNaN(chapter) && chapter > 0) {
          chapters.add(chapter);
          matched = true;
          matchCount++;
          break; // 패턴 매칭 성공하면 다음 패턴은 시도하지 않음
        }
      }
    }
    
    // 디버깅용 - 첫 몇 줄이 매칭되지 않으면 출력
    if (!matched && matchCount < 5 && lines.indexOf(line) < 10) {
      console.log(`매칭되지 않는 줄: "${line}"`);
    }
  }
  
  // 결과 정렬
  const result = Array.from(chapters).sort((a, b) => a - b);
  console.log(`발견된 장 수: ${result.length}, 장: ${result}, 총 매칭: ${matchCount}개`);
  
  // 장이 없으면 가상 데이터 생성
  if (result.length === 0) {
    console.warn(`${shortBookName}에서 장을 찾을 수 없어 가상 데이터 생성`);
    return [1, 2, 3]; // 테스트용 가상 데이터
  }
  
  return result;
};

/**
 * 성경 책 목록을 생성합니다.
 * @param filenames 성경 텍스트 파일 이름 배열
 * @returns 성경 책 목록
 */
export const createBookList = (filenames: string[], fileContents: Record<string, string>): Book[] => {
  console.log('책 목록 생성 시작', filenames);
  
  return filenames.map(filename => {
    const bookName = extractBookName(filename);
    const isOldTestament = filename.startsWith('1-');
    const shortBookName = getShortBookName(bookName);
    const content = fileContents[filename] || '';
    
    console.log(`책 처리: ${bookName}, 접두사: ${shortBookName}, 내용 길이: ${content.length}`);
    
    // 실제 텍스트 파일에서 장 수를 계산합니다.
    const chapters = countChapters(content, shortBookName);
    
    const book: Book = {
      id: bookName,
      name: bookName,
      testament: isOldTestament ? 'old' : 'new',
      chapters: chapters
    };
    
    console.log(`생성된 책 정보:`, book);
    
    return book;
  });
}; 