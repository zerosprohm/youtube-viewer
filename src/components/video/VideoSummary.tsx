'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, FileText, AlertCircle } from 'lucide-react';
import { summarizeVideo } from '@/lib/youtube';

interface VideoSummaryProps {
  videoId: string;
  videoTitle: string;
  compact?: boolean;
  videoDuration?: string; // フォーマット済みの動画の長さ（例: "1:23:45"）
}

interface SummaryData {
  summary: string;
  originalText: string;
  language: string;
  duration: number;
  method: 'caption' | 'speech-to-text';
  createdAt: string; // 要約生成日時を追加
}

// localStorageのキーを生成
const getSummaryKey = (videoId: string) => `video-summary-${videoId}`;

// 要約データをlocalStorageから読み込み
const loadSummaryFromStorage = (videoId: string): SummaryData | null => {
  try {
    const stored = localStorage.getItem(getSummaryKey(videoId));
    if (stored) {
      const data = JSON.parse(stored);
      // 1週間以内のデータのみ有効とする
      const createdAt = new Date(data.createdAt);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      if (createdAt > oneWeekAgo) {
        return data;
      } else {
        // 古いデータは削除
        localStorage.removeItem(getSummaryKey(videoId));
      }
    }
  } catch (error) {
    console.error('Error loading summary from storage:', error);
  }
  return null;
};

// 要約データをlocalStorageに保存
const saveSummaryToStorage = (videoId: string, data: SummaryData) => {
  try {
    localStorage.setItem(getSummaryKey(videoId), JSON.stringify(data));
  } catch (error) {
    console.error('Error saving summary to storage:', error);
  }
};

// 要約データをlocalStorageから削除
const deleteSummaryFromStorage = (videoId: string) => {
  try {
    localStorage.removeItem(getSummaryKey(videoId));
  } catch (error) {
    console.error('Error deleting summary from storage:', error);
  }
};

export function VideoSummary({ videoId, videoTitle, compact = false, videoDuration }: VideoSummaryProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // ダイアログが開かれたときにlocalStorageから要約データを読み込み
  useEffect(() => {
    if (isOpen && !summaryData && !isLoading) {
      const storedData = loadSummaryFromStorage(videoId);
      if (storedData) {
        setSummaryData(storedData);
      }
    }
  }, [isOpen, videoId, summaryData, isLoading]);

  const handleSummarize = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await summarizeVideo(videoId);
      const summaryDataWithTimestamp: SummaryData = {
        ...data,
        method: data.method as 'caption' | 'speech-to-text',
        createdAt: new Date().toISOString(),
      };
      
      setSummaryData(summaryDataWithTimestamp);
      saveSummaryToStorage(videoId, summaryDataWithTimestamp);
    } catch (err) {
      setError(err instanceof Error ? err.message : '要約の生成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSummary = () => {
    setSummaryData(null);
    deleteSummaryFromStorage(videoId);
  };

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}時間${minutes % 60}分`;
    } else if (minutes > 0) {
      return `${minutes}分${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size={compact ? "sm" : "sm"} 
          className={`gap-2 ${compact ? 'h-6 px-2 text-xs' : ''}`}
        >
          <FileText className={compact ? "h-3 w-3" : "h-4 w-4"} />
          {compact ? "要約" : "要約を生成"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>動画の要約</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium">{videoTitle}</p>
          </div>

          {!summaryData && !isLoading && !error && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                動画の字幕を取得して要約を生成します
              </p>
              <Button onClick={handleSummarize} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    要約中...
                  </>
                ) : (
                  '要約を開始'
                )}
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto animate-spin mb-4" />
              <p>動画の字幕を取得して要約を生成しています...</p>
            </div>
          )}

          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">エラー</span>
                </div>
                <p className="text-sm">{error}</p>
                {error.includes('字幕がありません') && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>字幕がない動画について：</strong><br />
                      • 動画に字幕が含まれていない場合、音声から文字起こしを試行します<br />
                      • YouTubeの字幕機能が有効になっている動画のみ対応しています<br />
                      • 自動生成字幕がある場合も利用できます<br />
                      • 音声文字起こしにはGoogle Cloud Speech-to-Text APIが必要です
                    </p>
                  </div>
                )}
                <Button 
                  onClick={handleSummarize} 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  disabled={isLoading}
                >
                  再試行
                </Button>
              </CardContent>
            </Card>
          )}

          {summaryData && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">要約結果</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDeleteSummary}
                  className="text-destructive hover:text-destructive"
                >
                  削除
                </Button>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">要約</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap">{summaryData.summary}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">詳細情報</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">言語:</span> {summaryData.language}
                    </div>
                    <div>
                      <span className="font-medium">動画の長さ:</span> {videoDuration || formatDuration(summaryData.duration)}
                    </div>
                    <div>
                      <span className="font-medium">取得方法:</span> 
                      {summaryData.method === 'caption' ? '字幕' : '音声文字起こし'}
                    </div>
                    <div>
                      <span className="font-medium">生成日時:</span> 
                      {new Date(summaryData.createdAt).toLocaleString('ja-JP')}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {summaryData.method === 'caption' ? '元の字幕テキスト' : '元の音声文字起こしテキスト'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-40 overflow-y-auto text-sm text-muted-foreground">
                    <p className="whitespace-pre-wrap">{summaryData.originalText}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 