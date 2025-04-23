import React, { useState } from 'react';
import { Chapter } from '../types/bible';
import '../styles/VerseList.css'; // 스타일 파일은 나중에 만들 예정입니다

interface VerseListProps {
  chapter: Chapter;
  onBack: () => void;
}

const VerseList: React.FC<VerseListProps> = ({ chapter, onBack }) => {
  const [fontSize, setFontSize] = useState(16); // 기본 폰트 크기
  
  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24)); // 최대 크기 제한
  };
  
  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12)); // 최소 크기 제한
  };
  
  return (
    <div className="verse-list-container">
      <div className="verse-list-header">
        <button className="back-button" onClick={onBack}>
          &lt; 뒤로
        </button>
        <h2>{chapter.book} {chapter.chapter}장</h2>
        <div className="font-size-controls">
          <button onClick={decreaseFontSize}>A-</button>
          <button onClick={increaseFontSize}>A+</button>
        </div>
      </div>
      
      <div className="verses-content" style={{ fontSize: `${fontSize}px` }}>
        {chapter.verses.map((verse) => (
          <div key={verse.verse} className="verse-item">
            <span className="verse-number">{verse.verse}</span>
            <span className="verse-text">{verse.content}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VerseList; 