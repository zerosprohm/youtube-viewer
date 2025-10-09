# API仕様

## YouTube Data API

### チャンネル動画一覧取得

```typescript
GET /youtube/v3/search
```

**パラメータ**
- `channelId`: チャンネルID
- `part`: snippet
- `order`: date
- `maxResults`: 50
- `key`: APIキー

### 動画コメント取得

```typescript
GET /youtube/v3/commentThreads
```

**パラメータ**
- `videoId`: 動画ID
- `part`: snippet
- `order`: time
- `maxResults`: 50
- `key`: APIキー

## OpenAI API

### 動画要約生成

```typescript
POST /v1/chat/completions
```

**パラメータ**
- `model`: gpt-3.5-turbo
- `messages`: 要約対象のテキストを含むメッセージ配列
- `max_tokens`: 1000
- `temperature`: 0.7

**使用例**
```typescript
const response = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [
    {
      role: "system",
      content: "あなたは動画の内容を要約する専門家です。以下の動画の文字起こしを基に、重要なポイントを簡潔にまとめてください。"
    },
    {
      role: "user",
      content: `動画の文字起こし: ${transcript}`
    }
  ],
  max_tokens: 1000,
  temperature: 0.7
});
```

## Google Cloud Speech-to-Text API

### 音声文字起こし

```typescript
POST /v1/speech:recognize
```

**パラメータ**
- `audio`: Base64エンコードされた音声データ
- `config`: 音声認識の設定
  - `encoding`: WEBM_OPUS
  - `sampleRateHertz`: 48000
  - `languageCode`: ja-JP または en-US
  - `enableAutomaticPunctuation`: true
  - `model`: latest_long
  - `audioChannelCount`: 2
  - `useEnhanced`: true

**使用例**
```typescript
const request = {
  audio: {
    content: audioBuffer.toString('base64')
  },
  config: {
    encoding: 'WEBM_OPUS' as const,
    sampleRateHertz: 48000,
    languageCode: 'ja-JP',
    enableAutomaticPunctuation: true,
    enableWordTimeOffsets: false,
    model: 'latest_long',
    audioChannelCount: 2,
    useEnhanced: true
  }
};

const [response] = await speechClient.recognize(request);
```

## 内部API関数

### 字幕取得

```typescript
// src/lib/youtube.ts
export async function getVideoTranscript(videoId: string): Promise<TranscriptResponse | null>
```

**戻り値**
```typescript
interface TranscriptResponse {
  text: string;
  language: string;
  duration?: number;
}
```

### 音声文字起こし

```typescript
// src/lib/speech-to-text.ts
export async function getVideoTranscription(videoId: string): Promise<TranscriptionResponse>
```

**戻り値**
```typescript
interface TranscriptionResponse {
  text: string;
  confidence: number;
  languageCode: string;
  method: 'speech-to-text';
}
```

### 動画要約

```typescript
// src/lib/youtube.ts
export async function summarizeVideo(videoId: string, durationInSeconds?: number): Promise<SummaryResponse>
```

**戻り値**
```typescript
interface SummaryResponse {
  summary: string;
  method: 'caption' | 'speech-to-text';
  language: string;
  duration: number;
  timestamp: string;
}
```

## 環境変数

```env
YOUTUBE_API_KEY=your_youtube_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json
```

## エラーハンドリング

### 一般的なエラー

```typescript
interface ApiError {
  message: string;
  code?: string;
  details?: any;
}
```

### 音声文字起こしエラー

- `audio_channel_count`: 音声チャンネル数の問題
- `Sync input too long`: 音声が長すぎる（ffmpeg分割で解決）
- `Inline audio exceeds duration limit`: インライン音声の制限（ffmpeg分割で解決）

### 要約エラー

- `字幕または音声の文字起こしができませんでした`: 字幕・音声両方で失敗
- `音声文字起こしに失敗しました`: 音声文字起こしの失敗
- `OpenAI APIキーが設定されていません`: APIキー未設定 