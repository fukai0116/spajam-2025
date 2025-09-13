// ゲーム関連のコントローラー

class GameController {
  // シングルプレイゲーム開始
  static startSinglePlayer(req, res) {
    try {
      const gameSession = {
        id: `single_${Date.now()}`,
        type: 'single',
        playerId: req.body.playerId || `player_${Date.now()}`,
        startTime: new Date().toISOString(),
        status: 'active'
      };
      
      res.json({
        message: 'シングルプレイゲームを開始しました',
        session: gameSession
      });
    } catch (error) {
      res.status(500).json({
        error: 'ゲーム開始エラー',
        message: error.message
      });
    }
  }

  // マルチプレイゲーム開始
  static startMultiPlayer(req, res) {
    try {
      const { roomId, playerId } = req.body;
      
      const gameSession = {
        id: `multi_${Date.now()}`,
        type: 'multi',
        roomId,
        playerId,
        startTime: new Date().toISOString(),
        status: 'active'
      };
      
      res.json({
        message: 'マルチプレイゲームを開始しました',
        session: gameSession
      });
    } catch (error) {
      res.status(500).json({
        error: 'ゲーム開始エラー',
        message: error.message
      });
    }
  }

  // ゲーム終了
  static endGame(req, res) {
    try {
      const { sessionId } = req.params;
      const { score, playTime } = req.body;
      
      res.json({
        message: 'ゲームが終了しました',
        sessionId,
        finalScore: score,
        playTime,
        endTime: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: 'ゲーム終了エラー',
        message: error.message
      });
    }
  }
}

module.exports = GameController;