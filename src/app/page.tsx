'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChannelHistory {
  url: string;
  timestamp: number;
}

export default function Home() {
  const [channelUrl, setChannelUrl] = useState('');
  const [history, setHistory] = useState<ChannelHistory[]>([]);
  const router = useRouter();

  // 履歴の読み込み
  useEffect(() => {
    const savedHistory = localStorage.getItem('channelHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 履歴の保存
  const saveToHistory = (url: string) => {
    const newHistory = [
      { url, timestamp: Date.now() },
      ...history.filter(item => item.url !== url).slice(0, 9)
    ];
    setHistory(newHistory);
    localStorage.setItem('channelHistory', JSON.stringify(newHistory));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const channelId = extractChannelId(channelUrl);
    if (channelId) {
      saveToHistory(channelUrl);
      router.push(`/channel/${channelId}`);
    }
  };

  const handleHistoryClick = (url: string) => {
    setChannelUrl(url);
    const channelId = extractChannelId(url);
    if (channelId) {
      saveToHistory(url);
      router.push(`/channel/${channelId}`);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              YouTube Channel Viewer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="channelUrl" className="text-sm font-medium">
                  チャンネルURL
                </label>
                <Input
                  id="channelUrl"
                  type="text"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  placeholder="https://www.youtube.com/@channelname"
                  className="w-full"
                />
              </div>
              <Button type="submit" className="w-full">
                チャンネルを表示
              </Button>
            </form>
          </CardContent>
        </Card>

        {history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                最近表示したチャンネル
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {history.map((item) => (
                  <button
                    key={item.timestamp}
                    onClick={() => handleHistoryClick(item.url)}
                    className="w-full text-left p-2 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm truncate">{item.url}</span>
                      <span className="text-xs text-gray-500">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

// チャンネルURLからIDを抽出する関数
function extractChannelId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    // チャンネルIDのパターン
    if (path.startsWith('/channel/')) {
      return path.split('/channel/')[1].split('/')[0];
    }
    // カスタムURLのパターン
    if (path.startsWith('/c/')) {
      return path.split('/c/')[1].split('/')[0];
    }
    // ハンドル名のパターン（@を残す）
    if (path.startsWith('/@')) {
      return '@' + path.split('/@')[1].split('/')[0];
    }

    return null;
  } catch {
    return null;
  }
}
