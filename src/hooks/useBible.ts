import { useState, useEffect } from "react";
import { Book, Chapter, Verse } from "../types/bible";
import {
  parseBookText,
  createBookList,
  extractBookName,
} from "../utils/bibleParser";
import { useAuth } from "../contexts/AuthContext";
import { noteUtils } from "../utils/supabase";

// 성경 파일 목록 (실제 환경에서는 서버 또는 파일 시스템에서 가져옵니다)
const BIBLE_FILES = [
  "1-01창세기.txt",
  "1-02출애굽기.txt",
  "1-03레위기.txt",
  "1-04민수기.txt",
  "1-05신명기.txt",
  "1-06여호수아.txt",
  "1-07사사기.txt",
  "1-08룻기.txt",
  "1-09사무엘상.txt",
  "1-10사무엘하.txt",
  "1-11열왕기상.txt",
  "1-12열왕기하.txt",
  "1-13역대상.txt",
  "1-14역대하.txt",
  "1-15에스라.txt",
  "1-16느헤미야.txt",
  "1-17에스더.txt",
  "1-18욥기.txt",
  "1-19시편.txt",
  "1-20잠언.txt",
  "1-21전도서.txt",
  "1-22아가.txt",
  "1-23이사야.txt",
  "1-24예레미야.txt",
  "1-25예레미야애가.txt",
  "1-26에스겔.txt",
  "1-27다니엘.txt",
  "1-28호세아.txt",
  "1-29요엘.txt",
  "1-30아모스.txt",
  "1-31오바댜.txt",
  "1-32요나.txt",
  "1-33미가.txt",
  "1-34나훔.txt",
  "1-35하박국.txt",
  "1-36스바냐.txt",
  "1-37학개.txt",
  "1-38스가랴.txt",
  "1-39말라기.txt",
  "2-01마태복음.txt",
  "2-02마가복음.txt",
  "2-03누가복음.txt",
  "2-04요한복음.txt",
  "2-05사도행전.txt",
  "2-06로마서.txt",
  "2-07고린도전서.txt",
  "2-08고린도후서.txt",
  "2-09갈라디아서.txt",
  "2-10에베소서.txt",
  "2-11빌립보서.txt",
  "2-12골로새서.txt",
  "2-13데살로니가전서.txt",
  "2-14데살로니가후서.txt",
  "2-15디모데전서.txt",
  "2-16디모데후서.txt",
  "2-17디도서.txt",
  "2-18빌레몬서.txt",
  "2-19히브리서.txt",
  "2-20야고보서.txt",
  "2-21베드로전서.txt",
  "2-22베드로후서.txt",
  "2-23요한일서.txt",
  "2-24요한이서.txt",
  "2-25요한삼서.txt",
  "2-26유다서.txt",
  "2-27요한계시록.txt",
];

const useBible = () => {
  const { user } = useAuth(); // 인증 컨텍스트에서 사용자 정보 가져오기
  const [books, setBooks] = useState<Book[]>([]);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // 로컬 스토리지에서 하이라이트 및 코멘트 데이터 로드
  useEffect(() => {
    try {
      const savedHighlights = localStorage.getItem("bible_highlights");
      const savedComments = localStorage.getItem("bible_comments");

      if (savedHighlights) {
        setHighlights(JSON.parse(savedHighlights));
      }

      if (savedComments) {
        setComments(JSON.parse(savedComments));
      }

      // 로그인한 사용자가 있으면 Supabase에서 개인 묵상 데이터도 불러오기
      if (user) {
        loadNotesFromDatabase();
      }
    } catch (err) {
      console.error("저장된 데이터 로드 중 오류:", err);
    }
  }, [user]);

  // Supabase에서 사용자의 개인 묵상 데이터 불러오기
  const loadNotesFromDatabase = async () => {
    if (!user) return;

    try {
      const userNotes = await noteUtils.getUserNotes(user.id);

      // DB에서 로드한 노트를 로컬 상태와 통합
      if (Object.keys(userNotes).length > 0) {
        setComments((prevComments) => {
          const mergedComments = { ...prevComments };

          // DB에서 가져온 노트가 로컬에 없거나 다른 경우 업데이트
          Object.entries(userNotes).forEach(([verseKey, content]) => {
            if (
              !mergedComments[verseKey] ||
              mergedComments[verseKey] !== content
            ) {
              mergedComments[verseKey] = content;
            }
          });

          // 통합된 데이터를 로컬 스토리지에도 저장
          localStorage.setItem(
            "bible_comments",
            JSON.stringify(mergedComments)
          );

          return mergedComments;
        });
      }
    } catch (err) {
      console.error("DB에서 노트 로드 중 오류:", err);
    }
  };

  // 선택한 장의 개인 묵상만 로드
  const loadChapterNotesFromDatabase = async (
    bookId: string,
    chapterNum: number
  ) => {
    if (!user) return;

    try {
      const chapterNotes = await noteUtils.getChapterNotes(
        user.id,
        bookId,
        chapterNum
      );

      if (Object.keys(chapterNotes).length > 0) {
        // 현재 로컬 노트와 DB 노트 병합
        const updatedComments = { ...comments, ...chapterNotes };
        setComments(updatedComments);
        localStorage.setItem("bible_comments", JSON.stringify(updatedComments));
      }
    } catch (err) {
      console.error("장 노트 로드 중 오류:", err);
    }
  };

  // 하이라이트 및 코멘트 데이터 저장
  const saveUserData = async () => {
    try {
      // 로컬 스토리지에 저장
      localStorage.setItem("bible_highlights", JSON.stringify(highlights));
      localStorage.setItem("bible_comments", JSON.stringify(comments));
    } catch (err) {
      console.error("데이터 저장 중 오류:", err);
    }
  };

  // 구절 하이라이트 토글
  const toggleHighlight = (verse: Verse) => {
    const verseKey = `${verse.book}-${verse.chapter}-${verse.verse}`;
    const newHighlights = { ...highlights };

    if (newHighlights[verseKey]) {
      delete newHighlights[verseKey];
    } else {
      newHighlights[verseKey] = true;
    }

    setHighlights(newHighlights);
    saveUserData();

    // 선택된 장이 있으면 하이라이트 상태 업데이트
    if (selectedChapter) {
      const updatedVerses = selectedChapter.verses.map((v) => {
        const vKey = `${v.book}-${v.chapter}-${v.verse}`;
        return {
          ...v,
          isHighlighted:
            vKey === verseKey ? !v.isHighlighted : newHighlights[vKey] || false,
        };
      });

      setSelectedChapter({
        ...selectedChapter,
        verses: updatedVerses,
      });
    }
  };

  // 구절에 코멘트 추가
  const addComment = async (verse: Verse, comment: string) => {
    setIsSaving(true);
    const verseKey = `${verse.book}-${verse.chapter}-${verse.verse}`;
    const newComments = { ...comments };

    if (comment.trim() === "") {
      delete newComments[verseKey];
    } else {
      newComments[verseKey] = comment;
    }

    setComments(newComments);

    // 로컬 스토리지에 저장
    saveUserData();

    // 로그인한 사용자가 있으면 Supabase에도 저장
    if (user) {
      try {
        await noteUtils.saveNote(user.id, verseKey, comment);
      } catch (err) {
        console.error("DB에 노트 저장 중 오류:", err);
      }
    }

    // 선택된 장이 있으면 코멘트 상태 업데이트
    if (selectedChapter) {
      const updatedVerses = selectedChapter.verses.map((v) => {
        const vKey = `${v.book}-${v.chapter}-${v.verse}`;
        return {
          ...v,
          comment: vKey === verseKey ? comment : newComments[vKey] || "",
        };
      });

      setSelectedChapter({
        ...selectedChapter,
        verses: updatedVerses,
      });
    }

    setIsSaving(false);
  };

  // 현재 선택된 장의 하이라이트 상태 업데이트
  const updateChapterHighlights = () => {
    if (!selectedChapter) return;

    const updatedVerses = selectedChapter.verses.map((verse) => {
      const verseKey = `${verse.book}-${verse.chapter}-${verse.verse}`;
      return {
        ...verse,
        isHighlighted: highlights[verseKey] || false,
      };
    });

    setSelectedChapter({
      ...selectedChapter,
      verses: updatedVerses,
    });
  };

  // 현재 선택된 장의 코멘트 상태 업데이트
  const updateChapterComments = () => {
    if (!selectedChapter) return;

    const updatedVerses = selectedChapter.verses.map((verse) => {
      const verseKey = `${verse.book}-${verse.chapter}-${verse.verse}`;
      return {
        ...verse,
        comment: comments[verseKey] || "",
      };
    });

    setSelectedChapter({
      ...selectedChapter,
      verses: updatedVerses,
    });
  };

  // 장 선택 시 하이라이트 및 코멘트 데이터 적용
  const applyUserDataToChapter = (chapter: Chapter): Chapter => {
    console.log("하이라이트 데이터 적용 중...", chapter.book, chapter.chapter);
    console.log("현재 저장된 하이라이트 수:", Object.keys(highlights).length);

    const updatedVerses = chapter.verses.map((verse) => {
      const verseKey = `${verse.book}-${verse.chapter}-${verse.verse}`;
      const isHighlighted = highlights[verseKey] || false;
      const comment = comments[verseKey] || "";

      if (isHighlighted) {
        console.log(`하이라이트 적용: ${verseKey}`);
      }

      return {
        ...verse,
        isHighlighted,
        comment,
      };
    });

    return {
      ...chapter,
      verses: updatedVerses,
    };
  };

  // 파일 내용 로드 함수
  const loadFileContent = async (filename: string) => {
    // 테스트 모드 사용 (실제 환경에서는 파일에서 로드)
    const USE_TEST_MODE = false;

    if (USE_TEST_MODE) {
      console.log(`테스트 모드 - 가상 데이터 사용: ${filename}`);

      // 테스트용 하드코딩된 데이터 (실제 데이터와 동일한 형식으로)
      const testData: Record<string, string> = {
        "1-01창세기.txt":
          "창1:1 태초에 하나님이 천지를 창조하시니라\n" +
          "창1:2 땅이 혼돈하고 공허하며\n" +
          "창2:1 천지와 만물이 다 이루어지니라\n" +
          "창3:1 그런데 뱀은 여호와 하나님이\n",
        "1-02출애굽기.txt":
          "출1:1 야곱과 함께 각각 권속을 데리고\n" +
          "출1:2 르우벤과 시므온과 레위와 유다와\n" +
          "출2:1 레위 가문의 한 남자가\n",
        "1-03레위기.txt":
          "레1:1 여호와께서 모세를 부르시고\n" +
          "레2:1 누구든지 소제의 예물을\n",
      };

      // 기본값 제공
      const defaultData = `${extractBookName(filename)}1:1 ${extractBookName(
        filename
      )}의 첫 번째 장 첫 번째 절입니다.\n${extractBookName(
        filename
      )}2:1 ${extractBookName(filename)}의 두 번째 장 첫 번째 절입니다.`;

      return testData[filename] || defaultData;
    }

    try {
      // 실제 환경에서는 서버에서 데이터를 가져옵니다
      // 이 예시에서는 public 폴더에 있는 파일에서 데이터를 가져옵니다
      const filePath = `${process.env.PUBLIC_URL}/data/${filename}`;
      console.log(`파일 로드 시도: ${filePath}`);
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(
          `${filename} 파일을 불러오는데 실패했습니다. 상태: ${response.status}`
        );
      }

      // 텍스트 디코딩 처리
      const buffer = await response.arrayBuffer();

      // EUC-KR 인코딩 시도
      try {
        const decoder = new TextDecoder("euc-kr");
        const text = decoder.decode(buffer);
        console.log(
          `파일 ${filename} 로드 성공 (EUC-KR 인코딩): ${text.substring(
            0,
            100
          )}...`
        );
        return text;
      } catch (encError) {
        console.warn(`EUC-KR 디코딩 실패, UTF-8로 시도합니다:`, encError);

        // UTF-8로 대체 시도
        const decoder = new TextDecoder("utf-8");
        const text = decoder.decode(buffer);
        console.log(
          `파일 ${filename} 로드 성공 (UTF-8 인코딩): ${text.substring(
            0,
            100
          )}...`
        );
        return text;
      }
    } catch (err) {
      console.error(`${filename} 로드 오류:`, err);
      // 임시 데이터 - 실제 앱에서는 제거하고 오류 처리를 해야 합니다
      const dummyContent = `${extractBookName(filename)}1:1 ${extractBookName(
        filename
      )}의 첫 번째 장 첫 번째 절입니다.\n${extractBookName(
        filename
      )}2:1 ${extractBookName(
        filename
      )}의 두 번째 장 첫 번째 절입니다.\n${extractBookName(
        filename
      )}3:1 ${extractBookName(filename)}의 세 번째 장 첫 번째 절입니다.`;
      console.log(`임시 데이터 사용: ${dummyContent}`);
      return dummyContent;
    }
  };

  // 모든 파일 로드
  useEffect(() => {
    const loadAllFiles = async () => {
      setLoading(true);
      try {
        const contentMap: Record<string, string> = {};

        console.log("모든 파일 로드 시작");

        // 모든 파일을 비동기적으로 로드
        await Promise.all(
          BIBLE_FILES.map(async (filename) => {
            const content = await loadFileContent(filename);
            contentMap[filename] = content;
          })
        );

        setFileContents(contentMap);

        // 책 목록 생성
        const booksList = createBookList(BIBLE_FILES, contentMap);
        console.log("생성된 책 목록:", booksList);
        setBooks(booksList);
      } catch (err) {
        console.error("파일 로드 중 오류:", err);
        setError("성경 데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadAllFiles();
  }, []);

  // 책 선택 함수
  const selectBook = (bookId: string) => {
    const book = books.find((b) => b.id === bookId);
    if (book) {
      setSelectedBook(book);
      setSelectedChapter(null);
    }
  };

  // 장 선택 함수
  const selectChapter = async (bookId: string, chapterNum: number) => {
    setLoading(true);
    try {
      // 책 정보 확인
      const book = books.find((b) => b.id === bookId);
      if (!book) {
        setError(`${bookId} 책을 찾을 수 없습니다`);
        setLoading(false);
        return;
      }

      // 책이 로드되었는지 확인
      const fileKey = BIBLE_FILES.find((f) => f.includes(bookId));
      if (!fileKey || !fileContents[fileKey]) {
        // 파일 내용이 없으면 로드
        if (fileKey && !fileContents[fileKey]) {
          try {
            const content = await loadBookText(bookId);
            setFileContents((prev) => ({ ...prev, [fileKey]: content }));
            const chapterData = parseBookText(content, bookId);

            // 장 데이터에서 선택한 장만 필터링
            const selectedChapterData = chapterData.find(
              (c) => c.chapter === chapterNum
            );
            if (!selectedChapterData) {
              throw new Error(`${bookId} ${chapterNum}장을 찾을 수 없습니다`);
            }

            // 하이라이트 및 코멘트 적용
            const updatedChapter = applyUserDataToChapter(selectedChapterData);
            setSelectedChapter(updatedChapter);
          } catch (err) {
            console.error(`${bookId} 로드 중 오류:`, err);
            setError(`${bookId} 책 로드 중 오류가 발생했습니다`);
          }
        } else {
          setError(`${bookId} 책의 파일을 찾을 수 없습니다`);
        }
      } else {
        // 이미 로드된 파일에서 장 데이터 파싱
        const content = fileContents[fileKey];
        const chapterData = parseBookText(content, bookId);

        // 장 데이터에서 선택한 장만 필터링
        const selectedChapterData = chapterData.find(
          (c) => c.chapter === chapterNum
        );
        if (!selectedChapterData) {
          throw new Error(`${bookId} ${chapterNum}장을 찾을 수 없습니다`);
        }

        // 하이라이트 및 코멘트 적용
        const updatedChapter = applyUserDataToChapter(selectedChapterData);
        setSelectedChapter(updatedChapter);
      }

      // 만약 로그인한 사용자가 있으면 해당 장의 노트를 DB에서 로드
      if (user) {
        await loadChapterNotesFromDatabase(bookId, chapterNum);

        // 새로 로드된 노트를 현재 선택된 장의 구절들에 적용
        if (selectedChapter) {
          const updatedVerses = selectedChapter.verses.map((verse) => {
            const verseKey = `${verse.book}-${verse.chapter}-${verse.verse}`;
            return {
              ...verse,
              comment: comments[verseKey] || "",
            };
          });

          setSelectedChapter((prev) =>
            prev
              ? {
                  ...prev,
                  verses: updatedVerses,
                }
              : null
          );
        }
      }
    } catch (err) {
      console.error(`장 선택 중 오류:`, err);
      setError(`${bookId} ${chapterNum}장 로드 중 오류가 발생했습니다`);
    } finally {
      setLoading(false);
    }
  };

  // 성경책을 검색합니다.
  const searchBooks = (query: string) => {
    if (!query.trim()) return books;
    return books.filter((book) =>
      book.name.toLowerCase().includes(query.toLowerCase())
    );
  };

  /**
   * 성경 책의 텍스트 파일을 로드합니다.
   * @param bookId 책 ID
   * @returns 해당 책의 텍스트 내용
   */
  const loadBookText = async (bookId: string): Promise<string> => {
    try {
      const book = books.find((b) => b.id === bookId);
      if (!book) {
        throw new Error(`책을 찾을 수 없습니다: ${bookId}`);
      }

      // 해당 책에 맞는 파일명 찾기
      const filename = BIBLE_FILES.find(
        (file) => extractBookName(file) === bookId
      );
      if (!filename) {
        throw new Error(`${bookId}에 해당하는 파일을 찾을 수 없습니다.`);
      }

      const filePath = `${process.env.PUBLIC_URL}/data/${filename}`;

      console.log(`파일 로드 시도: ${filePath}`);

      const response = await fetch(filePath);

      if (!response.ok) {
        throw new Error(
          `파일을 로드할 수 없습니다: ${filePath} (${response.status} ${response.statusText})`
        );
      }

      // 텍스트 디코딩 처리
      const buffer = await response.arrayBuffer();

      // EUC-KR 인코딩 시도
      try {
        const decoder = new TextDecoder("euc-kr");
        const text = decoder.decode(buffer);

        // 데이터 유효성 검사
        if (!text || text.trim().length === 0) {
          console.warn(`${book.name} 파일이 비어 있습니다.`);
          return `${book.name} 1:1 이것은 빈 파일을 위한 가상 데이터입니다.`;
        }

        console.log(
          `${book.name} 파일 로드 완료 (EUC-KR 인코딩) - 길이: ${text.length}자`
        );
        return text;
      } catch (encError) {
        console.warn(`EUC-KR 디코딩 실패, UTF-8로 시도합니다:`, encError);

        // UTF-8로 대체 시도
        const decoder = new TextDecoder("utf-8");
        const text = decoder.decode(buffer);

        if (!text || text.trim().length === 0) {
          console.warn(`${book.name} 파일이 비어 있습니다.`);
          return `${book.name} 1:1 이것은 빈 파일을 위한 가상 데이터입니다.`;
        }

        console.log(
          `${book.name} 파일 로드 완료 (UTF-8 인코딩) - 길이: ${text.length}자`
        );
        return text;
      }
    } catch (error) {
      console.error(`책 텍스트 로드 오류:`, error);

      // 오류 발생 시 가상 데이터 생성
      const book = books.find((b) => b.id === bookId) || {
        id: bookId,
        name: bookId,
      };
      return generateVirtualBookData(book.name);
    }
  };

  /**
   * 가상 책 데이터를 생성합니다 (실제 데이터가 없을 때 사용)
   */
  const generateVirtualBookData = (bookName: string): string => {
    let result = "";
    const chapterCount =
      bookName === "창세기"
        ? 50
        : bookName === "출애굽기"
        ? 40
        : bookName === "레위기"
        ? 27
        : bookName === "민수기"
        ? 36
        : bookName === "신명기"
        ? 34
        : 10;

    const shortName = getShortBookName(bookName);

    for (let chapter = 1; chapter <= chapterCount; chapter++) {
      for (let verse = 1; verse <= 10; verse++) {
        result += `${shortName}${chapter}:${verse} 이것은 ${bookName} ${chapter}장 ${verse}절의 가상 데이터입니다.\n`;
      }
    }

    return result;
  };

  /**
   * 책 이름의 짧은 표기를 반환합니다.
   * @param bookName 책 이름
   * @returns 짧은 책 이름 (예: '창' 또는 '출')
   */
  const getShortBookName = (bookName: string): string => {
    const shortNames: Record<string, string> = {
      창세기: "창",
      출애굽기: "출",
      레위기: "레",
      민수기: "민",
      신명기: "신",
      여호수아: "수",
      사사기: "삿",
      룻기: "룻",
      사무엘상: "삼상",
      사무엘하: "삼하",
      열왕기상: "왕상",
      열왕기하: "왕하",
      역대상: "대상",
      역대하: "대하",
      에스라: "스",
      느헤미야: "느",
      에스더: "에",
      욥기: "욥",
      시편: "시",
      잠언: "잠",
      전도서: "전",
      아가: "아",
      이사야: "사",
      예레미야: "렘",
      예레미야애가: "애",
      에스겔: "겔",
      다니엘: "단",
      호세아: "호",
      요엘: "욜",
      아모스: "암",
      오바댜: "옵",
      요나: "욘",
      미가: "미",
      나훔: "나",
      하박국: "합",
      스바냐: "습",
      학개: "학",
      스가랴: "슥",
      말라기: "말",
      마태복음: "마",
      마가복음: "막",
      누가복음: "눅",
      요한복음: "요",
      사도행전: "행",
      로마서: "롬",
      고린도전서: "고전",
      고린도후서: "고후",
      갈라디아서: "갈",
      에베소서: "엡",
      빌립보서: "빌",
      골로새서: "골",
      데살로니가전서: "살전",
      데살로니가후서: "살후",
      디모데전서: "딤전",
      디모데후서: "딤후",
      디도서: "딛",
      빌레몬서: "몬",
      히브리서: "히",
      야고보서: "약",
      베드로전서: "벧전",
      베드로후서: "벧후",
      요한일서: "요일",
      요한이서: "요이",
      요한삼서: "요삼",
      유다서: "유",
      요한계시록: "계",
    };

    return shortNames[bookName] || bookName.substring(0, 1);
  };

  return {
    books,
    selectedBook,
    selectedChapter,
    loading,
    error,
    isSaving,
    selectBook,
    selectChapter,
    searchBooks,
    loadBookText,
    generateVirtualBookData,
    toggleHighlight,
    addComment,
  };
};

export default useBible;
