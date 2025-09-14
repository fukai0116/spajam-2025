const express = require('express');
const router = express.Router();
const gameService = require('../services/gameService');

// ゲーム関連のルート

// オートマッチング（推奨）
router.post('/auto-match', (req, res) => {
  try {
    const { playerId, playerName } = req.body;
    
    if (!playerId || !playerName) {
      return res.status(400).json({
        error: 'Player ID and name are required'
      });
    }

    const { room, player } = gameService.autoMatch(playerId, playerName, null);
    
    res.json({
      success: true,
      room: {
        id: room.id,
        status: room.status,
        players: room.players.map(p => ({
          id: p.id,
          name: p.name,
          isAlive: p.isAlive
        })),
        playerCount: room.players.length,
        maxPlayers: room.maxPlayers
      },
      player: {
        id: player.id,
        name: player.name,
        role: player.role
      }
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

// ルーム作成
router.post('/rooms', (req, res) => {
  try {
    const { playerId, playerName } = req.body;
    
    if (!playerId || !playerName) {
      return res.status(400).json({
        error: 'Player ID and name are required'
      });
    }

    const { room, player } = gameService.createRoom(playerId, playerName, null);
    
    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room: {
        id: room.id,
        status: room.status,
        players: room.players.map(p => ({
          id: p.id,
          name: p.name
        })),
        playerCount: room.players.length,
        maxPlayers: room.maxPlayers,
        createdAt: room.createdAt
      },
      player: {
        id: player.id,
        name: player.name
      }
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

// ルーム参加
router.post('/rooms/:roomId/join', (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId, playerName } = req.body;
    
    if (!playerId || !playerName) {
      return res.status(400).json({
        error: 'Player ID and name are required'
      });
    }

    const { room, player } = gameService.joinRoom(roomId, playerId, playerName, null);
    
    res.json({
      success: true,
      message: `Joined room ${roomId}`,
      room: {
        id: room.id,
        status: room.status,
        players: room.players.map(p => ({
          id: p.id,
          name: p.name
        })),
        playerCount: room.players.length,
        maxPlayers: room.maxPlayers
      },
      player: {
        id: player.id,
        name: player.name,
        role: player.role
      }
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

// ルーム状態取得
router.get('/rooms/:roomId', (req, res) => {
  try {
    const { roomId } = req.params;
    const roomState = gameService.getRoomState(roomId);
    
    if (!roomState) {
      return res.status(404).json({
        error: 'Room not found'
      });
    }
    
    res.json({
      success: true,
      room: roomState
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

// ダジャレ投稿
router.post('/rooms/:roomId/dajare', async (req, res) => {
  try {
    const { playerId, dajare } = req.body;
    
    if (!playerId || !dajare) {
      return res.status(400).json({
        error: 'Player ID and dajare are required'
      });
    }

    const { room, dajareResult } = await gameService.submitDajare(playerId, dajare);
    
    res.json({
      success: true,
      message: 'Dajare submitted successfully',
      result: dajareResult,
      gameState: {
        azukiBarDurability: room.azukiBarDurability,
        timeRemaining: room.getRemainingTime(),
        status: room.status
      }
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

// 投票
router.post('/rooms/:roomId/vote', (req, res) => {
  try {
    const { playerId, targetId } = req.body;
    
    if (!playerId || !targetId) {
      return res.status(400).json({
        error: 'Player ID and target ID are required'
      });
    }

    const room = gameService.vote(playerId, targetId);
    
    res.json({
      success: true,
      message: 'Vote submitted',
      gameState: room.getGameState()
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

// 和を乱す人の特殊能力使用
router.post('/rooms/:roomId/werewolf-ability', (req, res) => {
  try {
    const { playerId } = req.body;
    
    if (!playerId) {
      return res.status(400).json({
        error: 'Player ID is required'
      });
    }

    const room = gameService.useWerewolfAbility(playerId);
    
    res.json({
      success: true,
      message: 'Werewolf ability used',
      gameState: room.getGameState()
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

// プレイヤーの退出
router.post('/leave', (req, res) => {
  try {
    const { playerId } = req.body;
    
    if (!playerId) {
      return res.status(400).json({
        error: 'Player ID is required'
      });
    }

    const room = gameService.leaveRoom(playerId);
    
    res.json({
      success: true,
      message: 'Left the room',
      room: room ? room.getGameState() : null
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

// デバッグ用：全ルーム一覧
router.get('/debug/rooms', (req, res) => {
  res.json({
    success: true,
    rooms: gameService.getAllRooms()
  });
});

module.exports = router;