import React, { useState, useEffect } from 'react';
import { Chapter, Verse } from '../types/bible';
import '../styles/VerseList.css'; // 스타일 파일은 나중에 만들 예정입니다

interface VerseListProps {
  chapter: Chapter;
  onBack: () => void;
  onToggleHighlight: (verse: Verse) => void;
  onAddComment: (verse: Verse, comment: string) => void;
}

const VerseList: React.FC<VerseListProps> = ({ chapter, onBack, onToggleHighlight, onAddComment }) => {
  const [fontSize, setFontSize] = useState(16); // 기본 폰트 크기
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [verses, setVerses] = useState<Verse[]>(chapter.verses);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [currentComment, setCurrentComment] = useState('');
  
  // 구절에 대한 고유 키 생성 함수
  const getVerseKey = (verse: Verse): string => {
    return `${verse.book}-${verse.chapter}-${verse.verse}`;
  };
  
  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24)); // 최대 크기 제한
  };
  
  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12)); // 최소 크기 제한
  };
  
  const handleVerseClick = (verse: Verse) => {
    setSelectedVerse(verse);
    setShowCommentModal(true);
    setCurrentComment(verse.comment || '');
  };
  
  const toggleHighlight = () => {
    if (!selectedVerse) return;
    
    // useBible의 toggleHighlight 함수 호출
    onToggleHighlight(selectedVerse);
    
    // 현재 UI 업데이트를 위한 로컬 상태 업데이트
    const updatedVerses = verses.map(v => {
      if (getVerseKey(v) === getVerseKey(selectedVerse)) {
        return {
          ...v,
          isHighlighted: !v.isHighlighted
        };
      }
      return v;
    });
    
    setVerses(updatedVerses);
    setSelectedVerse({
      ...selectedVerse,
      isHighlighted: !selectedVerse.isHighlighted
    });
  };
  
  const saveComment = () => {
    if (!selectedVerse) return;
    
    // useBible의 addComment 함수 호출
    onAddComment(selectedVerse, currentComment);
    
    // 현재 UI 업데이트를 위한 로컬 상태 업데이트
    const updatedVerses = verses.map(v => {
      if (getVerseKey(v) === getVerseKey(selectedVerse)) {
        return {
          ...v,
          comment: currentComment
        };
      }
      return v;
    });
    
    setVerses(updatedVerses);
    setSelectedVerse({
      ...selectedVerse,
      comment: currentComment
    });
    setShowCommentModal(false);
  };
  
  const closeModal = () => {
    setShowCommentModal(false);
  };
  
  // 새로운 chapter prop이 들어오면 verses 상태 업데이트
  useEffect(() => {
    setVerses(chapter.verses);
  }, [chapter]);
  
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
        {verses.map((verse) => (
          <div 
            key={getVerseKey(verse)} 
            className={`verse-item ${verse.isHighlighted ? 'highlighted' : ''}`}
            onClick={() => handleVerseClick(verse)}
          >
            <span className="verse-number">{verse.verse}</span>
            <span className="verse-text">{verse.content}</span>
            {verse.comment && <span className="comment-indicator">💬</span>}
          </div>
        ))}
      </div>
      
      {showCommentModal && selectedVerse && (
        <div className="comment-modal">
          <div className="comment-modal-content">
            <h3>{selectedVerse.book} {selectedVerse.chapter}:{selectedVerse.verse}</h3>
            <div className="verse-preview">
              {selectedVerse.content}
            </div>
            
            <div className="action-buttons">
              <button 
                className={`highlight-button ${selectedVerse.isHighlighted ? 'active' : ''}`}
                onClick={toggleHighlight}
              >
                {selectedVerse.isHighlighted ? '형광펜 제거' : '형광펜 표시'}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default VerseList; 