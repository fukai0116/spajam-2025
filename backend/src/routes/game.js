const express = require('express');
const router = express.Router();

// ゲーム関連のルート例

// マルチプレイルーム一覧取得
router.get('/rooms', (req, res) => {
  res.json({
    rooms: [
      {
        id: 'room1',
        name: 'ルーム1',
        players: 2,
        maxPlayers: 4,
        status: 'waiting'
      },
      {
        id: 'room2',
        name: 'ルーム2',
        players: 1,
        maxPlayers: 2,
        status: 'waiting'
      }
    ]
  });
});

// ルーム作成
router.post('/rooms', (req, res) => {
  const { name, maxPlayers } = req.body;
  
  const newRoom = {
    id: `room_${Date.now()}`,
    name: name || `ルーム_${Date.now()}`,
    players: 1,
    maxPlayers: maxPlayers || 2,
    status: 'waiting',
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({
    message: 'ルームが作成されました',
    room: newRoom
  });
});

// ルーム参加
router.post('/rooms/:roomId/join', (req, res) => {
  const { roomId } = req.params;
  const { playerId } = req.body;
  
  res.json({
    message: `ルーム ${roomId} に参加しました`,
    playerId,
    roomId
  });
});

module.exports = router;