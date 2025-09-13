// ゲームの基本データモデル

class Player {
  constructor(id, name, socketId) {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.role = null; // 'citizen' | 'werewolf'
    this.isAlive = true;
    this.efficiencyModifier = 1.0; // 人狼の能力で変化
    this.lastAbilityUse = null;
    this.joinedAt = new Date();
  }

  setRole(role) {
    this.role = role;
  }

  applyEfficiencyModifier(modifier) {
    this.efficiencyModifier = Math.max(0.1, Math.min(2.0, modifier));
  }

  canUseAbility() {
    if (this.role !== 'werewolf') return false;
    if (!this.lastAbilityUse) return true;
    
    const cooldownMs = 30000; // 30秒のクールダウン
    return Date.now() - this.lastAbilityUse > cooldownMs;
  }

  useAbility() {
    if (this.canUseAbility()) {
      this.lastAbilityUse = Date.now();
      return true;
    }
    return false;
  }
}

class GameRoom {
  constructor(id) {
    this.id = id;
    this.players = [];
    this.status = 'waiting'; // 'waiting' | 'playing' | 'finished'
    this.azukiBarDurability = 90; // 最大90
    this.maxPlayers = 4;
    this.gameStartTime = null;
    this.gameEndTime = null;
    this.gameDuration = 5 * 60 * 1000; // 5分（ミリ秒）
    this.createdAt = new Date();
    this.dajareHistory = [];
    this.votes = new Map(); // playerId -> targetPlayerId
    this.votingPhase = false;
  }

  addPlayer(player) {
    if (this.players.length >= this.maxPlayers) {
      throw new Error('Room is full');
    }
    if (this.status !== 'waiting') {
      throw new Error('Game already started');
    }
    
    this.players.push(player);
    
    // 4人揃ったらゲーム開始準備
    if (this.players.length === this.maxPlayers) {
      this.prepareGame();
    }
    
    return true;
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
    
    // ゲーム中に人が抜けた場合の処理
    if (this.status === 'playing' && this.players.length < 2) {
      this.endGame('insufficient_players');
    }
  }

  prepareGame() {
    // ランダムに人狼を1人選択
    const werewolfIndex = Math.floor(Math.random() * this.players.length);
    
    this.players.forEach((player, index) => {
      if (index === werewolfIndex) {
        player.setRole('werewolf');
      } else {
        player.setRole('citizen');
      }
    });

    // ゲーム開始
    this.startGame();
  }

  startGame() {
    this.status = 'playing';
    this.gameStartTime = new Date();
    this.azukiBarDurability = 90;
  }

  getRemainingTime() {
    if (!this.gameStartTime) return this.gameDuration;
    const elapsed = Date.now() - this.gameStartTime.getTime();
    return Math.max(0, this.gameDuration - elapsed);
  }

  isGameTimeUp() {
    return this.getRemainingTime() <= 0;
  }

  addDajare(playerId, dajare, score) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) throw new Error('Player not found');

    // プレイヤーの効率修正を適用
    const modifiedScore = score * player.efficiencyModifier;
    
    // あずきバーの耐久値を更新
    this.azukiBarDurability = Math.max(0, Math.min(90, 
      this.azukiBarDurability - modifiedScore
    ));

    const dajareEntry = {
      playerId,
      playerName: player.name,
      dajare,
      originalScore: score,
      modifiedScore,
      timestamp: new Date(),
      durabilityAfter: this.azukiBarDurability
    };

    this.dajareHistory.push(dajareEntry);
    
    // 勝利条件チェック
    this.checkWinCondition();
    
    return dajareEntry;
  }

  addVote(voterId, targetId) {
    if (!this.votingPhase) {
      throw new Error('Not in voting phase');
    }
    
    const voter = this.players.find(p => p.id === voterId);
    const target = this.players.find(p => p.id === targetId);
    
    if (!voter || !target) {
      throw new Error('Invalid player');
    }
    
    this.votes.set(voterId, targetId);
    
    // 全員が投票したかチェック
    if (this.votes.size === this.players.filter(p => p.isAlive).length) {
      this.processVotes();
    }
  }

  processVotes() {
    // 票数を集計
    const voteCount = new Map();
    for (const targetId of this.votes.values()) {
      voteCount.set(targetId, (voteCount.get(targetId) || 0) + 1);
    }

    // 最多得票者を特定
    let maxVotes = 0;
    let eliminatedPlayerId = null;
    
    for (const [playerId, votes] of voteCount) {
      if (votes > maxVotes) {
        maxVotes = votes;
        eliminatedPlayerId = playerId;
      }
    }

    // プレイヤーを追放
    if (eliminatedPlayerId) {
      const eliminatedPlayer = this.players.find(p => p.id === eliminatedPlayerId);
      if (eliminatedPlayer) {
        eliminatedPlayer.isAlive = false;
        
        // 人狼が追放されたかチェック
        if (eliminatedPlayer.role === 'werewolf') {
          this.endGame('citizens_win_by_vote');
        }
      }
    }

    // 投票フェーズ終了
    this.votingPhase = false;
    this.votes.clear();
  }

  useWerewolfAbility(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.role !== 'werewolf') {
      throw new Error('Only werewolves can use this ability');
    }

    if (!player.useAbility()) {
      throw new Error('Ability is on cooldown');
    }

    // 他の全プレイヤーの効率を下げる
    this.players.forEach(p => {
      if (p.id !== playerId) {
        p.applyEfficiencyModifier(p.efficiencyModifier * 0.8); // 20%効率ダウン
      }
    });

    return true;
  }

  checkWinCondition() {
    // 時間切れチェック
    if (this.isGameTimeUp()) {
      this.endGame('werewolf_win_timeout');
      return;
    }

    // あずきバーが完全に溶けたかチェック
    if (this.azukiBarDurability <= 0) {
      this.endGame('citizens_win_melt');
      return;
    }

    // 人狼が全員追放されたかチェック
    const aliveWerewolves = this.players.filter(p => 
      p.isAlive && p.role === 'werewolf'
    );
    
    if (aliveWerewolves.length === 0) {
      this.endGame('citizens_win_eliminate');
      return;
    }
  }

  endGame(reason) {
    this.status = 'finished';
    this.gameEndTime = new Date();
    this.endReason = reason;
  }

  getGameState() {
    return {
      id: this.id,
      status: this.status,
      azukiBarDurability: this.azukiBarDurability,
      timeRemaining: this.getRemainingTime(),
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
        isAlive: p.isAlive,
        efficiencyModifier: p.efficiencyModifier
      })),
      dajareHistory: this.dajareHistory.slice(-10), // 最新10件
      votingPhase: this.votingPhase,
      endReason: this.endReason
    };
  }
}

module.exports = { Player, GameRoom };