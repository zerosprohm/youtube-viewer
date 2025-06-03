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

## 環境変数

```env
YOUTUBE_API_KEY=your_api_key_here
``` 