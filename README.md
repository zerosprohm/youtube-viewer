# YouTube Channel Viewer

YouTubeチャンネルの動画一覧を表示し、動画の再生とコメントの閲覧、動画の要約ができるWebアプリケーションです。

## 主な機能

- YouTubeチャンネルの動画一覧表示
- 動画の再生（自動再生対応）
- 動画のコメント表示
- **動画の要約機能（新機能）**
  - 動画の字幕を自動取得
  - 字幕がない場合は音声から文字起こし（ffmpeg使用）
  - AIを使用した要約の生成
  - 日本語・英語の字幕に対応
  - 要約結果のローカルストレージ保存（1週間有効）
- レスポンシブデザイン

## 技術スタック

- Next.js 13+
- TypeScript
- Tailwind CSS
- shadcn/ui
- YouTube Data API v3
- OpenAI API (動画要約機能)
- youtube-transcript (字幕取得)
- Google Cloud Speech-to-Text API (音声文字起こし機能)
- ytdl-core (YouTube音声ダウンロード)
- ffmpeg (音声分割処理)

## 実行方法

1. リポジトリをクローン
```bash
git clone [リポジトリURL]
cd youtube-viewer
```

2. 依存関係のインストール
```bash
pnpm install
```

3. ffmpegのインストール（音声文字起こし機能用）
```bash
# macOS (Homebrew)
brew install ffmpeg

# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# Windows
# https://ffmpeg.org/download.html からダウンロード
```

4. 環境変数の設定
`.env.local`ファイルを作成し、以下の内容を設定します：
```
YOUTUBE_API_KEY=あなたのYouTube_APIキー
OPENAI_API_KEY=あなたのOpenAI_APIキー
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json  # 音声文字起こし機能用
```

**注意**: 
- 動画要約機能を使用するには、OpenAI APIキーが必要です。
- 音声文字起こし機能を使用するには、Google Cloud Speech-to-Text APIの認証情報が必要です。

5. 開発サーバーの起動
```bash
pnpm dev
```

6. ブラウザで http://localhost:3000 にアクセス

## 音声文字起こし機能について

### 概要
動画に字幕がない場合、音声から自動的に文字起こしを行い、その内容を基に要約を生成します。

### 処理フロー
1. **音声ダウンロード**: ytdl-coreを使用してYouTube動画の音声をダウンロード
2. **音声分割**: ffmpegを使用して音声を30秒ごとのセグメントに分割
3. **文字起こし**: Google Cloud Speech-to-Text APIで各セグメントを並行処理
4. **結果結合**: 各セグメントの文字起こし結果を結合
5. **要約生成**: OpenAI APIを使用して要約を生成

### 特徴
- **長い動画対応**: ffmpegによる適切な音声分割で、制限なく長い動画を処理
- **並行処理**: 複数セグメントを同時に文字起こしして高速化
- **エラー耐性**: 一部セグメントの失敗が全体に影響しない
- **自動クリーンアップ**: 一時ファイルの自動削除
- **多言語対応**: 日本語・英語の自動検出

### 必要な環境
- ffmpegがインストールされていること
- Google Cloud Speech-to-Text APIの認証情報が設定されていること
- 十分なディスク容量（一時ファイル用）

## YouTube Data API v3 の API キー取得手順

1. Google Cloud コンソールにアクセス
   - https://console.cloud.google.com/ を開き、Google アカウントでログイン

2. 新しいプロジェクトを作成
   - 画面上部の「プロジェクト選択」をクリック
   - 「新しいプロジェクト」を押し、プロジェクト名を入力して「作成」をクリック

3. YouTube Data API を有効化
   - 左メニューの「API とサービス」→「ライブラリ」を選択
   - 検索バーに「YouTube Data API v3」と入力し、表示されたらクリック
   - 「有効にする」ボタンを押して API を有効化

4. 認証情報（API キー）を作成
   - 左メニューの「API とサービス」→「認証情報」を開く
   - 画面上部の「認証情報を作成」→「API キー」を選択
   - 自動でキーが生成されるので、ダイアログ内の API キー文字列をコピー

5. API キーの制限（推奨）
   - 認証情報一覧から先ほど作成したキーの「編集」アイコンをクリック
   - 「アプリケーションの制限」で「HTTP リファラー（ウェブサイト）」を選択
   - 「API の制限」で「YouTube Data API v3」を選択し、「保存」

## OpenAI API キー取得手順（動画要約機能用）

1. OpenAI のウェブサイトにアクセス
   - https://platform.openai.com/ を開き、アカウントを作成またはログイン

2. API キーを取得
   - 左メニューの「API Keys」をクリック
   - 「Create new secret key」をクリック
   - キー名を入力して「Create secret key」をクリック
   - 生成されたキーをコピー（一度しか表示されないので注意）

3. 使用量の確認
   - OpenAI APIは従量課金制です
   - 動画要約機能は GPT-3.5-turbo を使用します
   - 料金は https://openai.com/pricing で確認できます

## Google Cloud Speech-to-Text API の設定手順

音声文字起こし機能を使用する場合の設定手順です。

1. **Google Cloud プロジェクトの作成**
   - https://console.cloud.google.com/ にアクセス
   - 新しいプロジェクトを作成

2. **Speech-to-Text API の有効化**
   - API とサービス → ライブラリ
   - "Speech-to-Text API" を検索して有効化

3. **サービスアカウントの作成**
   - IAM と管理 → サービスアカウント
   - 新しいサービスアカウントを作成
   - 以下のいずれかのロールを付与：
     - **Speech-to-Text 管理者** (`roles/speech.admin`) - 完全な管理権限（開発・テスト環境推奨）
     - **Speech-to-Text ユーザー** (`roles/speech.client`) - 最小権限（本番環境推奨）

4. **認証情報のダウンロード**
   - サービスアカウントの詳細 → キー → 新しいキーを作成
   - JSON 形式でダウンロード
   - ファイルパスを `GOOGLE_APPLICATION_CREDENTIALS` に設定

5. **使用量の確認**
   - Google Cloud Speech-to-Text APIは従量課金制です
   - 料金は https://cloud.google.com/speech-to-text/pricing で確認できます

## 使用方法

1. トップページでYouTubeチャンネルのURLを入力
2. チャンネルページで動画一覧を確認
3. 動画をクリックして再生
4. 右側のコメント欄でコメントを閲覧
5. **動画再生時に「要約を生成」ボタンをクリックして動画の要約を表示**
6. **要約結果は自動的にローカルストレージに保存され、1週間以内は再生成不要**

## PM2でのプロセス管理

このプロジェクトでは、PM2を使用してアプリケーションのプロセス管理を行っています。開発環境と本番環境を分離して管理できます。

### 前提条件

PM2がインストールされていない場合は、以下のコマンドでインストールしてください：

```bash
npm install -g pm2
```

### 環境設定

プロジェクトには以下の2つの環境が設定されています：

- **本番環境（ポート3000）**: ビルド済みのアプリケーション
- **開発環境（ポート3001）**: ホットリロード付きの開発サーバー

### 基本的な使用方法

#### 1. 全環境の起動
```bash
# 本番環境と開発環境の両方を起動
pm2 start ecosystem.config.js
```

#### 2. 個別環境の起動
```bash
# 本番環境のみ起動
pm2 start ecosystem.config.js --only youtube-viewer

# 開発環境のみ起動
pm2 start ecosystem.config.js --only youtube-viewer-dev
```

#### 3. プロセス状態の確認
```bash
# 実行中のプロセス一覧を表示
pm2 list

# リアルタイムモニタリング
pm2 monit

# ログの確認
pm2 logs
```

### プロセス管理コマンド

#### 本番環境（youtube-viewer）
```bash
# 再起動
pm2 restart youtube-viewer

# 停止
pm2 stop youtube-viewer

# 削除
pm2 delete youtube-viewer

# ログ確認
pm2 logs youtube-viewer
```

#### 開発環境（youtube-viewer-dev）
```bash
# 再起動
pm2 restart youtube-viewer-dev

# 停止
pm2 stop youtube-viewer-dev

# 削除
pm2 delete youtube-viewer-dev

# ログ確認
pm2 logs youtube-viewer-dev
```

### 全体管理コマンド

```bash
# 全プロセスの再起動
pm2 restart ecosystem.config.js

# 全プロセスの停止
pm2 stop ecosystem.config.js

# 全プロセスの削除
pm2 delete ecosystem.config.js

# 全プロセスのログ確認
pm2 logs
```

### 自動起動の設定

システム起動時にPM2プロセスを自動起動するには：

```bash
# PM2の自動起動を有効化
pm2 startup

# 現在のプロセス設定を保存
pm2 save
```

### 開発時の使い分け

- **開発時**: `http://localhost:3001` でホットリロード付きの開発環境
- **本番確認時**: `http://localhost:3000` でビルド済みの本番環境

### トラブルシューティング

#### プロセスが起動しない場合
1. ビルドが必要な場合：
```bash
pnpm build
pm2 restart youtube-viewer
```

2. ログを確認：
```bash
pm2 logs youtube-viewer
```

#### ポートが使用中の場合
- 既存のプロセスを停止してから再起動
- ポート設定を確認（ecosystem.config.js）

### 設定ファイル（ecosystem.config.js）

プロジェクトルートの`ecosystem.config.js`ファイルで以下の設定が可能です：

- プロセス名とスクリプト
- インスタンス数
- メモリ制限
- 環境変数
- 自動再起動設定
- ファイル監視設定

## 注意事項

- YouTube Data API v3には1日のクォータ制限があります
- ブラウザの自動再生ポリシーにより、一部の環境では自動再生が制限される場合があります
- モバイルデバイスでは自動再生が制限される場合があります
- 音声文字起こし機能は、ffmpegがインストールされている環境でのみ動作します
- 長い動画の文字起こしには時間がかかる場合があります
- 音声文字起こしの精度は音声の品質に依存します

## 詳細な仕様

詳細な仕様については[仕様書](docs/specification.md)を参照してください。
