import React, { useState } from 'react';
import { Book } from '../types/bible';
import '../styles/BookList.css'; // 스타일 파일은 나중에 만들 예정입니다

interface BookListProps {
  books: Book[];
  onSelectBook: (bookId: string) => void;
}

const BookList: React.FC<BookListProps> = ({ books, onSelectBook }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTestament, setActiveTestament] = useState<'all' | 'old' | 'new'>('all');
  
  // 검색어와 선택된 성경에 따라 책 필터링
  const filteredBooks = books
    .filter(book => 
      activeTestament === 'all' || book.testament === activeTestament
    )
    .filter(book => 
      book.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
  return (
    <div className="book-list-container">
      <div className="book-list-header">
        <h2>성경</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="책 이름으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="testament-tabs">
          <button 
            className={`tab ${activeTestament === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTestament('all')}
          >
            전체
          </button>
          <button 
            className={`tab ${activeTestament === 'old' ? 'active' : ''}`}
            onClick={() => setActiveTestament('old')}
          >
            구약
          </button>
          <button 
            className={`tab ${activeTestament === 'new' ? 'active' : ''}`}
            onClick={() => setActiveTestament('new')}
          >
            신약
          </button>
        </div>
      </div>
      
      <div className="books-grid">
        {filteredBooks.map((book) => (
          <div 
            key={book.id} 
            className="book-card"
            onClick={() => onSelectBook(book.id)}
          >
            <div className="book-name">{book.name}</div>
            <div className="book-chapters">
              {book.chapters.length > 0 
                ? `${book.chapters.length}장` 
                : '로딩 중...'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookList; 