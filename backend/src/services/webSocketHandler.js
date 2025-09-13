const gameService = require('./gameService');

class WebSocketHandler {
  constructor(io) {
    this.io = io;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Player connected: ${socket.id}`);

      // プレイヤー接続時の初期化
      socket.on('player_join', (data) => {
        this.handlePlayerJoin(socket, data);
      });

      // オートマッチング
      socket.on('auto_match', (data) => {
        this.handleAutoMatch(socket, data);
      });

      // ルーム作成
      socket.on('create_room', (data) => {
        this.handleCreateRoom(socket, data);
      });

      // ルーム参加
      socket.on('join_room', (data) => {
        this.handleJoinRoom(socket, data);
      });

      // ダジャレ投稿
      socket.on('submit_dajare', (data) => {
        this.handleSubmitDajare(socket, data);
      });

      // 投票
      socket.on('vote', (data) => {
        this.handleVote(socket, data);
      });

      // 人狼の特殊能力使用
      socket.on('use_werewolf_ability', (data) => {
        this.handleWerewolfAbility(socket, data);
      });

      // 投票フェーズ開始要求
      socket.on('start_voting', (data) => {
        this.handleStartVoting(socket, data);
      });

      // 切断処理
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  // プレイヤー参加処理
  handlePlayerJoin(socket, { playerId, playerName }) {
    try {
      socket.playerId = playerId;
      socket.playerName = playerName;
      
      socket.emit('join_success', {
        playerId,
        playerName,
        socketId: socket.id
      });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  // オートマッチング処理
  handleAutoMatch(socket, { playerId, playerName }) {
    try {
      const { room, player } = gameService.autoMatch(playerId, playerName, socket.id);
      
      socket.playerId = playerId;
      socket.roomId = room.id;
      socket.join(room.id);

      // ルーム内の全プレイヤーに通知
      this.io.to(room.id).emit('room_updated', {
        room: this.getRoomStateForClient(room),
        message: `${playerName}が参加しました`
      });

      // 参加者に役職を通知（ゲーム開始時）
      if (room.status === 'playing') {
        socket.emit('role_assigned', {
          role: player.role,
          isWerewolf: player.role === 'werewolf'
        });

        // ゲーム開始イベント
        this.io.to(room.id).emit('game_started', {
          gameState: room.getGameState()
        });
      }

    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  // ルーム作成処理
  handleCreateRoom(socket, { playerId, playerName }) {
    try {
      const { room, player } = gameService.createRoom(playerId, playerName, socket.id);
      
      socket.playerId = playerId;
      socket.roomId = room.id;
      socket.join(room.id);

      socket.emit('room_created', {
        room: this.getRoomStateForClient(room),
        player: {
          id: player.id,
          name: player.name,
          role: player.role
        }
      });

    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  // ルーム参加処理
  handleJoinRoom(socket, { roomId, playerId, playerName }) {
    try {
      const { room, player } = gameService.joinRoom(roomId, playerId, playerName, socket.id);
      
      socket.playerId = playerId;
      socket.roomId = room.id;
      socket.join(room.id);

      // ルーム内の全プレイヤーに通知
      this.io.to(room.id).emit('room_updated', {
        room: this.getRoomStateForClient(room),
        message: `${playerName}が参加しました`
      });

      // ゲーム開始時の処理
      if (room.status === 'playing') {
        // 全プレイヤーに役職を通知
        room.players.forEach(p => {
          const playerSocket = this.findSocketByPlayerId(p.id);
          if (playerSocket) {
            playerSocket.emit('role_assigned', {
              role: p.role,
              isWerewolf: p.role === 'werewolf'
            });
          }
        });

        // ゲーム開始イベント
        this.io.to(room.id).emit('game_started', {
          gameState: room.getGameState()
        });
      }

    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  // ダジャレ投稿処理
  async handleSubmitDajare(socket, { playerId, dajare }) {
    try {
      const { room, dajareResult } = await gameService.submitDajare(playerId, dajare);

      // ルーム内の全プレイヤーに結果を通知
      this.io.to(room.id).emit('dajare_evaluated', {
        dajareResult,
        gameState: room.getGameState()
      });

      // ゲーム終了チェック
      if (room.status === 'finished') {
        this.io.to(room.id).emit('game_ended', {
          gameState: room.getGameState(),
          endReason: room.endReason
        });
      }

    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  // 投票処理
  handleVote(socket, { playerId, targetId }) {
    try {
      const room = gameService.vote(playerId, targetId);

      // 投票結果を通知
      this.io.to(room.id).emit('vote_updated', {
        gameState: room.getGameState()
      });

      // ゲーム終了チェック
      if (room.status === 'finished') {
        this.io.to(room.id).emit('game_ended', {
          gameState: room.getGameState(),
          endReason: room.endReason
        });
      }

    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  // 人狼の特殊能力使用処理
  handleWerewolfAbility(socket, { playerId }) {
    try {
      const room = gameService.useWerewolfAbility(playerId);

      // 効果をルーム内に通知
      this.io.to(room.id).emit('werewolf_ability_used', {
        message: '吹雪の息が使用されました！',
        gameState: room.getGameState()
      });

    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  // 投票フェーズ開始
  handleStartVoting(socket, { playerId }) {
    try {
      const room = gameService.getPlayerRoom(playerId);
      if (!room) {
        throw new Error('Player not in any room');
      }

      room.votingPhase = true;

      // 投票フェーズ開始を通知
      this.io.to(room.id).emit('voting_phase_started', {
        message: '人狼追放の投票を開始します',
        gameState: room.getGameState()
      });

    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  // 切断処理
  handleDisconnect(socket) {
    console.log(`🔌 Player disconnected: ${socket.id}`);
    
    if (socket.playerId) {
      try {
        const room = gameService.leaveRoom(socket.playerId);
        
        if (room && socket.roomId) {
          // ルーム内の他プレイヤーに通知
          this.io.to(socket.roomId).emit('player_left', {
            playerId: socket.playerId,
            room: this.getRoomStateForClient(room),
            message: `${socket.playerName || 'プレイヤー'}が退出しました`
          });
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    }
  }

  // ソケットIDからプレイヤーIDを検索
  findSocketByPlayerId(playerId) {
    for (const [id, socket] of this.io.sockets.sockets) {
      if (socket.playerId === playerId) {
        return socket;
      }
    }
    return null;
  }

  // クライアント用にルーム状態を変換
  getRoomStateForClient(room) {
    return {
      id: room.id,
      status: room.status,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        isAlive: p.isAlive
        // 役職は意図的に隠す
      })),
      playerCount: room.players.length,
      maxPlayers: room.maxPlayers,
      azukiBarDurability: room.azukiBarDurability,
      timeRemaining: room.getRemainingTime()
    };
  }
}

module.exports = WebSocketHandler;