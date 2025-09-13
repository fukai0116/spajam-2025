const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const WebSocketHandler = require('./services/webSocketHandler');

// 環境変数の読み込み
dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Socket.IO設定
const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      // 本番環境では特定のオリジンを許可、開発環境では全て許可
      if (NODE_ENV === 'development') {
        callback(null, true);
      } else {
        const allowedOrigins = [
          'https://your-flutter-web-app.herokuapp.com',
          'https://localhost:3000',
          'http://localhost:3000'
        ];
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// WebSocketハンドラー初期化
new WebSocketHandler(io);

// CORS設定（本番環境とローカル環境に対応）
const corsOptions = {
  origin: function (origin, callback) {
    // 本番環境では特定のオリジンを許可、開発環境では全て許可
    if (NODE_ENV === 'development') {
      callback(null, true);
    } else {
      // 本番環境での許可オリジンリスト（必要に応じて更新）
      const allowedOrigins = [
        'https://your-flutter-web-app.herokuapp.com',
        'https://localhost:3000',
        'http://localhost:3000'
      ];
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// ミドルウェア設定
app.use(cors(corsOptions)); // CORS設定
app.use(express.json()); // JSON形式のリクエストを解析
app.use(express.urlencoded({ extended: true })); // URLエンコードされたリクエストを解析

// 静的ファイル配信（テスト用）
app.use('/test', express.static('./'));

// ルート設定
const gameRoutes = require('./routes/game');
app.use('/api/game', gameRoutes);

// ルートエンドポイント
app.get('/', (req, res) => {
  res.json({
    message: 'SPAJAM 2025 Backend API Server',
    version: '1.0.0',
    environment: NODE_ENV,
    port: PORT,
    websocket: 'enabled',
    timestamp: new Date().toISOString()
  });
});

// API情報エンドポイント
app.get('/api', (req, res) => {
  res.json({
    message: 'SPAJAM 2025 API',
    environment: NODE_ENV,
    websocket: 'enabled',
    endpoints: [
      'GET / - サーバー情報',
      'GET /api - API情報',
      'GET /api/health - ヘルスチェック',
      'POST /api/game/auto-match - オートマッチング',
      'POST /api/game/rooms - ルーム作成',
      'POST /api/game/rooms/:roomId/join - ルーム参加',
      'POST /api/game/rooms/:roomId/dajare - ダジャレ投稿',
      'POST /api/game/rooms/:roomId/vote - 投票',
      'POST /api/game/rooms/:roomId/ability - 特殊能力使用',
      'DELETE /api/game/rooms/:roomId/leave - ルーム退出',
      'GET /api/game/rooms/:roomId/state - ゲーム状態取得',
      'WebSocket /socket.io - リアルタイム通信'
    ]
  });
});

// ヘルスチェックエンドポイント
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    websocket: 'enabled',
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
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SPAJAM 2025 Backend Server started!`);
  console.log(`📊 Environment: ${NODE_ENV}`);
  console.log(`🌐 Port: ${PORT}`);
  console.log(`🔌 WebSocket server enabled`);
  
  if (NODE_ENV === 'development') {
    console.log(`🏠 Local URL: http://localhost:${PORT}`);
    console.log(`🏠 Network URL: http://0.0.0.0:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
    console.log(`💓 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🔌 WebSocket URL: ws://localhost:${PORT}/socket.io`);
  } else {
    console.log(`🌍 Production server running on port ${PORT}`);
  }
});

module.exports = app;