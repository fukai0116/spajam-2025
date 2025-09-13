const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const WebSocketHandler = require('./services/webSocketHandler');

// 環境変数の読み込み
dotenv.config();

// 環境変数の確認
console.log('🔧 Environment Variables Check:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
console.log(`PORT: ${process.env.PORT || 'undefined'}`);
console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'}`);

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
          'https://spajam2025-frontend.onrender.com',
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
        'https://spajam2025-frontend.onrender.com',
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

// ルート設定
const gameRoutes = require('./routes/game');
app.use('/api/game', gameRoutes);

// AIダジャレ評価API
const AdvancedDajareEvaluator = require('./services/openaiDajareEvaluator');
const SingleGameManager = require('./services/singleGameManager');

const dajareEvaluator = new AdvancedDajareEvaluator();
const singleGameManager = new SingleGameManager();

// 定期的なセッションクリーンアップ
setInterval(() => {
  singleGameManager.cleanupSessions();
}, 60000); // 1分ごと

app.post('/api/evaluate-dajare', async (req, res) => {
  try {
    const { dajare } = req.body;
    
    if (!dajare || typeof dajare !== 'string') {
      return res.status(400).json({
        error: 'ダジャレが必要です',
        message: 'dajareフィールドに文字列を指定してください'
      });
    }

    // AI評価を実行
    const evaluation = await dajareEvaluator.evaluateDajare(dajare);
    
    res.json({
      ...evaluation,
      dajare: dajare,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('ダジャレ評価エラー:', error);
    res.status(500).json({
      error: 'AI評価エラー',
      message: 'ダジャレの評価中にエラーが発生しました'
    });
  }
});

// シングルプレイゲーム開始
app.post('/api/game/single/start', (req, res) => {
  try {
    const { playerId, playerName } = req.body;
    
    if (!playerId || !playerName) {
      return res.status(400).json({
        error: 'プレイヤー情報が必要です',
        message: 'playerIdとplayerNameを指定してください'
      });
    }

    const gameState = singleGameManager.startGame(playerId, playerName);
    
    res.json({
      success: true,
      gameState,
      message: 'ゲームが開始されました！'
    });
    
  } catch (error) {
    console.error('ゲーム開始エラー:', error);
    res.status(500).json({
      error: 'ゲーム開始エラー',
      message: 'ゲームの開始中にエラーが発生しました'
    });
  }
});

// シングルプレイでダジャレ評価
app.post('/api/game/single/dajare', async (req, res) => {
  try {
    const { playerId, dajare } = req.body;
    
    if (!playerId || !dajare) {
      return res.status(400).json({
        error: 'プレイヤーIDとダジャレが必要です',
        message: 'playerIdとdajareを指定してください'
      });
    }

    const result = await singleGameManager.evaluateDajare(playerId, dajare);
    
    res.json({
      success: true,
      result,
      message: '評価が完了しました'
    });
    
  } catch (error) {
    console.error('ダジャレ評価エラー:', error);
    res.status(500).json({
      error: 'ダジャレ評価エラー',
      message: error.message
    });
  }
});

// ゲーム状態取得
app.get('/api/game/single/:playerId/state', (req, res) => {
  try {
    const { playerId } = req.params;
    
    const gameState = singleGameManager.getGameState(playerId);
    
    res.json({
      success: true,
      gameState
    });
    
  } catch (error) {
    console.error('ゲーム状態取得エラー:', error);
    res.status(404).json({
      error: 'ゲーム状態取得エラー',
      message: error.message
    });
  }
});

// ゲーム終了
app.post('/api/game/single/:playerId/end', (req, res) => {
  try {
    const { playerId } = req.params;
    
    const report = singleGameManager.endGame(playerId);
    
    res.json({
      success: true,
      report,
      message: 'ゲームが終了しました'
    });
    
  } catch (error) {
    console.error('ゲーム終了エラー:', error);
    res.status(500).json({
      error: 'ゲーム終了エラー',
      message: error.message
    });
  }
});

// ゲームレポート取得
app.get('/api/game/single/:playerId/report', (req, res) => {
  try {
    const { playerId } = req.params;
    
    const report = singleGameManager.getGameReport(playerId);
    
    res.json({
      success: true,
      report
    });
    
  } catch (error) {
    console.error('レポート取得エラー:', error);
    res.status(404).json({
      error: 'レポート取得エラー',
      message: error.message
    });
  }
});

// 静的ファイル配信（テスト用HTML含む）
app.use(express.static('./'));

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
httpServer.listen(PORT, () => {
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