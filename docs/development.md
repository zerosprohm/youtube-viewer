# 開発ガイド

## セットアップ

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev
```

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

## 注意事項

- YouTube Data APIのクォータ制限に注意
- エラーハンドリングの実装
- パフォーマンス最適化 