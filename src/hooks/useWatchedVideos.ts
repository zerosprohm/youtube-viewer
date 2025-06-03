'use client';

import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

interface WatchedVideo {
  videoId: string;
  watchedAt: string;
  title?: string;
}

export function useWatchedVideos() {
  const [watchedVideos, setWatchedVideos] = useLocalStorage<WatchedVideo[]>('watchedVideos', []);

  const addWatchedVideo = (videoId: string, title?: string) => {
    const now = new Date();
    setWatchedVideos(prev => {
      const existing = prev.find(v => v.videoId === videoId);
      if (existing) {
        return prev.map(v => 
          v.videoId === videoId 
            ? { ...v, watchedAt: now.toISOString(), title: title || v.title }
            : v
        );
      }
      return [...prev, { videoId, watchedAt: now.toISOString(), title }];
    });
  };

  const removeWatchedVideo = (videoId: string) => {
    setWatchedVideos(prev => prev.filter(v => v.videoId !== videoId));
  };

  const getWatchedDate = (videoId: string) => {
    const video = watchedVideos.find(v => v.videoId === videoId);
    if (!video?.watchedAt) return null;
    
    try {
      const date = new Date(video.watchedAt);
      if (isNaN(date.getTime())) return null;
      return date;
    } catch {
      return null;
    }
  };

  const getVideoTitle = (videoId: string) => {
    const video = watchedVideos.find(v => v.videoId === videoId);
    return video?.title;
  };

  const isWatched = (videoId: string) => {
    return watchedVideos.some(v => v.videoId === videoId);
  };

  const clearWatchedVideos = () => {
    setWatchedVideos([]);
  };

  const refreshWatchedVideos = () => {
    try {
      const storedVideos = localStorage.getItem('watchedVideos');
      if (storedVideos) {
        const parsedVideos = JSON.parse(storedVideos);
        setWatchedVideos(parsedVideos);
      }
    } catch (error) {
      console.error('Error refreshing watched videos:', error);
    }
  };

  // 視聴日時でソートした動画の配列を返す
  const getSortedWatchedVideos = () => {
    return [...watchedVideos]
      .sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime());
  };

  return {
    watchedVideos: getSortedWatchedVideos(),
    addWatchedVideo,
    removeWatchedVideo,
    getWatchedDate,
    getVideoTitle,
    isWatched,
    clearWatchedVideos,
    refreshWatchedVideos,
  };
} 