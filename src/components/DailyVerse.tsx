import React, { useState, useEffect } from "react";
import { DailyVerse as DailyVerseType } from "../types/bible";
import { dailyVerseUtils } from "../utils/supabase";
import "../styles/DailyVerse.css";

const DailyVerse: React.FC = () => {
  const [dailyVerse, setDailyVerse] = useState<DailyVerseType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [recentDates, setRecentDates] = useState<string[]>([]);

  // 오늘의 말씀 로드
  useEffect(() => {
    const loadTodayVerse = async () => {
      setIsLoading(true);
      const data = await dailyVerseUtils.getTodayVerse();
      setDailyVerse(data);
      setIsLoading(false);
    };

    loadTodayVerse();
  }, []);

  // 최근 7일간의 말씀 날짜 목록 로드
  useEffect(() => {
    const loadRecentDates = async () => {
      const recentVerses = await dailyVerseUtils.getRecentVerses(7);
      setRecentDates(recentVerses.map((verse) => verse.date));
    };

    loadRecentDates();
  }, []);

  // 특정 날짜의 말씀 로드
  const loadVerseByDate = async (date: string) => {
    setIsLoading(true);
    const data = await dailyVerseUtils.getVerseByDate(date);
    setDailyVerse(data);
    setIsLoading(false);
  };

  // 이전 날짜 말씀
  const handlePrevious = () => {
    const currentIndex = recentDates.indexOf(dailyVerse?.date || "");
    if (currentIndex < recentDates.length - 1) {
      loadVerseByDate(recentDates[currentIndex + 1]);
    }
  };

  // 다음 날짜 말씀
  const handleNext = () => {
    const currentIndex = recentDates.indexOf(dailyVerse?.date || "");
    if (currentIndex > 0) {
      loadVerseByDate(recentDates[currentIndex - 1]);
    }
  };

  // 날짜 포맷 함수
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  // 공유 기능
  const handleShare = () => {
    if (!dailyVerse) return;

    const shareText = `
오늘의 말씀 (${dailyVerse.date})
${dailyVerse.verse.book} ${dailyVerse.verse.chapter}:${dailyVerse.verse.verse}
"${dailyVerse.verse.content}"

${dailyVerse.reflection}

#성경함께읽기 #오늘의말씀
`;

    // navigator.clipboard API 사용 (보안상의 이유로 HTTPS에서만 작동)
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(shareText)
        .then(() => alert("클립보드에 복사되었습니다."))
        .catch((err) => console.error("클립보드 복사 실패:", err));
    } else {
      // 대체 방법
      const textArea = document.createElement("textarea");
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand("copy");
        alert("클립보드에 복사되었습니다.");
      } catch (err) {
        console.error("클립보드 복사 실패:", err);
      }

      document.body.removeChild(textArea);
    }
  };

  if (isLoading) {
    return <div className="daily-verse-loading">말씀을 불러오는 중...</div>;
  }

  if (!dailyVerse) {
    return <div className="daily-verse-error">말씀을 불러올 수 없습니다.</div>;
  }

  return (
    <div className="daily-verse-container">
      <div className="daily-verse-header">
        <h2>오늘의 말씀</h2>
        <div className="daily-verse-date">{formatDate(dailyVerse.date)}</div>
        {dailyVerse.theme && (
          <div className="daily-verse-theme">{dailyVerse.theme}</div>
        )}
      </div>

      <div className="daily-verse-content">
        <div className="verse-reference">
          {dailyVerse.verse.book} {dailyVerse.verse.chapter}:
          {dailyVerse.verse.verse}
        </div>
        <div className="verse-text">"{dailyVerse.verse.content}"</div>
      </div>

      <div className="daily-verse-reflection">
        <h3>묵상</h3>
        <p>{dailyVerse.reflection}</p>
      </div>

      <div className="daily-verse-actions">
        <button
          className="verse-nav-btn"
          onClick={handlePrevious}
          disabled={
            recentDates.indexOf(dailyVerse.date) === recentDates.length - 1
          }
        >
          이전 말씀
        </button>
        <button className="verse-share-btn" onClick={handleShare}>
          공유하기
        </button>
        <button
          className="verse-nav-btn"
          onClick={handleNext}
          disabled={recentDates.indexOf(dailyVerse.date) === 0}
        >
          다음 말씀
        </button>
      </div>
    </div>
  );
};

export default DailyVerse;
