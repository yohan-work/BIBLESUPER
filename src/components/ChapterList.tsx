import React from 'react';
import { Book } from '../types/bible';
import '../styles/ChapterList.css'; // 스타일 파일은 나중에 만들 예정입니다

interface ChapterListProps {
  book: Book;
  onSelectChapter: (bookId: string, chapterNum: number) => void;
  onBack: () => void;
}

const ChapterList: React.FC<ChapterListProps> = ({ book, onSelectChapter, onBack }) => {
  return (
    <div className="chapter-list-container">
      <div className="chapter-list-header">
        <button className="back-button" onClick={onBack}>
          &lt; 뒤로
        </button>
        <h2>{book.name}</h2>
      </div>
      
      <div className="chapters-grid">
        {book.chapters.map((chapterNum) => (
          <div 
            key={chapterNum} 
            className="chapter-card"
            onClick={() => onSelectChapter(book.id, chapterNum)}
          >
            <div className="chapter-number">{chapterNum}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChapterList; 