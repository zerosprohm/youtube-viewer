import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.YOUTUBE_API_KEY;

interface YouTubeCommentSnippet {
  textDisplay: string;
  authorDisplayName: string;
  publishedAt: string;
  likeCount: number;
}

interface YouTubeComment {
  id: string;
  snippet: YouTubeCommentSnippet;
}

interface YouTubeCommentThread {
  id: string;
  snippet: {
    topLevelComment: YouTubeComment;
    replies?: {
      comments: YouTubeComment[];
    };
  };
}

interface YouTubeCommentResponse {
  items: YouTubeCommentThread[];
  nextPageToken?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');
  const pageToken = searchParams.get('pageToken');

  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
  }

  if (!API_KEY) {
    return NextResponse.json({ error: 'YouTube APIキーが設定されていません' }, { status: 500 });
  }

  try {
    const params = new URLSearchParams({
      key: API_KEY,
      videoId,
      part: 'snippet,replies',
      maxResults: '50',
      order: 'relevance',
    });

    if (pageToken) {
      params.append('pageToken', pageToken);
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/commentThreads?${params.toString()}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('YouTube API Error Response:', error);
      return NextResponse.json(
        { error: error.error?.message || 'コメントの取得に失敗しました' },
        { status: response.status }
      );
    }

    const data: YouTubeCommentResponse = await response.json();
    
    return NextResponse.json({
      comments: data.items.map((item) => ({
        id: item.id,
        text: item.snippet.topLevelComment.snippet.textDisplay,
        author: item.snippet.topLevelComment.snippet.authorDisplayName,
        publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
        likeCount: item.snippet.topLevelComment.snippet.likeCount,
        replies: item.snippet.replies?.comments?.map((reply) => ({
          id: reply.id,
          text: reply.snippet.textDisplay,
          author: reply.snippet.authorDisplayName,
          publishedAt: reply.snippet.publishedAt,
          likeCount: reply.snippet.likeCount,
        })) || [],
      })),
      nextPageToken: data.nextPageToken,
    });
  } catch (error) {
    console.error('YouTube API Error:', error);
    return NextResponse.json(
      { error: 'コメントの取得に失敗しました' },
      { status: 500 }
    );
  }
} 