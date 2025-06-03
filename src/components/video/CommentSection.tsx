'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { getVideoComments } from '@/lib/youtube';

interface Comment {
  id: string;
  text: string;
  author: string;
  publishedAt: string;
  likeCount: number;
  replies: Comment[];
}

interface CommentSectionProps {
  videoId: string;
}

// 日付と時間をフォーマットする関数
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="p-2 border-b">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs">{comment.author}</p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>👍 {comment.likeCount}</span>
          <span>{new Date(comment.publishedAt).toLocaleString()}</span>
        </div>
      </div>
      <p className="text-sm prose max-w-none" dangerouslySetInnerHTML={{ __html: comment.text }} />
      {comment.replies?.length > 0 && (
        <div className="ml-4 mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="p-2 bg-gray-50 rounded">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs">{reply.author}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>👍 {reply.likeCount}</span>
                  <span>{new Date(reply.publishedAt).toLocaleString()}</span>
                </div>
              </div>
              <p className="text-sm prose max-w-none" dangerouslySetInnerHTML={{ __html: reply.text }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentSection({ videoId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const commentsContainerRef = useRef<HTMLDivElement>(null);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastCommentElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreComments();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const loadMoreComments = async () => {
    if (!nextPageToken || loading) return;
    
    try {
      setLoading(true);
      const result = await getVideoComments(videoId, nextPageToken);
      setComments(prev => [...prev, ...result.comments]);
      setNextPageToken(result.nextPageToken);
      setHasMore(!!result.nextPageToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'コメントの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const result = await getVideoComments(videoId);
        setComments(result.comments);
        setNextPageToken(result.nextPageToken);
        setHasMore(!!result.nextPageToken);
        setLoading(false);
        // コメントを再取得したらスクロール位置をリセット
        if (commentsContainerRef.current) {
          commentsContainerRef.current.scrollTop = 0;
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'コメントの取得に失敗しました');
        setLoading(false);
      }
    };

    fetchComments();
  }, [videoId]);

  if (error) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (comments.length === 0 && !loading) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center text-gray-500">
        コメントはありません
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div ref={commentsContainerRef} className="flex-1 overflow-y-auto">
        <div className="space-y-4">
          <h3 className="font-bold">コメント</h3>
          {comments.map((comment, index) => (
            <div
              key={comment.id}
              ref={index === comments.length - 1 ? lastCommentElementRef : undefined}
            >
              <CommentItem comment={comment} />
            </div>
          ))}
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          )}
        </div>
      </div>
      {!loading && hasMore && (
        <div className="text-center py-2 text-gray-500 text-sm border-t">
          <div className="flex items-center justify-center gap-2">
            <span>もっと見る</span>
            <svg
              className="w-4 h-4 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
      )}
      {!loading && !hasMore && comments.length > 0 && (
        <div className="text-center py-2 text-gray-500 text-sm border-t">
          すべてのコメントを表示しました
        </div>
      )}
    </div>
  );
} 