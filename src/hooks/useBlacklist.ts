import { useState, useEffect } from 'react';

const BLACKLIST_KEY = 'youtube-viewer-blacklist';

export function useBlacklist() {
  const [blacklist, setBlacklist] = useState<string[]>([]);

  useEffect(() => {
    const savedBlacklist = localStorage.getItem(BLACKLIST_KEY);
    if (savedBlacklist) {
      setBlacklist(JSON.parse(savedBlacklist));
    }
  }, []);

  const addToBlacklist = (word: string) => {
    const newBlacklist = [...blacklist, word];
    setBlacklist(newBlacklist);
    localStorage.setItem(BLACKLIST_KEY, JSON.stringify(newBlacklist));
  };

  const removeFromBlacklist = (word: string) => {
    const newBlacklist = blacklist.filter(w => w !== word);
    setBlacklist(newBlacklist);
    localStorage.setItem(BLACKLIST_KEY, JSON.stringify(newBlacklist));
  };

  const isBlacklisted = (title: string) => {
    return blacklist.some(word => title.toLowerCase().includes(word.toLowerCase()));
  };

  return {
    blacklist,
    addToBlacklist,
    removeFromBlacklist,
    isBlacklisted,
  };
} 