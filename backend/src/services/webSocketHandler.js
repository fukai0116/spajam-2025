const MultiplayGameManager = require('./multiplayGameManager');

class WebSocketHandler {
  constructor(io) {
    this.io = io;
    this.multiplayManager = new MultiplayGameManager();
    this.setupEventHandlers();

    // 定期クリーンアップ（5分ごと）
    setInterval(() => {
      this.multiplayManager.cleanup();
    }, 5 * 60 * 1000);
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Player connected: ${socket.id}`);

      // プレイヤー接続時の初期化
      socket.on('player_connect', (data) => {
        this.handlePlayerConnect(socket, data);
      });

      // ルーム作成
      socket.on('create_room', (data) => {
        this.handleCreateRoom(socket, data);
      });

      // ルーム参加
      socket.on('join_room', (data) => {
        this.handleJoinRoom(socket, data);
      });

      // オートマッチング
      socket.on('auto_match', (data) => {
        this.handleAutoMatch(socket, data);
      });

      // ゲーム開始
      socket.on('start_game', (data) => {
        this.handleStartGame(socket, data);
      });

      // ダジャレ投稿
      socket.on('submit_dajare', (data) => {
        this.handleSubmitDajare(socket, data);
      });

      // 投票
      socket.on('vote', (data) => {
        this.handleVote(socket, data);
      });

      // 観戦開始
      socket.on('spectate_room', (data) => {
        this.handleSpectateRoom(socket, data);
      });

      // ルーム一覧取得
      socket.on('get_room_list', () => {
        this.handleGetRoomList(socket);
      });

      // 切断処理
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  // プレイヤー接続処理
  handlePlayerConnect(socket, { playerId, playerName }) {
    try {
      socket.playerId = playerId;
      socket.playerName = playerName;
      
      socket.emit('connect_success', {
        playerId,
        playerName,
        socketId: socket.id
      });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  // ルーム作成処理
  handleCreateRoom(socket, { playerId, playerName, maxPlayers = 4 }) {
    try {
      const room = this.multiplayManager.createRoom(playerId, playerName, maxPlayers);
      
      // ラウンド遷移のコールバックを設定
      room.onNextRound = (gameState) => {
        console.log(`🔄 ルーム ${room.roomId} 次のラウンド開始を全員に通知`);
        this.io.to(room.roomId).emit('next_round_started', { gameState });
      };
      
      socket.playerId = playerId;
      socket.roomId = room.roomId;
      socket.join(room.roomId);

      socket.emit('room_created', {
        room: this.getRoomStateForClient(room),
        player: room.getPlayerState(playerId)
      });

    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  // ルーム参加処理
  handleJoinRoom(socket, { roomId, playerId, playerName }) {
    try {
      const { room, player } = this.multiplayManager.joinRoom(roomId, playerId, playerName);
      
      socket.playerId = playerId;
      socket.roomId = roomId;
      socket.join(roomId);

      // ルーム内の全プレイヤーに通知
      this.io.to(roomId).emit('room_updated', {
        room: this.getRoomStateForClient(room),
        message: `${playerName}が参加しました`,
        newPlayer: room.getPlayerState(playerId)
      });

      socket.emit('room_joined', {
        room: this.getRoomStateForClient(room),
        player: room.getPlayerState(playerId)
      });

    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  // オートマッチング処理
  handleAutoMatch(socket, { playerId, playerName }) {
    try {
      const { room, player, isNewRoom } = this.multiplayManager.autoMatch(playerId, playerName);
      
      // ラウンド遷移のコールバックを設定（新規ルームの場合）
      if (isNewRoom) {
        room.onNextRound = (gameState) => {
          console.log(`🔄 ルーム ${room.roomId} 次のラウンド開始を全員に通知`);
          this.io.to(room.roomId).emit('next_round_started', { gameState });
        };
      }
      
      socket.playerId = playerId;
      socket.roomId = room.roomId;
      socket.join(room.roomId);

      if (isNewRoom) {
        socket.emit('room_created', {
          room: this.getRoomStateForClient(room),
          player: room.getPlayerState(playerId),
          isAutoMatch: true
        });
      } else {
        // ルーム内の全プレイヤーに通知
        this.io.to(room.roomId).emit('room_updated', {
          room: this.getRoomStateForClient(room),
          message: `${playerName}が参加しました`,
          newPlayer: room.getPlayerState(playerId)
        });

        socket.emit('room_joined', {
          room: this.getRoomStateForClient(room),
          player: room.getPlayerState(playerId),
          isAutoMatch: true
        });
      }

    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  // ゲーム開始処理
  handleStartGame(socket, { playerId }) {
    try {
      const room = this.multiplayManager.getPlayerRoom(playerId);
      if (!room) {
        throw new Error('ルームが見つかりません');
      }

      // ホストのみゲーム開始可能
      if (room.hostPlayerId !== playerId) {
        throw new Error('ホストのみゲームを開始できます');
      }

      const gameState = room.startGame();

      // ルーム内の全プレイヤーにゲーム開始を通知
      this.io.to(room.roomId).emit('game_started', {
        gameState,
        message: 'ゲームが開始されました！'
      });

    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  // ダジャレ投稿処理
  async handleSubmitDajare(socket, { playerId, dajare }) {
    try {
      const room = this.multiplayManager.getPlayerRoom(playerId);
      if (!room) {
        throw new Error('ルームが見つかりません');
      }

      const result = await room.submitDajare(playerId, dajare);

      // 投稿者に結果を送信
      socket.emit('dajare_submitted', {
        dajareEntry: result.dajareEntry,
        playerState: result.playerState
      });

      // ルーム内の全プレイヤーに更新を通知
      this.io.to(room.roomId).emit('game_updated', {
        gameState: result.gameState,
        lastDajare: {
          playerName: result.dajareEntry.playerName,
          dajare: result.dajareEntry.dajare,
          evaluation: result.dajareEntry.evaluation
        }
      });

      // 投票フェーズ開始チェック
      if (room.currentPhase === 'voting') {
        const votingState = room.getVotingState();
        console.log(`🗳️ ルーム ${room.roomId} 投票フェーズ開始を全員に通知`);
        this.io.to(room.roomId).emit('voting_started', votingState);
      }

    } catch (error) {
      console.error(`❌ ダジャレ投稿エラー (${playerId}):`, error.message);
      socket.emit('error', { message: error.message });
    }
  }

  // 投票処理
  handleVote(socket, { playerId, dajareId }) {
    try {
      const room = this.multiplayManager.getPlayerRoom(playerId);
      if (!room) {
        throw new Error('ルームが見つかりません');
      }

      const votingState = room.vote(playerId, dajareId);

      // 投票者に確認を送信
      socket.emit('vote_submitted', {
        dajareId,
        votingState
      });

      // ルーム内の全プレイヤーに投票状況を通知
      this.io.to(room.roomId).emit('voting_updated', votingState);

      // 結果フェーズ開始チェック
      if (room.currentPhase === 'result') {
        const roundResult = room.roundResults[room.roundResults.length - 1];
        console.log(`📊 ルーム ${room.roomId} ラウンド結果を全員に通知`);
        
        // 少し遅延させて結果を送信（投票状況の更新後）
        setTimeout(() => {
          this.io.to(room.roomId).emit('round_result', roundResult);
          
          // ゲーム終了チェック
          if (room.status === 'finished') {
            const finalResults = {
              rankings: room.getCurrentRankings(),
              roundResults: room.roundResults,
              totalDajares: room.dajareHistory.length,
              duration: room.endedAt - room.startedAt
            };
            console.log(`🏁 ルーム ${room.roomId} ゲーム終了を全員に通知`);
            this.io.to(room.roomId).emit('game_finished', finalResults);
          } else {
            // 次のラウンド開始は自動的にMultiplayGameManagerが処理
            console.log(`🔄 ルーム ${room.roomId} 次のラウンド準備中...`);
          }
        }, 2000); // 2秒遅延
      }

    } catch (error) {
      console.error(`❌ 投票エラー (${playerId}):`, error.message);
      socket.emit('error', { message: error.message });
    }
  }

  // 観戦処理
  handleSpectateRoom(socket, { roomId, spectatorName }) {
    try {
      const room = this.multiplayManager.getRoom(roomId);
      if (!room) {
        throw new Error('ルームが見つかりません');
      }

      const spectator = room.addSpectator(socket.id, spectatorName);
      socket.spectatorId = socket.id;
      socket.roomId = roomId;
      socket.join(roomId);

      socket.emit('spectate_started', {
        room: this.getRoomStateForClient(room),
        spectator,
        gameState: room.getGameState()
      });

      // ルーム内に観戦者が入ったことを通知
      this.io.to(roomId).emit('spectator_joined', {
        spectatorName,
        spectatorCount: room.spectators.size
      });

    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  // ルーム一覧取得
  handleGetRoomList(socket) {
    try {
      const rooms = this.multiplayManager.getAllRooms();
      socket.emit('room_list', { rooms });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  // 切断処理
  handleDisconnect(socket) {
    try {
      console.log(`🔌 Player disconnected: ${socket.id}`);

      if (socket.playerId) {
        const room = this.multiplayManager.getPlayerRoom(socket.playerId);
        if (room) {
          const shouldDeleteRoom = this.multiplayManager.leaveRoom(socket.playerId);
          
          if (!shouldDeleteRoom) {
            // ルームが残っている場合、他のプレイヤーに通知
            this.io.to(room.roomId).emit('player_disconnected', {
              playerId: socket.playerId,
              playerName: socket.playerName,
              room: this.getRoomStateForClient(room)
            });
          }
        }
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  // ヘルパーメソッド
  getRoomStateForClient(room) {
    return {
      roomId: room.roomId,
      status: room.status,
      phase: room.currentPhase,
      round: room.currentRound,
      maxRounds: room.gameSettings.maxRounds,
      players: Array.from(room.players.values()).map(player => ({
        playerId: player.playerId,
        playerName: player.playerName,
        isHost: player.isHost,
        score: player.score,
        azukiBarLife: player.azukiBarLife,
        status: player.status,
        dajareCount: player.dajareCount
      })),
      spectatorCount: room.spectators.size,
      hostPlayerId: room.hostPlayerId,
      maxPlayers: room.maxPlayers,
      timeRemaining: room.getTimeRemaining()
    };
  }
}

module.exports = WebSocketHandler;