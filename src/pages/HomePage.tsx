import React, { useState } from 'react';
import BookList from '../components/BookList';
import ChapterList from '../components/ChapterList';
import VerseList from '../components/VerseList';
import Header from '../components/Header';
import useBible from '../hooks/useBible';
import '../styles/HomePage.css'; // 스타일 파일은 나중에 만들 예정입니다

enum View {
  BOOKS,
  CHAPTERS,
  VERSES
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
    addComment
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
  
  return (
    <div className="home-container">
      <Header />
      <main className="main-content">
        {loading && <div className="loading">로딩 중...</div>}
        {error && <div className="error">{error}</div>}
        
        {currentView === View.BOOKS && (
          <BookList books={books} onSelectBook={handleSelectBook} />
        )}
        
        {currentView === View.CHAPTERS && selectedBook && (
          <ChapterList 
            book={selectedBook} 
            onSelectChapter={handleSelectChapter}
            onBack={handleBackFromChapters}
          />
        )}
        
        {currentView === View.VERSES && selectedChapter && (
          <VerseList 
            chapter={selectedChapter}
            onBack={handleBackFromVerses}
            onToggleHighlight={toggleHighlight}
            onAddComment={addComment}
          />
        )}
      </main>
    </div>
  );
};

export default HomePage; 