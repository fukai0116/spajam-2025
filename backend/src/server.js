const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// 環境変数の読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア設定
app.use(cors()); // CORS設定
app.use(express.json()); // JSON形式のリクエストを解析
app.use(express.urlencoded({ extended: true })); // URLエンコードされたリクエストを解析

// ルートエンドポイント
app.get('/', (req, res) => {
  res.json({
    message: 'SPAJAM 2025 Backend API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API情報エンドポイント
app.get('/api', (req, res) => {
  res.json({
    message: 'SPAJAM 2025 API',
    endpoints: [
      'GET / - サーバー情報',
      'GET /api - API情報',
      'GET /api/health - ヘルスチェック'
    ]
  });
});

// ヘルスチェックエンドポイント
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 404エラーハンドリング
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// グローバルエラーハンドリング
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong!'
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
  console.log(`💓 Health Check: http://localhost:${PORT}/api/health`);
});

module.exports = app;