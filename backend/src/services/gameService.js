const { GameRoom, Player } = require('../models/Game');
const { DajareEvaluator } = require('./dajareEvaluator');

class GameService {
  constructor() {
    this.rooms = new Map(); // roomId -> GameRoom
    this.playerToRoom = new Map(); // playerId -> roomId
    this.dajareEvaluator = new DajareEvaluator();
  }

  // ルーム作成
  createRoom(playerId, playerName, socketId) {
    const roomId = this.generateRoomId();
    const room = new GameRoom(roomId);
    const player = new Player(playerId, playerName, socketId);
    
    room.addPlayer(player);
    this.rooms.set(roomId, room);
    this.playerToRoom.set(playerId, roomId);
    
    return { room, player };
  }

  // ルーム参加
  joinRoom(roomId, playerId, playerName, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    const player = new Player(playerId, playerName, socketId);
    room.addPlayer(player);
    this.playerToRoom.set(playerId, roomId);
    
    return { room, player };
  }

  // 利用可能なルームを検索（オートマッチング用）
  findAvailableRoom() {
    for (const room of this.rooms.values()) {
      if (room.status === 'waiting' && room.players.length < room.maxPlayers) {
        return room;
      }
    }
    return null;
  }

  // オートマッチング
  autoMatch(playerId, playerName, socketId) {
    // 既存の待機中ルームを検索
    let room = this.findAvailableRoom();
    
    if (room) {
      // 既存ルームに参加
      const player = new Player(playerId, playerName, socketId);
      room.addPlayer(player);
      this.playerToRoom.set(playerId, room.id);
      return { room, player };
    } else {
      // 新しいルームを作成
      return this.createRoom(playerId, playerName, socketId);
    }
  }

  // プレイヤーが所属するルームを取得
  getPlayerRoom(playerId) {
    const roomId = this.playerToRoom.get(playerId);
    return roomId ? this.rooms.get(roomId) : null;
  }

  // ダジャレを投稿
  async submitDajare(playerId, dajare) {
    const room = this.getPlayerRoom(playerId);
    if (!room) {
      throw new Error('Player not in any room');
    }
    
    if (room.status !== 'playing') {
      throw new Error('Game not in progress');
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found in room');
    }

    // AI評価を取得
    const evaluation = await this.evaluateDajare(dajare, player);
    
    // ゲームに反映
    const result = room.addDajare(playerId, dajare, evaluation.score);
    
    return {
      room,
      dajareResult: {
        ...result,
        evaluation: evaluation.evaluation,
        breakdown: evaluation.breakdown
      }
    };
  }

  // ダジャレをAIで評価
  async evaluateDajare(dajare, player) {
    try {
      // プレイヤーの効率修正と人狼かどうかを考慮
      const isWerewolf = player.role === 'werewolf';
      const evaluation = await this.dajareEvaluator.evaluateDajare(dajare, player.efficiencyModifier);
      
      // 人狼の場合は評価を調整
      let finalScore = evaluation.score;
      if (isWerewolf) {
        finalScore = this.dajareEvaluator.applyWerewolfEffect(finalScore, true);
      }
      
      return {
        ...evaluation,
        score: Math.round(finalScore)
      };
    } catch (error) {
      console.error('Dajare evaluation error:', error);
      // エラー時はランダムな値を返す
      return {
        score: Math.floor(Math.random() * 21) - 10,
        breakdown: { thermal: 0, quality: 0, creativity: 0 },
        evaluation: 'AI評価でエラーが発生しました'
      };
    }
  }

  // 投票
  vote(playerId, targetId) {
    const room = this.getPlayerRoom(playerId);
    if (!room) {
      throw new Error('Player not in any room');
    }
    
    room.addVote(playerId, targetId);
    return room;
  }

  // 人狼の特殊能力使用
  useWerewolfAbility(playerId) {
    const room = this.getPlayerRoom(playerId);
    if (!room) {
      throw new Error('Player not in any room');
    }
    
    room.useWerewolfAbility(playerId);
    return room;
  }

  // プレイヤー退出
  leaveRoom(playerId) {
    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return null;
    
    const room = this.rooms.get(roomId);
    if (room) {
      room.removePlayer(playerId);
      
      // ルームが空になったら削除
      if (room.players.length === 0) {
        this.rooms.delete(roomId);
      }
    }
    
    this.playerToRoom.delete(playerId);
    return room;
  }

  // ルーム一覧取得（デバッグ用）
  getAllRooms() {
    return Array.from(this.rooms.values()).map(room => ({
      id: room.id,
      status: room.status,
      playerCount: room.players.length,
      maxPlayers: room.maxPlayers,
      createdAt: room.createdAt
    }));
  }

  // ルーム状態取得
  getRoomState(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.getGameState() : null;
  }

  // ランダムなルームIDを生成
  generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // 定期的なゲーム状態チェック（タイマー用）
  checkAllGames() {
    for (const room of this.rooms.values()) {
      if (room.status === 'playing') {
        room.checkWinCondition();
      }
    }
  }
}

// シングルトンとして export
const gameService = new GameService();

// 定期的にゲーム状態をチェック
setInterval(() => {
  gameService.checkAllGames();
}, 1000); // 1秒ごと

module.exports = gameService;