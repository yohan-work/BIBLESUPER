import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import { Comment } from "../types/bible";
import "../styles/RecentComments.css";

interface CommentWithDetails extends Comment {
  userName: string;
  profileImage?: string;
  bookName: string;
  chapterNum: number;
  verseNum: number;
}

interface RecentCommentsProps {
  onNavigateToVerse: (verseKey: string) => void;
  onClose: () => void;
}

const RecentComments: React.FC<RecentCommentsProps> = ({
  onNavigateToVerse,
  onClose,
}) => {
  const [recentComments, setRecentComments] = useState<CommentWithDetails[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentComments = async () => {
      setIsLoading(true);
      try {
        // Get the 5 most recent comments
        const { data, error } = await supabase
          .from("comments")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) {
          console.error("최근 댓글 로드 중 오류:", error);
          setRecentComments([]);
          return;
        }

        // Fetch user information for each comment
        const commentsWithDetails = await Promise.all(
          data.map(async (comment) => {
            // Extract book, chapter, verse from verse_key format (book-chapter-verse)
            const [bookId, chapterStr, verseStr] = comment.verse_key.split("-");
            const chapterNum = parseInt(chapterStr);
            const verseNum = parseInt(verseStr);

            // Get user profile info
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("name, profile_image")
              .eq("id", comment.user_id)
              .single();

            if (profileError) {
              console.error("프로필 정보 로드 중 오류:", profileError);
            }

            // Get book name (if available)
            let bookName = bookId;
            try {
              // This assumes you have a books table with id and name columns
              const { data: bookData, error: bookError } = await supabase
                .from("books")
                .select("name")
                .eq("id", bookId)
                .single();

              if (!bookError && bookData) {
                bookName = bookData.name;
              }
            } catch (error) {
              console.error("책 정보 로드 중 오류:", error);
            }

            return {
              id: comment.id,
              userId: comment.user_id,
              verseKey: comment.verse_key,
              content: comment.content,
              timestamp: new Date(comment.created_at).getTime(),
              likes: comment.likes || [],
              userName: profile?.name || "익명",
              profileImage: profile?.profile_image,
              bookName,
              chapterNum,
              verseNum,
            };
          })
        );

        setRecentComments(commentsWithDetails);
      } catch (error) {
        console.error("최근 댓글 로드 중 오류:", error);
        setRecentComments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentComments();
  }, []);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateContent = (content: string, maxLength = 50) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + "...";
  };

  const handleCommentClick = (verseKey: string) => {
    onNavigateToVerse(verseKey);
    onClose();
  };

  return (
    <div className="recent-comments-container">
      <div className="recent-comments-header">
        <h3>최근 댓글</h3>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="recent-comments-list">
        {isLoading ? (
          <div className="loading">댓글을 불러오는 중...</div>
        ) : recentComments.length > 0 ? (
          recentComments.map((comment) => (
            <div
              key={comment.id}
              className="recent-comment-item"
              onClick={() => handleCommentClick(comment.verseKey)}
            >
              <div className="comment-header">
                <div className="user-info">
                  {comment.profileImage ? (
                    <img
                      src={comment.profileImage}
                      alt={`${comment.userName} 프로필`}
                      className="profile-image"
                    />
                  ) : (
                    <div className="profile-initial">
                      {comment.userName[0].toUpperCase()}
                    </div>
                  )}
                  <span className="user-name">{comment.userName}</span>
                </div>
                <span className="comment-date">
                  {formatDate(comment.timestamp)}
                </span>
              </div>

              <div className="comment-content">
                <p>{truncateContent(comment.content)}</p>
              </div>

              <div className="verse-reference">
                <span>
                  {comment.bookName} {comment.chapterNum}:{comment.verseNum}
                </span>
                <span className="likes-count">
                  <span role="img" aria-label="좋아요">
                    👍
                  </span>{" "}
                  {comment.likes.length}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="no-comments">
            <p>아직 댓글이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentComments;
