'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate, dateTimeFormat } from '@/lib/utils';
import { useWatchedVideos } from '@/hooks/useWatchedVideos';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useRef, useEffect } from 'react';
import { useBlacklist } from '@/hooks/useBlacklist';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Video {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    publishedAt: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
  };
  contentDetails?: {
    duration: string;
  };
}

interface VideoListProps {
  videos: Video[];
  onSelectVideo: (video: Video) => void;
  selectedVideoId?: string;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  autoHideWatched: boolean;
  onAutoHideChange: (value: boolean) => void;
  showWatched: boolean;
  isGridMode: boolean;  
}

export function VideoList({ 
  videos, 
  onSelectVideo, 
  selectedVideoId,
  onLoadMore,
  hasMore,
  isLoading,
  showWatched,
  isGridMode,
}: VideoListProps) {
  const { isWatched } = useWatchedVideos();
  const { isBlacklisted } = useBlacklist();
  const lastVideoElementRef = useInfiniteScroll({ onLoadMore, hasMore, isLoading });
  const selectedVideoRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selectedVideoId && selectedVideoRef.current && !isGridMode) {
      selectedVideoRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedVideoId, isGridMode]);

  // 動画選択時の処理
  const handleVideoSelect = (video: Video) => {
    onSelectVideo(video);
  };

  // 表示する動画をフィルタリング
  const filteredVideos = videos.filter(video => {
    if (isBlacklisted(video.snippet.title)) return false;
    if (!showWatched && isWatched(video.id.videoId)) return false;
    return true;
  });

  // 動画の長さをフォーマットする関数
  const formatDuration = (duration: string) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '';

    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');

    let result = '';
    if (hours) result += `${hours}:`;
    result += `${minutes.padStart(2, '0')}:`;
    result += seconds.padStart(2, '0');

    return result;
  };

  return (
    <div className={`overflow-y-auto h-[calc(100vh-8rem)] ${isGridMode ? 'grid grid-cols-5 gap-4 p-2' : ''}`}>
      {isGridMode ? (
        <>
          {filteredVideos.map((video, index) => (
            <div
              key={video.id.videoId}
              ref={index === filteredVideos.length - 1 ? lastVideoElementRef : undefined}
              className={`cursor-pointer hover:opacity-80 transition-opacity ${isWatched(video.id.videoId) ? 'opacity-50' : ''}`}
              onClick={() => handleVideoSelect(video)}
            >
              <div className="relative">
                <img
                  src={video.snippet.thumbnails.medium.url}
                  alt={video.snippet.title}
                  className="w-full aspect-video object-cover rounded-lg"
                />
                {video.contentDetails?.duration && (
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 rounded">
                    {formatDuration(video.contentDetails.duration)}
                  </div>
                )}
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h3 className="text-sm mt-2 line-clamp-2">{video.snippet.title}</h3>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{video.snippet.title}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(video.snippet.publishedAt, dateTimeFormat)}
              </p>
            </div>
          ))}
          {isLoading && (
            <div className="col-span-5 text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredVideos.map((video, index) => (
            <button
              key={video.id.videoId}
              onClick={() => handleVideoSelect(video)}
              ref={index === filteredVideos.length - 1 
                ? lastVideoElementRef 
                : video.id.videoId === selectedVideoId 
                  ? selectedVideoRef 
                  : undefined}
              className={`w-full text-left p-2 rounded-lg transition-colors ${
                video.id.videoId === selectedVideoId
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              } ${isWatched(video.id.videoId) ? 'opacity-50' : ''}`}
            >
              <div className="relative aspect-video mb-2">
                <img
                  src={video.snippet.thumbnails.medium.url}
                  alt={video.snippet.title}
                  className="object-cover rounded"
                />
                {video.contentDetails?.duration && (
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 rounded">
                    {formatDuration(video.contentDetails.duration)}
                  </div>
                )}
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h3 className="font-medium line-clamp-2">{video.snippet.title}</h3>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{video.snippet.title}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <p className="text-sm text-muted-foreground">
                {formatDate(video.snippet.publishedAt, dateTimeFormat)}
              </p>
            </button>
          ))}

          {isLoading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 