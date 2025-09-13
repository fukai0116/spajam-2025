# SPAJAM 2025 Backend

SPAJAM 2025プロジェクトのバックエンドAPIサーバーです。

## プロジェクト構造

```
backend/
├── src/
│   ├── controllers/     # コントローラー（ビジネスロジック）
│   │   └── gameController.js
│   ├── routes/         # ルート定義
│   │   └── game.js
│   ├── models/         # データモデル（今後追加）
│   ├── middleware/     # カスタムミドルウェア（今後追加）
│   ├── services/       # サービス層（今後追加）
│   ├── utils/          # ユーティリティ関数（今後追加）
│   └── server.js       # メインサーバーファイル
├── .env                # 環境変数
├── package.json        # 依存関係とスクリプト
└── README.md          # このファイル
```

## セットアップ

### 必要な環境
- Node.js (v16以上推奨)
- npm

### インストール

1. 依存関係のインストール:
```bash
npm install
```

2. 環境変数の設定:
`.env`ファイルを編集して必要な設定を行ってください。

### 起動方法

#### 開発モード（自動リロード有効）
```bash
npm run dev
```

#### 本番モード
```bash
npm start
```

#### 本番環境テスト（ローカル）
```bash
npm run prod
```

サーバーが起動すると以下のURLでアクセスできます：
- サーバー情報: <http://localhost:3000/>
- API情報: <http://localhost:3000/api>
- ヘルスチェック: <http://localhost:3000/api/health>

## Heroku デプロイ

### クイックデプロイ
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/fukai0116/spajam-2025/tree/main/backend)

### 手動デプロイ
詳細な手順は [HEROKU_DEPLOY.md](./HEROKU_DEPLOY.md) を参照してください。

```bash
# Heroku CLI でログイン
heroku login

# アプリケーション作成
heroku create your-app-name

# デプロイ
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

## API エンドポイント

### 基本情報
- `GET /` - サーバー情報
- `GET /api` - API情報
- `GET /api/health` - ヘルスチェック

### ゲーム関連（予定）
- `GET /api/game/rooms` - マルチプレイルーム一覧
- `POST /api/game/rooms` - ルーム作成
- `POST /api/game/rooms/:roomId/join` - ルーム参加
- `POST /api/game/single/start` - シングルプレイ開始
- `POST /api/game/multi/start` - マルチプレイ開始
- `POST /api/game/:sessionId/end` - ゲーム終了

## 開発

### スクリプト
- `npm start` - 本番モードでサーバー起動
- `npm run dev` - 開発モードでサーバー起動（nodemon使用）
- `npm test` - テスト実行（未実装）

### 追加予定機能
- データベース連携
- WebSocket（リアルタイム通信）
- 認証機能
- ロギング
- テスト