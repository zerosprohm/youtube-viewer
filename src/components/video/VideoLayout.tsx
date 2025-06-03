'use client';

import { VideoList } from './VideoList';
import { VideoPlayer } from './VideoPlayer';
import { CommentSection } from './CommentSection';
import { VideoNavigation } from './VideoNavigation';
import { useVideoState } from '@/hooks/useVideoState';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { useWatchedVideos } from '@/hooks/useWatchedVideos';

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

interface VideoLayoutProps {
  channelId: string;
  initialVideos: Video[];
  nextPageToken?: string;
}

export function VideoLayout({ channelId, initialVideos, nextPageToken }: VideoLayoutProps) {
  const {
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
  } = useVideoState(channelId, initialVideos, nextPageToken);

  const {
    isGridMode,
    autoHideWatched,
    showWatched,
    setAutoHideWatched,
    setShowWatched,
    handleGridModeChange,
  } = useDisplayMode();

  const { addWatchedVideo } = useWatchedVideos();

  const handleSelectVideoWithMode = (video: Video) => {
    handleSelectVideo(video);
    handleGridModeChange(false);
  };

  const handleSelectVideoById = (videoId: string) => {
    const video = videos.find(v => v.id.videoId === videoId);
    if (video) {
      handleSelectVideoWithMode(video);
    }
  };

  const handleVideoEndWithTitle = () => {
    if (selectedVideo) {
      addWatchedVideo(selectedVideo.id.videoId, selectedVideo.snippet.title);
      handleVideoEnd(autoHideWatched);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <VideoNavigation
        showWatched={showWatched}
        setShowWatched={setShowWatched}
        isRefreshing={isRefreshing}
        handleRefresh={handleRefresh}
        isGridMode={isGridMode}
        handleGridModeChange={handleGridModeChange}
        autoHideWatched={autoHideWatched}
        setAutoHideWatched={setAutoHideWatched}
        onSelectVideo={handleSelectVideoById}
      />
      <div className={`grid grid-cols-5 gap-4 h-[calc(100vh-10rem)]`}>
        <div className={`${isGridMode ? 'col-span-5' : 'col-span-1'}`}>
          <VideoList
            videos={videos}
            onSelectVideo={handleSelectVideoWithMode}
            selectedVideoId={selectedVideo?.id.videoId}
            onLoadMore={handleLoadMore}
            hasMore={!!nextToken}
            isLoading={isLoading}
            autoHideWatched={autoHideWatched}
            onAutoHideChange={setAutoHideWatched}
            showWatched={showWatched}
            isGridMode={isGridMode}
          />
        </div>
        {!isGridMode && selectedVideo && (
          <>
            <div className="col-span-3">
              <div className="flex-1">
                <VideoPlayer
                  videoId={selectedVideo.id.videoId}
                  onVideoEnd={handleVideoEndWithTitle}
                />
              </div>
            </div>
            <div className="col-span-1">
              <CommentSection videoId={selectedVideo.id.videoId} />
            </div>
          </>
        )}
      </div>
    </div>
  );
} 