# SPAJAM 2025 - あずきバー溶かし合戦

## 🚀 Render.com デプロイ手順

### 1. Render.comアカウント作成
1. [Render.com](https://render.com)にアクセス
2. GitHubアカウントでサインアップ

### 2. サービス作成
1. ダッシュボードで「New +」をクリック
2. 「Web Service」を選択
3. GitHubリポジトリを接続

### 3. デプロイ設定
**Basic Info:**
- Name: `spajam2025-backend`
- Branch: `feature/fukai-01`
- Root Directory: `backend` ⚠️ **重要: 必ずbackendを指定**

**Build & Deploy:**
- Runtime: `Node`
- Build Command: `npm ci`
- Start Command: `npm start`

**Environment Variables:**
- `NODE_ENV`: `production`
- `PORT`: `3000`
- `OPENAI_API_KEY`: `[OpenAI APIキーを設定]`

### 3-2. 📝 重要な設定ポイント
1. **Root Directory**: 必ず `backend` を設定してください
2. **Build Command**: `npm ci` のみ（cdコマンドは不要）
3. **Start Command**: `npm start` のみ（cdコマンドは不要）
4. Root Directoryを設定すると、Render.comが自動的にbackendフォルダを基準にします

### 4. デプロイ実行
1. 「Create Web Service」をクリック
2. 自動デプロイが開始されます
3. デプロイ完了後、URLが発行されます

### 5. Flutter側の設定更新
デプロイ完了後、発行されたURLを使用してFlutter側の設定を更新：

```dart
// lib/config/app_config.dart
static String get serverUrl {
  if (isProduction) {
    return 'https://[あなたのサービス名].onrender.com'; // ここを更新
  } else {
    return 'http://localhost:3000';
  }
}
```

## 📱 Flutter Web デプロイ（オプション）

Flutter WebもRender.comにデプロイしたい場合：

### 1. 静的サイト用設定
```dockerfile
# Dockerfile.flutter
FROM cirrusci/flutter:stable as build

WORKDIR /app
COPY . /app
RUN flutter build web

FROM nginx:alpine
COPY --from=build /app/build/web /usr/share/nginx/html
```

### 2. Render.com設定
- Service Type: `Static Site`
- Build Command: `flutter build web`
- Publish Directory: `build/web`

## 🔧 開発環境

### ローカル開発
```bash
# バックエンド起動
cd backend
npm install
npm run dev

# Flutter起動
flutter run -d chrome
```

### 環境変数（.env）
```
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
```

## 🎮 ゲーム機能

### シングルプレイ
- AIダジャレ評価システム
- あずきバーライフシステム
- 温度による難易度調整

### マルチプレイ
- リアルタイム対戦（Socket.IO）
- ルーム作成・参加
- 投票システム
- ラウンド制ゲーム

## 📁 ファイル構造

```
backend/
├── src/
│   ├── server.js              # メインサーバー
│   ├── services/
│   │   ├── multiplayGameManager.js  # マルチプレイ管理
│   │   ├── webSocketHandler.js      # WebSocket処理
│   │   ├── openaiDajareEvaluator.js # AI評価
│   │   └── singleGameManager.js     # シングルプレイ管理
│   └── routes/
├── package.json
└── .env

lib/
├── screens/
│   ├── multiplay_menu_screen.dart     # マルチプレイメニュー
│   ├── room_select_screen.dart        # ルーム選択
│   ├── multiplay_room_screen.dart     # マルチプレイルーム
│   └── single_play_screen.dart        # シングルプレイ
├── services/
│   ├── multiplay_game_service.dart    # マルチプレイサービス
│   └── single_game_service.dart       # シングルプレイサービス
└── config/
    └── app_config.dart                # 環境設定
```

## 🌐 API エンドポイント

### シングルプレイ
- `POST /api/game/single/start` - ゲーム開始
- `POST /api/game/single/dajare` - ダジャレ評価
- `GET /api/game/single/:id/state` - ゲーム状態取得

### マルチプレイ（WebSocket）
- `create_room` - ルーム作成
- `join_room` - ルーム参加
- `submit_dajare` - ダジャレ投稿
- `vote` - 投票

## 🐛 トラブルシューティング

### よくある問題

1. **npm start エラー (Missing script: "start")**
   - Root Directoryが `backend` に設定されているか確認
   - Build Command: `npm ci` (cdコマンドなし)
   - Start Command: `npm start` (cdコマンドなし)

2. **CORS エラー**
   - server.jsのallowedOriginsにフロントエンドのURLを追加

3. **WebSocket接続エラー**
   - HTTPSが必要（Render.comは自動で提供）

4. **OpenAI API エラー**
   - 環境変数 `OPENAI_API_KEY` が正しく設定されているか確認

### デプロイエラーの対処法

**エラー: "npm error Missing script: start"**
```bash
# 解決策:
1. Render.comダッシュボードで設定を確認
2. Root Directory = "backend" に設定
3. Build Command = "npm ci" に設定
4. Start Command = "npm start" に設定
```

**エラー: "Cannot find module"**
```bash
# 解決策:
1. package.jsonの依存関係を確認
2. Build Commandで npm ci が実行されているか確認
```

#### 502 Bad Gateway エラー

```bash
# 502エラーは以下の原因が考えられます:
1. サーバーが正しいポートでリッスンしていない
   - PORT環境変数が正しく設定されているか確認
   - listen(PORT)でホストを指定しない（Render.comが自動設定）

2. 環境変数が正しく設定されていない
   - Render.comのEnvironment Variablesを確認
   - OPENAI_API_KEY、NODE_ENV等が設定済みか確認

3. アプリケーションがクラッシュしている
   - Render.comのLogsタブでエラーログを確認
   - 依存関係の問題やコードエラーがないか確認

4. ヘルスチェック失敗
   - /api/health エンドポイントが正常に応答するか確認
   - アプリケーションの起動が完了しているか確認

# 解決手順:
1. Render.comダッシュボード → Services → あなたのサービス → Logs
2. エラーログを確認して根本原因を特定
3. 必要に応じて環境変数やコードを修正
4. Manual Deploy をクリックして再デプロイ
```

### ログ確認

Render.comのダッシュボードでリアルタイムログを確認できます。

## 📝 注意事項

- **無料プランの制限**: 月750時間まで無料
- **スリープ機能**: 15分間アクセスがないとスリープ状態になります
- **起動時間**: スリープから復帰時に数秒の起動時間があります