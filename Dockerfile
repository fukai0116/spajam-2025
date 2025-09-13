# Render.com用Dockerfile
FROM node:18-alpine

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY backend/package*.json ./

# 依存関係をインストール
RUN npm ci --only=production

# アプリケーションのソースをコピー
COPY backend/ .

# ポートを公開
EXPOSE 3000

# 本番環境用の起動コマンド
CMD ["npm", "start"]