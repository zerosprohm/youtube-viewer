'use client';

import { History } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useWatchedVideos } from '@/hooks/useWatchedVideos';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface WatchedHistoryProps {
  onSelectVideo: (videoId: string) => void;
}

export function WatchedHistory({ onSelectVideo }: WatchedHistoryProps) {
  const { watchedVideos, getWatchedDate, getVideoTitle, removeWatchedVideo, refreshWatchedVideos } = useWatchedVideos();

  const formatDate = (date: Date | null) => {
    if (!date) return '不明な日時';
    try {
      return formatDistanceToNow(date, { addSuffix: true, locale: ja });
    } catch {
      return '不明な日時';
    }
  };

  const handleOpen = () => {
    refreshWatchedVideos();
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={handleOpen}>
          <History className="h-4 w-4" />
          <span>視聴履歴</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>視聴履歴</DrawerTitle>
          <DrawerDescription>
            最近視聴した動画の一覧です
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 py-2 max-h-[60vh] overflow-y-auto">
          {watchedVideos.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              視聴履歴はありません
            </p>
          ) : (
            <div className="space-y-2">
              {watchedVideos.map((video) => {
                const watchedDate = getWatchedDate(video.videoId);
                const title = video.title || getVideoTitle(video.videoId);
                return (
                  <div
                    key={video.videoId}
                    className="flex items-center justify-between p-2 hover:bg-accent rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                        alt="thumbnail"
                        className="w-24 h-auto rounded"
                      />
                      <div>
                        <p className="text-sm font-medium line-clamp-2">
                          {title || video.videoId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(watchedDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectVideo(video.videoId)}
                      >
                        再生
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWatchedVideo(video.videoId)}
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">閉じる</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
} 