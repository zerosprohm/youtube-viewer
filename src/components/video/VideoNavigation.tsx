'use client';

import { Grid, List, Eye, EyeOff, Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { WatchedHistory } from './WatchedHistory';
import { BlacklistDialog } from './BlacklistDialog';
import { useBlacklist } from '@/hooks/useBlacklist';
import { useState } from 'react';

interface VideoNavigationProps {
  showWatched: boolean;
  setShowWatched: (value: boolean) => void;
  isRefreshing: boolean;
  handleRefresh: () => void;
  isGridMode: boolean;
  handleGridModeChange: (value: boolean) => void;
  autoHideWatched: boolean;
  setAutoHideWatched: (value: boolean) => void;
  onSelectVideo: (videoId: string) => void;
}

export function VideoNavigation({
  showWatched,
  setShowWatched,
  isRefreshing,
  handleRefresh,
  isGridMode,
  handleGridModeChange,
  autoHideWatched,
  setAutoHideWatched,
  onSelectVideo,
}: VideoNavigationProps) {
  const { blacklist, addToBlacklist, removeFromBlacklist } = useBlacklist();
  const [previousBlacklist, setPreviousBlacklist] = useState(blacklist);

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      // ブラックリストに変更があった場合のみ動画リストを更新
      if (JSON.stringify(previousBlacklist) !== JSON.stringify(blacklist)) {
        handleRefresh();
        setPreviousBlacklist(blacklist);
      }
    }
  };

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowWatched(!showWatched)}
          className="flex items-center gap-2"
        >
          {showWatched ? (
            <>
              <Eye className="h-4 w-4" />
              <span>すべて表示中</span>
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4" />
              <span>再生済みを非表示中</span>
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>更新</span>
        </Button>
        <WatchedHistory onSelectVideo={onSelectVideo} />
        <BlacklistDialog
          blacklist={blacklist}
          onAdd={addToBlacklist}
          onRemove={removeFromBlacklist}
          onOpenChange={handleDialogOpenChange}
        />
      </div>

      <div className="flex items-center gap-2">
        <ToggleGroup type="single" value={isGridMode ? "grid" : "list"} onValueChange={(value) => handleGridModeChange(value === "grid")}>
          <ToggleGroupItem value="grid" aria-label="グリッド表示">
            <Grid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="リスト表示">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="flex items-center gap-2"
              onClick={() => setAutoHideWatched(!autoHideWatched)}
            >
              <div className={`w-4 h-4 border rounded ${autoHideWatched ? 'bg-primary' : ''}`} />
              <span>終了時に自動的に次を再生</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 