import React, { useState, useEffect, useCallback } from "react";
import { Comment, User } from "../types/bible";
import {
  commentUtils,
  setupRealtimeComments,
  supabase,
} from "../utils/supabase";
import { useAuth } from "../contexts/AuthContext";
import AuthModal from "./AuthModal";
import "../styles/CommentSection.css";

// Comment에 사용자 정보가 추가된 확장 인터페이스
interface CommentWithUser extends Comment {
  userName?: string;
  profileImage?: string;
}

interface CommentItemProps {
  comment: CommentWithUser;
  currentUser: User | null;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string) => void;
}

// 개별 댓글 컴포넌트
const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUser,
  onDelete,
  onLike,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const isOwner = currentUser?.id === comment.userId;
  const hasLiked = comment.likes.includes(currentUser?.id || "");

  const handleSaveEdit = async () => {
    if (editContent.trim() === "") return;

    const success = await commentUtils.updateComment(comment.id, editContent);
    if (success) {
      setIsEditing(false);
      // UI 업데이트는 상위 컴포넌트에서 처리
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="comment-item">
      <div className="comment-header">
        <div className="user-info">
          {comment.profileImage ? (
            <img
              src={comment.profileImage}
              alt={`${comment.userName || "사용자"} 프로필`}
              className="profile-image"
            />
          ) : (
            <div className="profile-placeholder">
              {(comment.userName || "익명")[0].toUpperCase()}
            </div>
          )}
          <span className="user-name">{comment.userName || "익명"}</span>
        </div>
        <span className="comment-date">{formatDate(comment.timestamp)}</span>
      </div>

      <div className="comment-content">
        {isEditing ? (
          <div className="edit-section">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className="edit-textarea"
            />
            <div className="edit-actions">
              <button
                className="cancel-btn"
                onClick={() => setIsEditing(false)}
              >
                취소
              </button>
              <button className="save-btn" onClick={handleSaveEdit}>
                저장
              </button>
            </div>
          </div>
        ) : (
          <p>{comment.content}</p>
        )}
      </div>

      <div className="comment-actions">
        <button
          className={`like-btn ${hasLiked ? "liked" : ""}`}
          onClick={() => onLike(comment.id)}
          disabled={!currentUser}
        >
          <span role="img" aria-label="좋아요">
            👍
          </span>{" "}
          {comment.likes.length}
        </button>

        {isOwner && !isEditing && (
          <>
            <button className="edit-btn" onClick={() => setIsEditing(true)}>
              수정
            </button>
            <button className="delete-btn" onClick={() => onDelete(comment.id)}>
              삭제
            </button>
          </>
        )}
      </div>
    </div>
  );
};

interface CommentSectionProps {
  verseKey: string;
  bookName: string;
  chapterNum: number;
  verseNum: number;
}

// 댓글 섹션 메인 컴포넌트
const CommentSection: React.FC<CommentSectionProps> = ({
  verseKey,
  bookName,
  chapterNum,
  verseNum,
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const loadComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const commentsData = await commentUtils.getCommentsByVerse(verseKey);

      // 사용자 정보 추가
      const commentsWithUserInfo = await Promise.all(
        commentsData.map(async (comment) => {
          try {
            const { data: profile, error } = await supabase
              .from("profiles")
              .select("name, profile_image")
              .eq("id", comment.userId)
              .single();

            if (error) {
              console.error("프로필 정보 로드 중 오류:", error);
              return {
                ...comment,
                userName: "익명",
                profileImage: undefined,
              };
            }

            return {
              ...comment,
              userName: profile?.name || "익명",
              profileImage: profile?.profile_image,
            };
          } catch (error) {
            console.error("프로필 정보 로드 중 오류:", error);
            return {
              ...comment,
              userName: "익명",
              profileImage: undefined,
            };
          }
        })
      );

      setComments(commentsWithUserInfo);
    } catch (error) {
      console.error("댓글 로드 중 오류:", error);
    } finally {
      setIsLoading(false);
    }
  }, [verseKey]);

  // 댓글 작성
  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;

    try {
      const newCommentData = await commentUtils.addComment(
        user.id,
        verseKey,
        newComment
      );

      if (newCommentData) {
        // 새로운 댓글에 사용자 정보 추가
        const commentWithUser: CommentWithUser = {
          ...newCommentData,
          userName: user.name,
          profileImage: user.profileImage,
        };

        setComments([commentWithUser, ...comments]);
        setNewComment("");
      }
    } catch (error) {
      console.error("댓글 작성 중 오류:", error);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    const confirmed = window.confirm("정말로 이 댓글을 삭제하시겠습니까?");
    if (!confirmed) return;

    const success = await commentUtils.deleteComment(commentId);
    if (success) {
      setComments(comments.filter((c) => c.id !== commentId));
    }
  };

  // 댓글 좋아요
  const handleLikeComment = async (commentId: string) => {
    if (!user) return;

    const success = await commentUtils.toggleLike(commentId, user.id);
    if (success) {
      setComments(
        comments.map((comment) => {
          if (comment.id === commentId) {
            const hasLiked = comment.likes.includes(user.id);
            const newLikes = hasLiked
              ? comment.likes.filter((id) => id !== user.id)
              : [...comment.likes, user.id];

            return { ...comment, likes: newLikes };
          }
          return comment;
        })
      );
    }
  };

  // 컴포넌트 마운트시 댓글 로드
  useEffect(() => {
    loadComments();

    // 실시간 댓글 업데이트 구독
    const unsubscribe = setupRealtimeComments(verseKey, async (newComment) => {
      // 새 댓글이 내가 작성한 것이 아닌 경우만 추가 (중복 방지)
      if (newComment.userId !== user?.id) {
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("name, profile_image")
            .eq("id", newComment.userId)
            .single();

          const commentWithUser: CommentWithUser = {
            ...newComment,
            userName: error ? "익명" : profile?.name || "익명",
            profileImage: error ? undefined : profile?.profile_image,
          };

          setComments((prevComments) => [commentWithUser, ...prevComments]);
        } catch (error) {
          console.error("실시간 댓글의 프로필 정보 로드 중 오류:", error);
          const commentWithUser: CommentWithUser = {
            ...newComment,
            userName: "익명",
            profileImage: undefined,
          };

          setComments((prevComments) => [commentWithUser, ...prevComments]);
        }
      }
    });

    return unsubscribe;
  }, [verseKey, user?.id, loadComments]);

  return (
    <div className="comment-section">
      <h3 className="comment-section-title">
        {bookName} {chapterNum}:{verseNum} 함께 나누는 묵상
      </h3>

      {user ? (
        <div className="new-comment">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="이 구절에 대한 생각을 나눠보세요..."
            rows={3}
            className="comment-textarea"
          />
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="add-comment-btn"
          >
            댓글 작성
          </button>
        </div>
      ) : (
        <div className="login-prompt">
          <p>댓글을 작성하려면 로그인이 필요합니다.</p>
          <button className="login-btn" onClick={() => setShowAuthModal(true)}>
            로그인
          </button>
        </div>
      )}

      <div className="comments-list">
        {isLoading ? (
          <div className="loading">댓글을 불러오는 중...</div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={user}
              onDelete={handleDeleteComment}
              onLike={handleLikeComment}
            />
          ))
        ) : (
          <div className="no-comments">
            <p>아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!</p>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default CommentSection;
