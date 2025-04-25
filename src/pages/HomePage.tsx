import React, { useState } from "react";
import BookList from "../components/BookList";
import ChapterList from "../components/ChapterList";
import VerseList from "../components/VerseList";
import Header from "../components/Header";
import DailyVerse from "../components/DailyVerse";
import useBible from "../hooks/useBible";
import "../styles/HomePage.css";

enum View {
  BOOKS,
  CHAPTERS,
  VERSES,
  DAILY_VERSE,
}

const HomePage: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.BOOKS);
  const [focusVerseNum, setFocusVerseNum] = useState<number | undefined>(
    undefined
  );
  const {
    books,
    selectedBook,
    selectedChapter,
    loading,
    error,
    isSaving,
    selectBook,
    selectChapter,
    toggleHighlight,
    addComment,
  } = useBible();

  const handleSelectBook = (bookId: string) => {
    selectBook(bookId);
    setCurrentView(View.CHAPTERS);
    setFocusVerseNum(undefined);
  };

  const handleSelectChapter = (bookId: string, chapterNum: number) => {
    selectChapter(bookId, chapterNum);
    setCurrentView(View.VERSES);
    setFocusVerseNum(undefined);
  };

  const handleBackFromChapters = () => {
    setCurrentView(View.BOOKS);
    setFocusVerseNum(undefined);
  };

  const handleBackFromVerses = () => {
    setCurrentView(View.CHAPTERS);
    setFocusVerseNum(undefined);
  };

  const handleShowDailyVerse = () => {
    setCurrentView(View.DAILY_VERSE);
    setFocusVerseNum(undefined);
  };

  const handleBackFromDailyVerse = () => {
    setCurrentView(View.BOOKS);
    setFocusVerseNum(undefined);
  };

  // 장 탐색 기능 - 이전/다음 장으로 이동
  const handleNavigateChapter = (bookId: string, chapterNum: number) => {
    selectChapter(bookId, chapterNum);
    setFocusVerseNum(undefined);
    // View는 그대로 VERSES를 유지하여 장 전환 시 목록으로 돌아가지 않음
  };

  // 구절 키를 통한 이동 기능 추가 (RecentComments에서 사용)
  const handleNavigateToVerse = (verseKey: string) => {
    const [bookId, chapterStr, verseStr] = verseKey.split("-");
    const chapterNum = parseInt(chapterStr);
    const verseNum = parseInt(verseStr);

    // 구절 번호를 상태로 저장
    setFocusVerseNum(verseNum);

    // 선택된 책과 장이 이미 일치하는 경우 보기만 변경
    if (
      selectedBook?.id === bookId &&
      selectedChapter?.chapter === chapterNum
    ) {
      setCurrentView(View.VERSES);
      return;
    }

    // 책과 장이 다른 경우 순차적으로 선택 후 이동
    selectBook(bookId);
    setTimeout(() => {
      selectChapter(bookId, chapterNum);
      setCurrentView(View.VERSES);
    }, 100);
  };

  return (
    <div className="home-container">
      <Header onNavigateToVerse={handleNavigateToVerse} />
      <main className="main-content">
        {loading && <div className="loading">로딩 중...</div>}
        {error && <div className="error">{error}</div>}

        {currentView === View.BOOKS && (
          <>
            <div className="homepage-actions">
              <button
                className="show-daily-verse-btn"
                onClick={handleShowDailyVerse}
              >
                오늘의 말씀 보기
              </button>
            </div>
            <BookList books={books} onSelectBook={handleSelectBook} />
          </>
        )}

        {currentView === View.CHAPTERS && selectedBook && (
          <ChapterList
            book={selectedBook}
            onSelectChapter={handleSelectChapter}
            onBack={handleBackFromChapters}
          />
        )}

        {currentView === View.VERSES && selectedChapter && selectedBook && (
          <VerseList
            chapter={selectedChapter}
            book={selectedBook}
            onBack={handleBackFromVerses}
            onToggleHighlight={toggleHighlight}
            onAddComment={addComment}
            onNavigateChapter={handleNavigateChapter}
            focusVerseNum={focusVerseNum}
            isSaving={isSaving}
          />
        )}

        {currentView === View.DAILY_VERSE && (
          <div className="daily-verse-page">
            <button
              className="back-to-bible-btn"
              onClick={handleBackFromDailyVerse}
            >
              &lt; 성경으로 돌아가기
            </button>
            <DailyVerse />
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;
