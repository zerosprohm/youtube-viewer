import { useState } from 'react';
import { getChannelVideos } from '@/lib/youtube';
import { useWatchedVideos } from './useWatchedVideos';

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
}

export function useVideoState(channelId: string, initialVideos: Video[], initialNextPageToken?: string) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [nextToken, setNextToken] = useState<string | undefined>(initialNextPageToken);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { watchedVideos, addWatchedVideo, isWatched } = useWatchedVideos();

  const handleSelectVideo = (video: Video) => {
    if (selectedVideo && watchedVideos.some(v => v.videoId === selectedVideo.id.videoId)) {
      setVideos(prev => prev.filter(v => v.id.videoId !== selectedVideo.id.videoId));
    }
    setSelectedVideo(video);
  };

  const handleVideoEnd = (autoHideWatched: boolean) => {
    if (selectedVideo) {
      addWatchedVideo(selectedVideo.id.videoId, selectedVideo.snippet.title);

      if (autoHideWatched) {
        const currentIndex = videos.findIndex(v => v.id.videoId === selectedVideo.id.videoId);
        const nextVideo = videos.find((v, index) => index > currentIndex && !isWatched(v.id.videoId));
        if (nextVideo) {
          setSelectedVideo(nextVideo);
          setVideos(prev => prev.filter(v => v.id.videoId !== selectedVideo.id.videoId));
        }
      }
    }
  };

  const clearSelectedVideo = () => {
    setSelectedVideo(null);
  };

  const handleLoadMore = async () => {
    if (!nextToken || isLoading) return;

    try {
      setIsLoading(true);
      const response = await getChannelVideos(channelId, nextToken);
      
      const existingIds = new Set(videos.map((video: Video) => video.id.videoId));
      const newVideos = response.videos.filter((video: Video) => !existingIds.has(video.id.videoId));
      
      setVideos(prev => [...prev, ...newVideos]);
      setNextToken(response.nextPageToken);
    } catch (error) {
      console.error('Failed to load more videos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;

    try {
      setIsRefreshing(true);
      const response = await getChannelVideos(channelId);
      setVideos(response.videos);
      setNextToken(response.nextPageToken);
    } catch (error) {
      console.error('Failed to refresh videos:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    videos,
    selectedVideo,
    nextToken,
    isLoading,
    isRefreshing,
    handleSelectVideo,
    handleVideoEnd,
    handleLoadMore,
    handleRefresh,
    isWatched,
    clearSelectedVideo,
  };
} 