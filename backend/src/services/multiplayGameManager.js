// マルチプレイゲーム管理クラス（フローチャート対応版）
const AdvancedDajareEvaluator = require('./openaiDajareEvaluator');

class MultiplayGameRoom {
  constructor(roomId, hostPlayerId, hostPlayerName, maxPlayers = 4) {
    this.roomId = roomId;
    this.hostPlayerId = hostPlayerId;
    this.status = 'waiting'; // waiting, playing, voting, finished
    this.maxPlayers = maxPlayers;
    this.players = new Map(); // playerId -> PlayerInfo
    this.spectators = new Map(); // spectatorId -> SpectatorInfo
    this.gameSettings = {
      timeLimit: 5 * 60 * 1000, // 5分
      votingTime: 30 * 1000, // 30秒
      roundTime: 60 * 1000, // 1分
      maxRounds: 3
    };
    this.currentRound = 0;
    this.currentPhase = 'waiting'; // waiting, dajare, voting, result
    this.startedAt = null;
    this.endedAt = null;
    this.dajareHistory = [];
    this.votingResults = new Map();
    this.dajareEvaluator = new AdvancedDajareEvaluator();
    this.currentDajareIndex = 0;
    this.roundResults = [];

    // ホストプレイヤーを追加
    this.addPlayer(hostPlayerId, hostPlayerName);
  }

  // プレイヤー追加
  addPlayer(playerId, playerName) {
    if (this.players.size >= this.maxPlayers) {
      throw new Error('ルームが満員です');
    }

    if (this.status !== 'waiting') {
      throw new Error('ゲーム進行中のため参加できません');
    }

    const player = {
      playerId,
      playerName,
      isHost: playerId === this.hostPlayerId,
      score: 0,
      azukiBarLife: 100,
      status: 'ready', // ready, not_ready, disconnected
      joinedAt: Date.now(),
      votedFor: null,
      lastDajare: null,
      dajareCount: 0
    };

    this.players.set(playerId, player);
    console.log(`🎮 ${playerName} がルーム ${this.roomId} に参加しました！`);
    
    return player;
  }

  // プレイヤー削除
  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) return false;

    this.players.delete(playerId);
    console.log(`👋 ${player.playerName} がルーム ${this.roomId} から退出しました`);

    // ホストが退出した場合、新しいホストを選出
    if (playerId === this.hostPlayerId && this.players.size > 0) {
      const newHost = this.players.values().next().value;
      this.hostPlayerId = newHost.playerId;
      newHost.isHost = true;
      console.log(`👑 ${newHost.playerName} が新しいホストになりました`);
    }

    // 全員退出したらルーム削除
    if (this.players.size === 0) {
      this.status = 'finished';
      return true; // ルーム削除フラグ
    }

    return false;
  }

  // スペクテーター追加
  addSpectator(spectatorId, spectatorName) {
    const spectator = {
      spectatorId,
      spectatorName,
      joinedAt: Date.now()
    };

    this.spectators.set(spectatorId, spectator);
    console.log(`👁️ ${spectatorName} がルーム ${this.roomId} を観戦開始`);
    
    return spectator;
  }

  // ゲーム開始
  startGame() {
    if (this.players.size < 2) {
      throw new Error('最低2人のプレイヤーが必要です');
    }

    this.status = 'playing';
    this.currentPhase = 'dajare';
    this.currentRound = 1;
    this.startedAt = Date.now();

    // 全プレイヤーのライフをリセット
    for (const player of this.players.values()) {
      player.azukiBarLife = 100;
      player.score = 0;
      player.dajareCount = 0;
    }

    console.log(`🚀 ルーム ${this.roomId} でゲーム開始！ (${this.players.size}人)`);
    return this.getGameState();
  }

  // ダジャレ投稿
  async submitDajare(playerId, dajare) {
    if (this.status !== 'playing' || this.currentPhase !== 'dajare') {
      throw new Error('ダジャレ投稿時間ではありません');
    }

    const player = this.players.get(playerId);
    if (!player) {
      throw new Error('プレイヤーが見つかりません');
    }

    if (player.lastDajare) {
      throw new Error('既にダジャレを投稿済みです');
    }

    // AI評価実行
    const evaluation = await this.dajareEvaluator.evaluateDajare(dajare);
    
    // ライフ変化計算（temperatureに統一）
    const temp = typeof evaluation.temperature === 'number' 
      ? evaluation.temperature 
      : (evaluation.breakdown?.thermal ?? 0);
    const lifeDelta = this.calculateLifeDelta(temp);
    player.azukiBarLife = Math.max(0, Math.min(100, player.azukiBarLife + lifeDelta));
    player.lastDajare = dajare;
    player.dajareCount++;

    const dajareEntry = {
      id: this.currentDajareIndex++,
      playerId,
      playerName: player.playerName,
      dajare,
      evaluation,
      lifeDelta,
      submittedAt: Date.now(),
      round: this.currentRound,
      votes: 0,
      voters: []
    };

    this.dajareHistory.push(dajareEntry);

    console.log(`💬 ${player.playerName}: "${dajare}" (${temp}度, ライフ変化: ${lifeDelta})`);

    // 全員投稿完了チェック
    if (this.hasAllPlayersSubmitted()) {
      await this.startVotingPhase();
    }

    return {
      dajareEntry,
      playerState: this.getPlayerState(playerId),
      gameState: this.getGameState()
    };
  }

  // 投票フェーズ開始
  async startVotingPhase() {
    this.currentPhase = 'voting';
    this.votingResults.clear();

    // 投票用のダジャレ一覧を作成（今回のラウンドのみ）
    const currentRoundDajares = this.dajareHistory.filter(d => d.round === this.currentRound);

    console.log(`🗳️ ルーム ${this.roomId} で投票フェーズ開始`);

    // 投票時間後に自動的に結果フェーズへ移行（タイマーIDを保存）
    this.votingTimer = setTimeout(() => {
      if (this.currentPhase === 'voting') {
        console.log(`⏰ ルーム ${this.roomId} 投票時間終了、結果処理開始`);
        this.processVotingResults();
      }
    }, this.gameSettings.votingTime);

    return {
      phase: 'voting',
      dajares: currentRoundDajares,
      timeLimit: this.gameSettings.votingTime,
      startedAt: Date.now()
    };
  }

  // 投票
  vote(playerId, dajareId) {
    if (this.currentPhase !== 'voting') {
      throw new Error('投票時間ではありません');
    }

    const player = this.players.get(playerId);
    if (!player) {
      throw new Error('プレイヤーが見つかりません');
    }

    // 自分のダジャレには投票できない
    const targetDajare = this.dajareHistory.find(d => d.id === dajareId);
    if (targetDajare && targetDajare.playerId === playerId) {
      throw new Error('自分のダジャレには投票できません');
    }

    // 既存の投票を取り消し
    if (player.votedFor !== null) {
      const prevDajare = this.dajareHistory.find(d => d.id === player.votedFor);
      if (prevDajare) {
        prevDajare.votes--;
        prevDajare.voters = prevDajare.voters.filter(v => v !== playerId);
      }
    }

    // 新しい投票を追加
    player.votedFor = dajareId;
    if (targetDajare) {
      targetDajare.votes++;
      targetDajare.voters.push(playerId);
    }

    console.log(`🗳️ ${player.playerName} が投票しました (ダジャレID: ${dajareId})`);

    // 全員投票完了チェック
    if (this.hasAllPlayersVoted()) {
      console.log(`✅ ルーム ${this.roomId} 全員投票完了、結果処理開始`);
      // タイマーをキャンセルして即座に結果処理
      if (this.votingTimer) {
        clearTimeout(this.votingTimer);
        this.votingTimer = null;
      }
      // 少し遅延させて処理（UIの更新時間を確保）
      setTimeout(() => {
        if (this.currentPhase === 'voting') {
          this.processVotingResults();
        }
      }, 1000);
    }

    return this.getVotingState();
  }

  // 投票結果処理
  processVotingResults() {
    if (this.currentPhase !== 'voting') {
      console.log(`⚠️ ルーム ${this.roomId} 投票フェーズではないため結果処理をスキップ`);
      return null;
    }

    this.currentPhase = 'result';

    // タイマーをクリア
    if (this.votingTimer) {
      clearTimeout(this.votingTimer);
      this.votingTimer = null;
    }

    // 今回のラウンドのダジャレを取得
    const currentRoundDajares = this.dajareHistory.filter(d => d.round === this.currentRound);
    
    // 投票結果によるスコア計算
    currentRoundDajares.forEach(dajare => {
      const player = this.players.get(dajare.playerId);
      if (player) {
        // 投票数に応じたボーナススコア
        const voteBonus = dajare.votes * 100;
        // AI評価スコア
        const aiScore = Math.max(0, dajare.evaluation.score) * 10;
        
        const totalScore = voteBonus + aiScore;
        player.score += totalScore;
        
        console.log(`📊 ${player.playerName}: 投票${dajare.votes}票(+${voteBonus}), AI評価(+${aiScore}) = +${totalScore}`);
      }
    });

    // ラウンド結果を保存
    const roundResult = {
      round: this.currentRound,
      dajares: currentRoundDajares,
      rankings: this.getCurrentRankings(),
      processedAt: Date.now()
    };
    this.roundResults.push(roundResult);

    console.log(`📊 ルーム ${this.roomId} ラウンド ${this.currentRound} 結果処理完了`);

    // 次のラウンドまたはゲーム終了（結果表示時間を確保）
    this.nextRoundTimer = setTimeout(() => {
      if (this.currentRound < this.gameSettings.maxRounds) {
        this.nextRound();
      } else {
        this.endGame();
      }
    }, 8000); // 8秒後

    return roundResult;
  }

  // 次のラウンド
  nextRound() {
    if (this.currentRound >= this.gameSettings.maxRounds) {
      console.log(`⚠️ ルーム ${this.roomId} 最終ラウンド到達、ゲーム終了へ`);
      this.endGame();
      return null;
    }

    this.currentRound++;
    this.currentPhase = 'dajare';

    // タイマーをクリア
    if (this.nextRoundTimer) {
      clearTimeout(this.nextRoundTimer);
      this.nextRoundTimer = null;
    }

    // プレイヤーの投票状態をリセット
    for (const player of this.players.values()) {
      player.votedFor = null;
      player.lastDajare = null;
    }

    console.log(`🔄 ルーム ${this.roomId} ラウンド ${this.currentRound} 開始`);
    
    // ラウンド開始のコールバックを追加
    if (this.onNextRound) {
      this.onNextRound(this.getGameState());
    }
    
    return this.getGameState();
  }

  // ゲーム終了
  endGame() {
    this.status = 'finished';
    this.currentPhase = 'finished';
    this.endedAt = Date.now();

    const finalResults = {
      rankings: this.getCurrentRankings(),
      roundResults: this.roundResults,
      totalDajares: this.dajareHistory.length,
      duration: this.endedAt - this.startedAt
    };

    console.log(`🏁 ルーム ${this.roomId} ゲーム終了`);
    return finalResults;
  }

  // ヘルパーメソッド
  hasAllPlayersSubmitted() {
    return Array.from(this.players.values()).every(p => p.lastDajare !== null);
  }

  hasAllPlayersVoted() {
    return Array.from(this.players.values()).every(p => p.votedFor !== null);
  }

  getCurrentRankings() {
    return Array.from(this.players.values())
      .sort((a, b) => b.score - a.score)
      .map((player, index) => ({
        rank: index + 1,
        playerId: player.playerId,
        playerName: player.playerName,
        score: player.score,
        azukiBarLife: player.azukiBarLife,
        dajareCount: player.dajareCount
      }));
  }

  calculateLifeDelta(temperature) {
    // シングルプレイと同様のロジック
    if (temperature <= -15) {
      return Math.floor(Math.random() * 15) + 10;
    } else if (temperature <= -5) {
      return Math.floor(Math.random() * 10) + 5;
    } else if (temperature < 0) {
      return Math.floor(Math.random() * 5) + 2;
    } else if (temperature <= 10) {
      return -(Math.floor(Math.random() * 5) + 2);
    } else if (temperature <= 25) {
      return -(Math.floor(Math.random() * 10) + 8);
    } else if (temperature <= 40) {
      return -(Math.floor(Math.random() * 15) + 15);
    } else {
      return -(Math.floor(Math.random() * 20) + 20);
    }
  }

  // 状態取得メソッド
  getGameState() {
    return {
      roomId: this.roomId,
      status: this.status,
      phase: this.currentPhase,
      round: this.currentRound,
      maxRounds: this.gameSettings.maxRounds,
      playerCount: this.players.size,
      maxPlayers: this.maxPlayers,
      hostPlayerId: this.hostPlayerId,
      startedAt: this.startedAt,
      timeRemaining: this.getTimeRemaining()
    };
  }

  getPlayerState(playerId) {
    const player = this.players.get(playerId);
    if (!player) return null;

    return {
      playerId: player.playerId,
      playerName: player.playerName,
      score: player.score,
      azukiBarLife: player.azukiBarLife,
      isHost: player.isHost,
      status: player.status,
      dajareCount: player.dajareCount,
      lastDajare: player.lastDajare,
      votedFor: player.votedFor
    };
  }

  getVotingState() {
    const currentRoundDajares = this.dajareHistory.filter(d => d.round === this.currentRound);
    return {
      phase: 'voting',
      dajares: currentRoundDajares.map(d => ({
        id: d.id,
        playerName: d.playerName,
        dajare: d.dajare,
        votes: d.votes,
        evaluation: {
          score: d.evaluation.score,
          temperature: (typeof d.evaluation.temperature === 'number' 
            ? d.evaluation.temperature 
            : (d.evaluation.breakdown?.thermal ?? 0)),
          comment: d.evaluation.comment ?? d.evaluation.evaluation
        }
      })),
      hasVoted: Array.from(this.players.values()).map(p => ({
        playerId: p.playerId,
        hasVoted: p.votedFor !== null
      }))
    };
  }

  getTimeRemaining() {
    if (!this.startedAt) return 0;
    
    const elapsed = Date.now() - this.startedAt;
    return Math.max(0, this.gameSettings.timeLimit - elapsed);
  }
}

class MultiplayGameManager {
  constructor() {
    this.rooms = new Map(); // roomId -> MultiplayGameRoom
    this.playerToRoom = new Map(); // playerId -> roomId
  }

  // ルーム作成
  createRoom(hostPlayerId, hostPlayerName, maxPlayers = 4) {
    const roomId = this.generateRoomId();
    const room = new MultiplayGameRoom(roomId, hostPlayerId, hostPlayerName, maxPlayers);
    
    this.rooms.set(roomId, room);
    this.playerToRoom.set(hostPlayerId, roomId);
    
    console.log(`🏠 ルーム ${roomId} が作成されました (ホスト: ${hostPlayerName})`);
    return room;
  }

  // ルーム参加
  joinRoom(roomId, playerId, playerName) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('ルームが見つかりません');
    }

    const player = room.addPlayer(playerId, playerName);
    this.playerToRoom.set(playerId, roomId);
    
    return { room, player };
  }

  // ルーム検索
  findAvailableRoom() {
    for (const room of this.rooms.values()) {
      if (room.status === 'waiting' && room.players.size < room.maxPlayers) {
        return room;
      }
    }
    return null;
  }

  // オートマッチング
  autoMatch(playerId, playerName) {
    let room = this.findAvailableRoom();
    
    if (!room) {
      // 新しいルームを作成
      room = this.createRoom(playerId, playerName);
      return { room, isNewRoom: true };
    } else {
      // 既存のルームに参加
      const player = room.addPlayer(playerId, playerName);
      this.playerToRoom.set(playerId, room.roomId);
      return { room, player, isNewRoom: false };
    }
  }

  // プレイヤー退出
  leaveRoom(playerId) {
    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return false;

    const room = this.rooms.get(roomId);
    if (!room) return false;

    const shouldDeleteRoom = room.removePlayer(playerId);
    this.playerToRoom.delete(playerId);

    if (shouldDeleteRoom) {
      this.rooms.delete(roomId);
      console.log(`🗑️ ルーム ${roomId} が削除されました`);
    }

    return true;
  }

  // ルーム取得
  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  // プレイヤーのルーム取得
  getPlayerRoom(playerId) {
    const roomId = this.playerToRoom.get(playerId);
    return roomId ? this.rooms.get(roomId) : null;
  }

  // ルームID生成
  generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // 全ルーム情報取得（管理用）
  getAllRooms() {
    return Array.from(this.rooms.values()).map(room => ({
      roomId: room.roomId,
      status: room.status,
      playerCount: room.players.size,
      maxPlayers: room.maxPlayers,
      hostPlayerName: room.players.get(room.hostPlayerId)?.playerName,
      round: room.currentRound,
      phase: room.currentPhase
    }));
  }

  // 定期クリーンアップ
  cleanup() {
    const now = Date.now();
    const expiredRooms = [];

    for (const [roomId, room] of this.rooms) {
      // 30分以上経過したルームを削除
      const roomAge = now - (room.startedAt || room.players.get(room.hostPlayerId)?.joinedAt || now);
      if (roomAge > 30 * 60 * 1000) {
        expiredRooms.push(roomId);
      }
    }

    expiredRooms.forEach(roomId => {
      const room = this.rooms.get(roomId);
      if (room) {
        // プレイヤーのマッピングも削除
        for (const playerId of room.players.keys()) {
          this.playerToRoom.delete(playerId);
        }
        this.rooms.delete(roomId);
        console.log(`🧹 期限切れルーム ${roomId} を削除しました`);
      }
    });

    return expiredRooms.length;
  }
}

module.exports = MultiplayGameManager;
