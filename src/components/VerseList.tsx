import React, { useState, useEffect, useRef, useCallback } from "react";
import { Chapter, Verse, Book } from "../types/bible";
import CommentSection from "./CommentSection";
import { commentUtils } from "../utils/supabase";
import "../styles/VerseList.css"; // 스타일 파일은 나중에 만들 예정입니다

interface VerseListProps {
  chapter: Chapter;
  onBack: () => void;
  onToggleHighlight: (verse: Verse) => void;
  onAddComment: (verse: Verse, comment: string) => void;
  book?: Book; // 현재 선택된 책 정보 (선택사항)
  onNavigateChapter?: (bookId: string, chapterNum: number) => void; // 장 이동 함수
  focusVerseNum?: number; // 포커스할 구절 번호 (옵션)
}

const VerseList: React.FC<VerseListProps> = ({
  chapter,
  onBack,
  onToggleHighlight,
  onAddComment,
  book,
  onNavigateChapter,
  focusVerseNum,
}) => {
  const [fontSize, setFontSize] = useState(16); // 기본 폰트 크기
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [verses, setVerses] = useState<Verse[]>(chapter.verses);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [currentComment, setCurrentComment] = useState("");
  const [showPublicComments, setShowPublicComments] = useState(false);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(
    {}
  );
  const [focusedVerseKey, setFocusedVerseKey] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const verseRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 구절에 대한 고유 키 생성 함수
  const getVerseKey = (verse: Verse): string => {
    return `${verse.book}-${verse.chapter}-${verse.verse}`;
  };

  // ref 설정 함수
  const setVerseRef = useCallback(
    (element: HTMLDivElement | null, verseKey: string) => {
      if (verseRefs.current) {
        verseRefs.current[verseKey] = element;
      }
    },
    []
  );

  // 댓글 수 로드
  useEffect(() => {
    const loadCommentCounts = async () => {
      const counts = await commentUtils.getCommentCounts(
        chapter.book,
        chapter.chapter
      );
      setCommentCounts(counts);
    };

    loadCommentCounts();
  }, [chapter.book, chapter.chapter]);

  // 자동 포커스 효과 (URL 파라미터나 RecentComments 클릭 시)
  useEffect(() => {
    if (focusVerseNum && verses.length > 0) {
      // 포커스할 구절 찾기
      const verseToFocus = verses.find(
        (verse) => verse.verse === focusVerseNum
      );

      if (verseToFocus) {
        const key = getVerseKey(verseToFocus);
        setFocusedVerseKey(key);

        // DOM이 렌더링 된 후 스크롤 포지션 설정
        setTimeout(() => {
          scrollToVerse(key);

          // 5초 후 포커스 제거
          setTimeout(() => {
            setFocusedVerseKey(null);
          }, 5000);
        }, 300);
      }
    }
  }, [verses, focusVerseNum]);

  const scrollToVerse = (verseKey: string) => {
    if (verseRefs.current[verseKey]) {
      const verseElement = verseRefs.current[verseKey];
      if (verseElement) {
        verseElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const increaseFontSize = () => {
    setFontSize((prev) => Math.min(prev + 2, 24)); // 최대 크기 제한
  };

  const decreaseFontSize = () => {
    setFontSize((prev) => Math.max(prev - 2, 12)); // 최소 크기 제한
  };

  const handleVerseClick = (verse: Verse) => {
    setSelectedVerse(verse);
    setShowCommentModal(true);
    setCurrentComment(verse.comment || "");
    setShowPublicComments(false); // 처음에는 개인 코멘트 보기
  };

  const toggleHighlight = () => {
    if (!selectedVerse) return;

    // useBible의 toggleHighlight 함수 호출
    onToggleHighlight(selectedVerse);

    // 현재 UI 업데이트를 위한 로컬 상태 업데이트
    const updatedVerses = verses.map((v) => {
      if (getVerseKey(v) === getVerseKey(selectedVerse)) {
        return {
          ...v,
          isHighlighted: !v.isHighlighted,
        };
      }
      return v;
    });

    setVerses(updatedVerses);
    setSelectedVerse({
      ...selectedVerse,
      isHighlighted: !selectedVerse.isHighlighted,
    });
  };

  const saveComment = () => {
    if (!selectedVerse) return;

    // useBible의 addComment 함수 호출
    onAddComment(selectedVerse, currentComment);

    // 현재 UI 업데이트를 위한 로컬 상태 업데이트
    const updatedVerses = verses.map((v) => {
      if (getVerseKey(v) === getVerseKey(selectedVerse)) {
        return {
          ...v,
          comment: currentComment,
        };
      }
      return v;
    });

    setVerses(updatedVerses);
    setSelectedVerse({
      ...selectedVerse,
      comment: currentComment,
    });
    setShowCommentModal(false);
  };

  const closeModal = () => {
    setShowCommentModal(false);
  };

  // 스크롤을 맨 위로 이동시키는 함수
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // 이전 장으로 이동
  const goToPreviousChapter = () => {
    if (!onNavigateChapter) {
      onBack(); // 탐색 기능이 없으면 기본적으로 뒤로 가기
      return;
    }

    // 현재 장이 1장이면 이전 장으로 이동할 수 없음
    if (chapter.chapter > 1) {
      onNavigateChapter(chapter.book, chapter.chapter - 1);
      // 스크롤을 맨 위로 이동
      setTimeout(() => scrollToTop(), 100);
    }
  };

  // 다음 장으로 이동
  const goToNextChapter = () => {
    if (!onNavigateChapter || !book) {
      onBack(); // 탐색 기능이 없으면 기본적으로 뒤로 가기
      return;
    }

    // 책의 총 장 수를 알아내기 위해 book 객체 사용
    const totalChapters = book.chapters.length;

    // 마지막 장이 아니면 다음 장으로 이동
    if (chapter.chapter < totalChapters) {
      onNavigateChapter(chapter.book, chapter.chapter + 1);
      // 스크롤을 맨 위로 이동
      setTimeout(() => scrollToTop(), 100);
    }
  };

  // 새로운 chapter prop이 들어오면 verses 상태 업데이트 및 스크롤 최상단으로 이동
  useEffect(() => {
    setVerses(chapter.verses);
    if (!focusVerseNum) {
      scrollToTop();
    }
  }, [chapter, focusVerseNum]);

  // 현재 장이 책의 마지막 장인지 확인
  const isLastChapter = book ? chapter.chapter >= book.chapters.length : false;

  return (
    <div className="verse-list-container" ref={containerRef}>
      <div className="verse-list-header">
        <button className="back-button" onClick={onBack}>
          &lt; 뒤로
        </button>
        <h2>
          {chapter.book} {chapter.chapter}장
        </h2>
        <div className="font-size-controls">
          <button onClick={decreaseFontSize}>A-</button>
          <button onClick={increaseFontSize}>A+</button>
        </div>
      </div>

      <div className="verses-content" style={{ fontSize: `${fontSize}px` }}>
        {verses.map((verse) => {
          const verseKey = getVerseKey(verse);
          const commentCount = commentCounts[verseKey] || 0;
          const isFocused = focusedVerseKey === verseKey;

          return (
            <div
              key={verseKey}
              ref={(el) => setVerseRef(el, verseKey)}
              className={`verse-item ${
                verse.isHighlighted ? "highlighted" : ""
              } ${isFocused ? "verse-focused" : ""}`}
              onClick={() => handleVerseClick(verse)}
              id={`verse-${verse.verse}`}
            >
              <span className="verse-number">{verse.verse}</span>
              <span className="verse-text">{verse.content}</span>
              <div className="verse-indicators">
                {verse.comment && (
                  <span className="comment-indicator" title="개인 묵상">
                    💭
                  </span>
                )}
                {commentCount > 0 && (
                  <span
                    className="public-comment-indicator"
                    title={`${commentCount}개의 댓글`}
                  >
                    💬 {commentCount}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 네비게이션 버튼 */}
      <div className="verse-list-footer">
        <button
          className="nav-button prev-chapter-button"
          onClick={goToPreviousChapter}
          disabled={chapter.chapter <= 1}
        >
          이전 장
        </button>
        <button className="nav-button home-button" onClick={onBack}>
          목록
        </button>
        <button
          className="nav-button next-chapter-button"
          onClick={goToNextChapter}
          disabled={isLastChapter}
        >
          다음 장
        </button>
      </div>

      {showCommentModal && selectedVerse && (
        <div className="comment-modal">
          <div className="comment-modal-content">
            <div className="modal-header">
              <h3>
                {selectedVerse.book} {selectedVerse.chapter}:
                {selectedVerse.verse}
              </h3>
              <button className="close-button" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="verse-preview">{selectedVerse.content}</div>

            <div className="tabs">
              <button
                className={`tab-button ${!showPublicComments ? "active" : ""}`}
                onClick={() => setShowPublicComments(false)}
              >
                나의 묵상
              </button>
              <button
                className={`tab-button ${showPublicComments ? "active" : ""}`}
                onClick={() => setShowPublicComments(true)}
              >
                함께 나누기
              </button>
            </div>

            {!showPublicComments ? (
              // 개인 묵상 탭
              <>
                <div className="action-buttons">
                  <button
                    className={`highlight-button ${
                      selectedVerse.isHighlighted ? "active" : ""
                    }`}
                    onClick={toggleHighlight}
                  >
                    {selectedVerse.isHighlighted
                      ? "형광펜 제거"
                      : "형광펜 표시"}
                  </button>
                </div>

                <div className="comment-section">
                  <h4>나의 묵상</h4>
                  <textarea
                    value={currentComment}
                    onChange={(e) => setCurrentComment(e.target.value)}
                    placeholder="이 구절에 대한 생각을 적어보세요..."
                    rows={5}
                  />
                </div>

                <div className="modal-footer">
                  <button className="cancel-button" onClick={closeModal}>
                    취소
                  </button>
                  <button className="save-button" onClick={saveComment}>
                    저장
                  </button>
                </div>
              </>
            ) : (
              // 함께 나누기 탭
              <CommentSection
                verseKey={getVerseKey(selectedVerse)}
                bookName={selectedVerse.book}
                chapterNum={selectedVerse.chapter}
                verseNum={selectedVerse.verse}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VerseList;
