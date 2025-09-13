# Heroku デプロイガイド

SPAJAM 2025 バックエンドAPIをHerokuにデプロイする手順です。

## 事前準備

### 必要なツール
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
- Git
- Node.js (v18以上)

### Heroku CLIのインストール確認
```bash
heroku --version
```

## デプロイ手順

### 1. Herokuにログイン
```bash
heroku login
```

### 2. Herokuアプリケーションの作成
```bash
# プロジェクトのbackendディレクトリに移動
cd backend

# Herokuアプリを作成（アプリ名は任意）
heroku create spajam2025-backend-[your-name]
```

### 3. 環境変数の設定
```bash
# 本番環境用の環境変数を設定
heroku config:set NODE_ENV=production
heroku config:set PORT=

# 必要に応じて他の環境変数も設定
# heroku config:set JWT_SECRET=your-secret-key
# heroku config:set DB_URL=your-database-url
```

### 4. デプロイ
```bash
# 初回デプロイ
git add .
git commit -m "Prepare for Heroku deployment"
git push heroku main

# または、メインブランチからデプロイする場合
git push heroku main:main
```

### 5. アプリケーションの確認
```bash
# アプリをブラウザで開く
heroku open

# ログを確認
heroku logs --tail
```

## デプロイ後の確認

デプロイが成功したら、以下のエンドポイントにアクセスして動作確認：

- **サーバー情報**: `https://your-app-name.herokuapp.com/`
- **API情報**: `https://your-app-name.herokuapp.com/api`
- **ヘルスチェック**: `https://your-app-name.herokuapp.com/api/health`

## よくある問題と解決方法

### 1. ビルドエラー
```bash
# ローカルでの動作確認
npm install
npm start

# package.jsonのenginesフィールドを確認
```

### 2. アプリケーションエラー
```bash
# Herokuのログを確認
heroku logs --tail

# 環境変数を確認
heroku config
```

### 3. CORS エラー
フロントエンドアプリのドメインを許可リストに追加：
- `src/server.js` の `allowedOrigins` を更新
- 再デプロイ

## 継続的デプロイ

### GitHub連携（推奨）
1. Heroku Dashboard でアプリを選択
2. "Deploy" タブ → "GitHub" を選択
3. リポジトリを連携
4. "Automatic deploys" を有効化

### 手動デプロイ
```bash
# 変更をプッシュしてデプロイ
git add .
git commit -m "Update: [変更内容]"
git push heroku main
```

## 監視とメンテナンス

### ログの監視
```bash
# リアルタイムログ
heroku logs --tail

# 過去のログ
heroku logs --num 100
```

### アプリの再起動
```bash
heroku restart
```

### パフォーマンス監視
```bash
# アプリの状態確認
heroku ps

# メトリクス確認（Heroku Dashboard）
```

## コスト管理

- 無料プランでは月550時間まで利用可能
- スリープ機能: 30分間非アクティブで自動スリープ
- 有料プラン($7/月～)でスリープ機能無効化可能

## トラブルシューティング

### よくあるエラーコード
- **H10**: アプリクラッシュ → `heroku logs --tail` でエラー確認
- **H14**: リクエストタイムアウト → パフォーマンス最適化
- **R10**: ブートタイムアウト → 起動時間の最適化

### サポートリソース
- [Heroku Dev Center](https://devcenter.heroku.com/)
- [Node.js on Heroku](https://devcenter.heroku.com/categories/nodejs-support)