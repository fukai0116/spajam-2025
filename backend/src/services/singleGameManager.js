// シングルプレイゲーム管理クラス
const AdvancedDajareEvaluator = require('./openaiDajareEvaluator');

class SingleGameSession {
  constructor(playerId, playerName) {
    this.id = this.generateSessionId();
    this.playerId = playerId;
    this.playerName = playerName;
    this.status = 'playing';
    this.azukiBarLife = 100;
    this.timeLimit = 5 * 60 * 1000; // 5分
    this.startedAt = Date.now();
    this.endedAt = null;
    this.dajareHistory = [];
    this.score = 0;
    this.dajareEvaluator = new AdvancedDajareEvaluator();
  }

  // セッションID生成
  generateSessionId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // 残り時間を取得
  getTimeRemaining() {
    if (this.status !== 'playing') return 0;
    const elapsed = Date.now() - this.startedAt;
    return Math.max(0, this.timeLimit - elapsed);
  }

  // ダジャレを評価
  async evaluateDajare(dajare) {
    if (this.status !== 'playing') {
      throw new Error('ゲームが進行中ではありません');
    }

    if (this.getTimeRemaining() <= 0) {
      this.endGame('timeout');
      throw new Error('時間切れです');
    }

    // AI評価を実行
    const evaluation = await this.dajareEvaluator.evaluateDajare(dajare);
    
    // 温度に基づいてライフ変化を計算
    const lifeDelta = this.calculateLifeDelta(evaluation.temperature);
    
    // あずきバーライフを更新
    const oldLife = this.azukiBarLife;
    this.azukiBarLife = Math.max(0, Math.min(100, this.azukiBarLife + lifeDelta));
    
    console.log(`🍡 ${this.playerName}のあずきバーライフ: ${lifeDelta > 0 ? '+' : ''}${lifeDelta} → ${this.azukiBarLife}/100`);
    
    if (this.azukiBarLife === 0 && oldLife > 0) {
      console.log(`🎉 ${this.playerName}があずきバーを完全に溶かしました！`);
    } else if (this.azukiBarLife === 100 && lifeDelta > 0) {
      console.log(`❄️ ${this.playerName}のあずきバーが最高の状態で凍りました！`);
    }
    
    // 履歴に追加
    const evaluationRecord = {
      dajare,
      evaluation,
      lifeDelta,
      azukiBarLifeAfter: this.azukiBarLife,
      timestamp: Date.now()
    };
    this.dajareHistory.push(evaluationRecord);
    
    // スコア更新
    this.updateScore(evaluation);
    
    // ゲーム終了条件チェック
    if (this.azukiBarLife <= 0) {
      this.endGame('victory');
    }
    
    return {
      dajare,
      evaluation,
      lifeDelta,
      gameState: this.getGameState()
    };
  }

  // 温度に基づくライフ変化の計算
  calculateLifeDelta(temperature) {
    // 寒いダジャレ（マイナス温度）ほどあずきバーが溶ける（ライフ減少）
    // 暑いダジャレ（プラス温度）ほどあずきバーが凍る（ライフ増加）
    
    if (temperature < -20) {
      // 超寒いダジャレ：大幅にライフ減少
      return -25;
    } else if (temperature < -10) {
      // 寒いダジャレ：中程度にライフ減少
      return -15;
    } else if (temperature < 0) {
      // やや寒いダジャレ：少しライフ減少
      return -8;
    } else if (temperature <= 10) {
      // 普通の温度：わずかにライフ変化
      return Math.random() > 0.5 ? -3 : 3;
    } else if (temperature <= 30) {
      // 暖かいダジャレ：ライフ少し回復
      return 5;
    } else if (temperature <= 50) {
      // 暑いダジャレ：ライフ中程度回復
      return 12;
    } else {
      // 超暑いダジャレ：ライフ大幅回復
      return 20;
    }
  }

  // スコア更新
  updateScore(evaluation) {
    // 基本スコア：AI評価スコア
    let scoreAdd = Math.max(0, evaluation.funnyScore) * 10;
    
    // ボーナス：効率的な溶解
    const lastRecord = this.dajareHistory[this.dajareHistory.length - 1];
    const lifeDelta = lastRecord ? lastRecord.lifeDelta : 0;
    
    if (lifeDelta < -20) {
      scoreAdd += 50; // 大ダメージボーナス
    } else if (lifeDelta < -10) {
      scoreAdd += 20; // 中ダメージボーナス
    }
    
    // 時間ボーナス（残り時間が多いほど高スコア）
    const timeRatio = this.getTimeRemaining() / this.timeLimit;
    scoreAdd *= (1 + timeRatio * 0.5);
    
    this.score += Math.round(scoreAdd);
  }

  // ゲーム終了
  endGame(reason) {
    this.status = 'finished';
    this.endedAt = Date.now();
    
    // 最終スコア計算
    const duration = this.endedAt - this.startedAt;
    const timeBonus = Math.max(0, this.getTimeRemaining()) / 1000 * 10; // 残り秒数 × 10
    
    if (reason === 'victory') {
      this.score += timeBonus;
      console.log(`🎉 ゲーム勝利！ 時間ボーナス: +${Math.round(timeBonus)}`);
    }
    
    return {
      reason,
      duration,
      finalScore: Math.round(this.score),
      azukiBarLife: this.azukiBarLife,
      dajareCount: this.dajareHistory.length
    };
  }

  // ゲーム状態取得
  getGameState() {
    const totalTemperature = this.dajareHistory.reduce((sum, item) => sum + (item.evaluation?.temperature || 0), 0);
    const averageTemperature = this.dajareHistory.length > 0 ? totalTemperature / this.dajareHistory.length : 0;
    
    return {
      id: this.id,
      playerId: this.playerId,
      playerName: this.playerName,
      status: this.status,
      azukiBarLife: this.azukiBarLife,
      timeRemaining: this.getTimeRemaining(),
      score: Math.round(this.score),
      dajareCount: this.dajareHistory.length,
      averageTemperature: averageTemperature,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      isGameOver: this.azukiBarLife <= 0 || this.status !== 'playing'
    };
  }

  // ゲームレポート生成
  generateReport() {
    const duration = (this.endedAt || Date.now()) - this.startedAt;
    const totalTemperature = this.dajareHistory.reduce((sum, d) => sum + (d.evaluation?.temperature || 0), 0);
    const averageTemperature = this.dajareHistory.length > 0 ? totalTemperature / this.dajareHistory.length : 0;
    
    const bestDajare = this.dajareHistory.reduce((best, current) => 
      (current.evaluation?.funnyScore || 0) > (best?.evaluation?.funnyScore || -Infinity) ? current : best, null);
    
    const worstDajare = this.dajareHistory.reduce((worst, current) => 
      (current.evaluation?.funnyScore || 0) < (worst?.evaluation?.funnyScore || Infinity) ? current : worst, null);
    
    return {
      playerId: this.playerId,
      playerName: this.playerName,
      duration: Math.round(duration / 1000),
      finalLife: this.azukiBarLife,
      totalDajare: this.dajareHistory.length,
      averageTemperature: Math.round(averageTemperature * 10) / 10,
      isCleared: this.azukiBarLife <= 0,
      finalScore: Math.round(this.score),
      stats: {
        duration: Math.round(duration / 1000),
        averageScore: this.dajareHistory.length > 0 
          ? Math.round(this.dajareHistory.reduce((sum, d) => sum + (d.evaluation?.funnyScore || 0), 0) / this.dajareHistory.length * 10) / 10
          : 0,
        totalLifeChange: 100 - this.azukiBarLife,
        efficiency: this.dajareHistory.length > 0 ? Math.round((100 - this.azukiBarLife) / this.dajareHistory.length * 10) / 10 : 0
      },
      highlights: {
        bestDajare,
        worstDajare
      },
      history: this.dajareHistory
    };
  }
}

// シングルプレイゲームマネージャー
class SingleGameManager {
  constructor() {
    this.sessions = new Map();
  }

  // 新しいゲームセッション開始
  startGame(playerId, playerName) {
    // 既存のセッションがあれば終了
    if (this.sessions.has(playerId)) {
      const existingSession = this.sessions.get(playerId);
      if (existingSession.status === 'playing') {
        existingSession.endGame('abandoned');
      }
    }

    const session = new SingleGameSession(playerId, playerName);
    this.sessions.set(playerId, session);
    
    console.log(`🎮 ${playerName} がシングルプレイゲームを開始しました！ セッションID: ${session.id}`);
    
    return session.getGameState();
  }

  // ダジャレ評価
  async evaluateDajare(playerId, dajare) {
    const session = this.sessions.get(playerId);
    if (!session) {
      throw new Error('ゲームセッションが見つかりません');
    }

    return await session.evaluateDajare(dajare);
  }

  // ゲーム状態取得
  getGameState(playerId) {
    const session = this.sessions.get(playerId);
    if (!session) {
      throw new Error('ゲームセッションが見つかりません');
    }

    return session.getGameState();
  }

  // ゲーム終了
  endGame(playerId) {
    const session = this.sessions.get(playerId);
    if (!session) {
      throw new Error('ゲームセッションが見つかりません');
    }

    const result = session.endGame('manual');
    return session.generateReport();
  }

  // ゲームレポート取得
  getGameReport(playerId) {
    const session = this.sessions.get(playerId);
    if (!session) {
      throw new Error('ゲームセッションが見つかりません');
    }

    return session.generateReport();
  }

  // 全セッションのクリーンアップ（定期実行用）
  cleanupSessions() {
    const now = Date.now();
    const expiredSessions = [];

    for (const [playerId, session] of this.sessions) {
      const age = now - session.startedAt;
      const isExpired = age > session.timeLimit + 60000; // タイムリミット + 1分

      if (isExpired || (session.status === 'finished' && age > 300000)) { // 完了から5分
        expiredSessions.push(playerId);
      }
    }

    expiredSessions.forEach(playerId => {
      console.log(`🧹 期限切れセッションを削除: ${playerId}`);
      this.sessions.delete(playerId);
    });

    return expiredSessions.length;
  }
}

module.exports = SingleGameManager;