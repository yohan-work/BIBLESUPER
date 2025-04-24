import React, { useState } from "react";
import BookList from "../components/BookList";
import ChapterList from "../components/ChapterList";
import VerseList from "../components/VerseList";
import Header from "../components/Header";
import DailyVerse from "../components/DailyVerse";
import useBible from "../hooks/useBible";
import "../styles/HomePage.css"; // 스타일 파일은 나중에 만들 예정입니다

enum View {
  BOOKS,
  CHAPTERS,
  VERSES,
  DAILY_VERSE,
}

const HomePage: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.BOOKS);
  const {
    books,
    selectedBook,
    selectedChapter,
    loading,
    error,
    selectBook,
    selectChapter,
    toggleHighlight,
    addComment,
  } = useBible();

  const handleSelectBook = (bookId: string) => {
    selectBook(bookId);
    setCurrentView(View.CHAPTERS);
  };

  const handleSelectChapter = (bookId: string, chapterNum: number) => {
    selectChapter(bookId, chapterNum);
    setCurrentView(View.VERSES);
  };

  const handleBackFromChapters = () => {
    setCurrentView(View.BOOKS);
  };

  const handleBackFromVerses = () => {
    setCurrentView(View.CHAPTERS);
  };

  const handleShowDailyVerse = () => {
    setCurrentView(View.DAILY_VERSE);
  };

  const handleBackFromDailyVerse = () => {
    setCurrentView(View.BOOKS);
  };

  // 장 탐색 기능 - 이전/다음 장으로 이동
  const handleNavigateChapter = (bookId: string, chapterNum: number) => {
    selectChapter(bookId, chapterNum);
    // View는 그대로 VERSES를 유지하여 장 전환 시 목록으로 돌아가지 않음
  };

  return (
    <div className="home-container">
      <Header />
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
