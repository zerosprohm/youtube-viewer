import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export function useDisplayMode() {
  const [isGridMode, setIsGridMode] = useState(true);
  const [autoHideWatched, setAutoHideWatched] = useLocalStorage('autoHideWatched', false);
  const [showWatched, setShowWatched] = useLocalStorage('showWatched', true);

  // デバッグ用ログ
  console.log('useDisplayMode Debug:', { showWatched, isGridMode, autoHideWatched });

  // showWatchedの状態変更を強制的にトリガー
  useEffect(() => {
    console.log('useDisplayMode: showWatched changed to', showWatched);
  }, [showWatched]);

  const handleGridModeChange = (value: boolean) => {
    setIsGridMode(value);
  };

  return {
    isGridMode,
    autoHideWatched,
    showWatched,
    setAutoHideWatched,
    setShowWatched,
    handleGridModeChange,
  };
} 