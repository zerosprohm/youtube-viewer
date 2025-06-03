import { useState } from 'react';
import { useLocalStorage } from './useLocalStorage';

export function useDisplayMode() {
  const [isGridMode, setIsGridMode] = useState(true);
  const [autoHideWatched, setAutoHideWatched] = useLocalStorage('autoHideWatched', false);
  const [showWatched, setShowWatched] = useLocalStorage('showWatched', true);

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