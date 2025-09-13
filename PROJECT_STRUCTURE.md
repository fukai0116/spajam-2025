# SPAJAM 2025 プロジェクト構造

このプロジェクトは、FlutterフロントエンドとNode.jsバックエンドで構成されています。

## 全体構造

```
spajam2025/
├── frontend (Flutter)
│   ├── lib/
│   │   └── main.dart          # メインアプリケーション
│   ├── public/
│   │   └── ice.png           # 背景画像
│   ├── pubspec.yaml          # Flutter依存関係
│   └── ...                   # その他のFlutterファイル
│
├── backend/ (Node.js)
│   ├── src/
│   │   ├── controllers/      # ビジネスロジック
│   │   ├── routes/          # APIルート
│   │   ├── models/          # データモデル
│   │   ├── middleware/      # ミドルウェア
│   │   ├── services/        # サービス層
│   │   ├── utils/          # ユーティリティ
│   │   └── server.js       # メインサーバー
│   ├── .env                # 環境変数
│   ├── package.json        # Node.js依存関係
│   └── README.md          # バックエンドドキュメント
│
├── .gitignore              # Git除外設定
└── README.md              # このファイル
```

## 開発環境の起動

### フロントエンド (Flutter)

```bash
# プロジェクトルートで実行
flutter run -d chrome
```

### バックエンド (Node.js)

```bash
# backendディレクトリで実行
cd backend
npm run dev
```

## アクセス先

- **フロントエンド**: Chrome で自動起動
- **バックエンドAPI**: http://localhost:3000
- **API情報**: http://localhost:3000/api
- **ヘルスチェック**: http://localhost:3000/api/health

## 開発フロー

1. バックエンドサーバーを起動（`cd backend && npm run dev`）
2. Flutterアプリを起動（`flutter run -d chrome`）
3. フロントエンドからバックエンドAPIを呼び出し

## 技術スタック

### フロントエンド
- Flutter 3.35.3
- Dart

### バックエンド
- Node.js
- Express.js 5.1.0
- CORS対応
- 環境変数管理（dotenv）
- 自動リロード（nodemon）

## 今後の実装予定

- WebSocket通信（リアルタイム対戦）
- データベース連携
- 認証機能
- ゲームロジック実装