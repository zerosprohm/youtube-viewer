# 開発ガイド

## セットアップ

```bash
# 依存関係のインストール
pnpm install

# ffmpegのインストール（音声文字起こし機能用）
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# 開発サーバーの起動
pnpm dev
```

## 環境変数

開発に必要な環境変数：

```bash
# .env.local
YOUTUBE_API_KEY=your_youtube_api_key
OPENAI_API_KEY=your_openai_api_key  # 動画要約機能用
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json  # 音声文字起こし機能用
```

## 新機能：動画要約機能

### 実装概要

動画要約機能は以下のコンポーネントで構成されています：

1. **`src/lib/youtube.ts`**
   - `getVideoTranscript()`: YouTube動画の字幕を取得
   - `summarizeVideo()`: OpenAI APIを使用して要約を生成

2. **`src/lib/speech-to-text.ts`**
   - `downloadAudioFromYouTube()`: ytdl-coreを使用してYouTube動画の音声をダウンロード
   - `transcribeAudio()`: ffmpegを使用した音声分割とGoogle Cloud Speech-to-Text APIによる文字起こし
   - `getVideoTranscription()`: 音声文字起こしの統合処理

3. **`src/components/video/VideoSummary.tsx`**
   - 要約機能のUIコンポーネント
   - ダイアログ形式で要約結果を表示
   - ローカルストレージへの保存・読み込み機能

4. **`src/components/video/VideoLayout.tsx`**
   - VideoSummaryコンポーネントを統合

### 使用ライブラリ

- `youtube-transcript`: YouTube動画の字幕取得
- `openai`: AI要約機能
- `@google-cloud/speech`: Google Cloud Speech-to-Text API
- `ytdl-core`: YouTube動画の音声ダウンロード
- `ffmpeg`: 音声分割処理（システムコマンド）

### 音声文字起こし機能の詳細

#### 処理フロー
1. **音声ダウンロード**: ytdl-coreでYouTube動画の音声をダウンロード
2. **一時ファイル保存**: 音声バッファを一時ファイルとして保存
3. **音声分割**: ffmpegで音声を30秒ごとのセグメントに分割
4. **並行文字起こし**: 各セグメントをGoogle Cloud Speech-to-Text APIで並行処理
5. **結果結合**: 各セグメントの文字起こし結果を結合
6. **一時ファイル削除**: 処理完了後に一時ファイルを自動削除

#### 主要な関数

```typescript
// 音声バッファを一時ファイルに保存
async function saveBufferToTempFile(buffer: Buffer, prefix: string, extension: string = '.webm'): Promise<string>

// ffmpegで音声を分割
async function splitAudioWithFFmpeg(inputFilePath: string, segmentDuration: number = 30): Promise<string[]>

// 単一セグメントの文字起こし
async function transcribeSegment(audioBuffer: Buffer, languageCode: string, segmentIndex: number): Promise<string>

// 統合文字起こし処理
export async function transcribeAudio(audioBuffer: Buffer, languageCode: string = 'ja-JP')
```

#### エラーハンドリング
- 音声チャンネル数の問題に対する自動再試行
- 一部セグメントの失敗が全体に影響しない設計
- 一時ファイルの確実な削除（finally句使用）

#### パフォーマンス最適化
- 複数セグメントの並行処理
- 適切なセグメントサイズ（30秒）での分割
- 一時ファイルの効率的な管理

### 実装のポイント

- 字幕が存在しない場合は自動的に音声から文字起こしを試行
- 日本語字幕を優先、次に英語字幕を選択
- 音声文字起こしも日本語を優先、次に英語を試行
- OpenAI APIのエラーハンドリング
- Google Cloud Speech-to-Text APIのエラーハンドリング
- ローディング状態の管理
- 取得方法（字幕/音声文字起こし）の表示
- 要約結果のローカルストレージ保存（1週間有効）

### 処理フロー

1. 動画の字幕を取得を試行
2. 字幕が存在する場合：字幕を使用して要約
3. 字幕が存在しない場合：
   - YouTube動画の音声をダウンロード
   - ffmpegで音声を30秒ごとに分割
   - Google Cloud Speech-to-Text APIで各セグメントを並行文字起こし
   - 文字起こし結果を結合
   - 文字起こし結果を使用して要約
4. OpenAI APIで要約を生成
5. 結果をローカルストレージに保存
6. 結果をUIに表示

## UIコンポーネント

### shadcn/ui
- 必要に応じて以下のコマンドでコンポーネントをインストール
```bash
# 初期化
pnpm dlx shadcn@latest init

# コンポーネントのインストール
pnpm dlx shadcn-ui@latest add [component-name]

# 例：ボタンコンポーネントのインストール
pnpm dlx shadcn@latest add button
```

利用可能なコンポーネント：
- button
- card
- input
- form
- dialog
- dropdown-menu
など

## 開発フロー

1. 機能ブランチの作成
2. 開発
3. テスト
4. プルリクエスト
5. レビュー
6. マージ

## テスト

```bash
# テストの実行
pnpm test

# 型チェック
pnpm type-check
```

## デプロイ

- Vercelを使用
- 環境変数の設定が必要
- 本番環境のAPIキーは別途設定
- ffmpegのインストールが必要（Vercelの場合は別途設定）

## 注意事項

- YouTube Data APIのクォータ制限に注意
- Google Cloud Speech-to-Text APIの使用量制限に注意
- ffmpegがインストールされている環境でのみ音声文字起こし機能が動作
- 一時ファイル用の十分なディスク容量が必要
- エラーハンドリングの実装
- パフォーマンス最適化 