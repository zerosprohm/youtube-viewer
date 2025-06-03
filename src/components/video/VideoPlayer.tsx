'use client';

import { useEffect, useRef } from 'react';
import YouTube from 'react-youtube';

interface VideoPlayerProps {
  videoId: string;
  onVideoEnd?: () => void;
}

export function VideoPlayer({ videoId, onVideoEnd }: VideoPlayerProps) {
  const playerRef = useRef<any>(null);

  const onReady = (event: any) => {
    playerRef.current = event.target;
  };

  const onStateChange = (event: any) => {
    // 動画が最後まで再生された場合（state: 0）
    if (event.data === 0 && onVideoEnd) {
      onVideoEnd();
    }
  };

  return (
    <div className="aspect-video w-full">
      <YouTube
        videoId={videoId}
        opts={{
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            modestbranding: 1,
            rel: 0,
          },
        }}
        onReady={onReady}
        onStateChange={onStateChange}
        className="w-full h-full"
      />
    </div>
  );
} 