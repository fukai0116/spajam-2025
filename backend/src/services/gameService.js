const { GameRoom, Player } = require('../models/Game');
const AdvancedDajareEvaluator = require('./openaiDajareEvaluator'); // OpenAI版に変更

class GameService {
  constructor() {
    this.rooms = new Map(); // roomId -> GameRoom
    this.playerToRoom = new Map(); // playerId -> roomId
    this.dajareEvaluator = new AdvancedDajareEvaluator();
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
    const result = room.addDajare(playerId, dajare, evaluation.finalScore);
    
    return {
      ...evaluation,
      room,
      dajareResult: result
    };
  }

  // ダジャレをAIで評価（OpenAI + あずきバーライフシステム版）
  async evaluateDajare(dajare, player) {
    try {
      // プレイヤーの効率修正と和を乱す人かどうかを考慮
      const isWerewolf = player.role === 'werewolf';
      
      // 難易度を動的に設定
      const difficulty = this.calculateDifficulty(player);
      
      // OpenAI評価を実行
      const evaluation = await this.dajareEvaluator.evaluateDajare(
        dajare, 
        player.efficiencyModifier,
        difficulty
      );
      
      // 和を乱す人の場合は評価を調整
      let finalScore = evaluation.score;
      if (isWerewolf) {
        finalScore = this.dajareEvaluator.applyWerewolfEffect(finalScore, true);
      }
      
      // あずきバーライフシステムを適用
      this.updateAzukiBarLife(player, evaluation.azukiBarLifeChange);
      
      // プレイヤーの成長システム
      this.updatePlayerGrowth(player, evaluation);
      
      return {
        ...evaluation,
        score: Math.round(finalScore * 10) / 10,
        finalScore: Math.round(finalScore),
        difficulty,
        playerLevel: player.level || 1,
        azukiBarLife: player.azukiBarLife || 100,
        azukiBarLifeChange: evaluation.azukiBarLifeChange
      };
    } catch (error) {
      console.error('Dajare evaluation error:', error);
      return {
        score: 0,
        finalScore: 0,
        breakdown: { thermal: 0, quality: 0, creativity: 0, sound: 0 },
        evaluation: 'エラーが発生しました',
        analysis: '分析できませんでした',
        recommendations: [],
        azukiBarLifeChange: 0,
        azukiBarLife: player.azukiBarLife || 100
      };
    }
  }

  // あずきバーライフシステム
  updateAzukiBarLife(player, lifeChange) {
    // プレイヤーにあずきバーライフを初期化
    if (player.azukiBarLife === undefined) {
      player.azukiBarLife = 100;
    }
    
    // ライフ変化を適用
    player.azukiBarLife = Math.max(0, Math.min(100, player.azukiBarLife + lifeChange));
    
    // ライフ変化ログ
    if (lifeChange !== 0) {
      const changeText = lifeChange > 0 ? `+${lifeChange}` : lifeChange.toString();
      console.log(`🍡 ${player.name}のあずきバーライフ: ${changeText} → ${player.azukiBarLife}/100`);
      
      // 特別なイベント
      if (player.azukiBarLife === 0) {
        console.log(`🧊 ${player.name}のあずきバーが完全に溶けました！`);
      } else if (player.azukiBarLife === 100) {
        console.log(`❄️ ${player.name}のあずきバーが最高の状態で凍っています！`);
      }
    }
    
    return player.azukiBarLife;
  }

  // あずきバーの状態を取得
  getAzukiBarStatus(azukiBarLife) {
    if (azukiBarLife >= 90) return { status: '完璧', emoji: '🧊', description: 'カチカチに凍って最高の状態' };
    if (azukiBarLife >= 70) return { status: '良好', emoji: '❄️', description: 'しっかり凍っている' };
    if (azukiBarLife >= 50) return { status: '普通', emoji: '🍡', description: '適度な固さ' };
    if (azukiBarLife >= 30) return { status: '軟化', emoji: '💧', description: '少し柔らかくなってきた' };
    if (azukiBarLife >= 10) return { status: '溶解中', emoji: '💦', description: 'かなり溶けている' };
    return { status: '完全溶解', emoji: '🌊', description: '完全に溶けてしまった' };
  }

  // 難易度の動的計算
  calculateDifficulty(player) {
    const level = player.level || 1;
    const submissions = player.submissions?.length || 0;
    
    if (level <= 2 && submissions <= 5) return 'easy';
    if (level <= 4 && submissions <= 15) return 'normal';
    if (level <= 6 && submissions <= 30) return 'hard';
    return 'expert';
  }

  // プレイヤーの成長システム
  updatePlayerGrowth(player, evaluation) {
    if (!player.stats) {
      player.stats = {
        totalEvaluations: 0,
        averageScore: 0,
        bestScore: 0,
        categoryScores: { thermal: 0, quality: 0, creativity: 0, sound: 0 }
      };
    }

    const stats = player.stats;
    stats.totalEvaluations++;
    
    // 平均スコアの更新
    stats.averageScore = ((stats.averageScore * (stats.totalEvaluations - 1)) + evaluation.score) / stats.totalEvaluations;
    
    // 最高スコアの更新
    if (evaluation.score > stats.bestScore) {
      stats.bestScore = evaluation.score;
    }

    // カテゴリ別スコアの更新
    Object.keys(stats.categoryScores).forEach(category => {
      if (evaluation.breakdown[category] !== undefined) {
        stats.categoryScores[category] = ((stats.categoryScores[category] * (stats.totalEvaluations - 1)) + evaluation.breakdown[category]) / stats.totalEvaluations;
      }
    });

    // レベルアップ判定
    const newLevel = Math.floor(stats.averageScore / 2) + 1;
    if (newLevel > (player.level || 1)) {
      player.level = newLevel;
      console.log(`🎉 ${player.name} がレベル ${newLevel} にアップしました！`);
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

  // 和を乱す人の特殊能力使用
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