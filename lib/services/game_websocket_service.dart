import 'dart:developer' as developer;
import 'package:socket_io_client/socket_io_client.dart' as IO;

/// ゲーム状態管理用のWebSocketサービス
class GameWebSocketService {
  static final GameWebSocketService _instance = GameWebSocketService._internal();
  factory GameWebSocketService() => _instance;
  GameWebSocketService._internal();

  IO.Socket? _socket;
  String? _playerId;
  String? _playerName;
  String? _roomId;

  // イベントコールバック
  Function(Map<String, dynamic>)? onRoomUpdated;
  Function(Map<String, dynamic>)? onGameStarted;
  Function(Map<String, dynamic>)? onRoleAssigned;
  Function(Map<String, dynamic>)? onDajareEvaluated;
  Function(Map<String, dynamic>)? onVoteUpdated;
  Function(Map<String, dynamic>)? onWerewolfAbilityUsed;
  Function(Map<String, dynamic>)? onVotingPhaseStarted;
  Function(Map<String, dynamic>)? onGameEnded;
  Function(Map<String, dynamic>)? onPlayerLeft;
  Function(String)? onError;

  /// WebSocketサーバーに接続
  void connect({
    String serverUrl = 'http://192.168.0.9:3000',
    required String playerId,
    required String playerName,
  }) {
    _playerId = playerId;
    _playerName = playerName;

    developer.log('🔌 WebSocket接続開始: $serverUrl');
    developer.log('👤 プレイヤー情報: $playerName ($playerId)');

    _socket = IO.io(serverUrl, <String, dynamic>{
      'transports': ['websocket', 'polling'], // fallback to polling
      'autoConnect': false,
      'timeout': 20000,
      'forceNew': true,
    });

    _setupEventHandlers();
    _socket!.connect();

    developer.log('📡 Socket.IO接続試行中...');
  }

  /// イベントハンドラーをセットアップ
  void _setupEventHandlers() {
    if (_socket == null) return;

    // 接続イベント
    _socket!.on('connect', (_) {
      developer.log('WebSocket接続成功');
      _joinAsPlayer();
    });

    // 切断イベント
    _socket!.on('disconnect', (reason) {
      developer.log('WebSocket切断: $reason');
    });

    // エラーイベント
    _socket!.on('connect_error', (error) {
      developer.log('WebSocket接続エラー: $error');
      onError?.call('接続エラー: $error');
    });

    // ゲーム関連イベント
    _socket!.on('join_success', (data) {
      developer.log('プレイヤー参加成功: $data');
    });

    _socket!.on('room_created', (data) {
      developer.log('ルーム作成成功: $data');
      if (data['room'] != null) {
        _roomId = data['room']['id'];
      }
    });

    _socket!.on('room_updated', (data) {
      developer.log('ルーム状態更新: $data');
      if (data['room'] != null) {
        _roomId = data['room']['id'];
      }
      onRoomUpdated?.call(Map<String, dynamic>.from(data));
    });

    _socket!.on('role_assigned', (data) {
      developer.log('役職割り当て: $data');
      onRoleAssigned?.call(Map<String, dynamic>.from(data));
    });

    _socket!.on('game_started', (data) {
      developer.log('ゲーム開始: $data');
      onGameStarted?.call(Map<String, dynamic>.from(data));
    });

    _socket!.on('dajare_evaluated', (data) {
      developer.log('ダジャレ評価結果: $data');
      onDajareEvaluated?.call(Map<String, dynamic>.from(data));
    });

    _socket!.on('vote_updated', (data) {
      developer.log('投票状況更新: $data');
      onVoteUpdated?.call(Map<String, dynamic>.from(data));
    });

    _socket!.on('werewolf_ability_used', (data) {
      developer.log('人狼能力使用: $data');
      onWerewolfAbilityUsed?.call(Map<String, dynamic>.from(data));
    });

    _socket!.on('voting_phase_started', (data) {
      developer.log('投票フェーズ開始: $data');
      onVotingPhaseStarted?.call(Map<String, dynamic>.from(data));
    });

    _socket!.on('game_ended', (data) {
      developer.log('ゲーム終了: $data');
      onGameEnded?.call(Map<String, dynamic>.from(data));
    });

    _socket!.on('player_left', (data) {
      developer.log('プレイヤー退出: $data');
      onPlayerLeft?.call(Map<String, dynamic>.from(data));
    });

    _socket!.on('error', (data) {
      developer.log('サーバーエラー: $data');
      final errorMessage = data['message'] ?? 'Unknown error';
      onError?.call(errorMessage);
    });
  }

  /// プレイヤーとして参加
  void _joinAsPlayer() {
    if (_socket == null || _playerId == null || _playerName == null) return;

    _socket!.emit('player_join', {
      'playerId': _playerId,
      'playerName': _playerName,
    });
  }

  /// オートマッチングを開始
  void startAutoMatch() {
    if (_socket == null || _playerId == null || _playerName == null) return;

    developer.log('オートマッチング開始');
    _socket!.emit('auto_match', {
      'playerId': _playerId,
      'playerName': _playerName,
    });
  }

  /// ルームを作成
  void createRoom() {
    if (_socket == null || _playerId == null || _playerName == null) return;

    developer.log('ルーム作成');
    _socket!.emit('create_room', {
      'playerId': _playerId,
      'playerName': _playerName,
    });
  }

  /// ルームに参加
  void joinRoom(String roomId) {
    if (_socket == null || _playerId == null || _playerName == null) return;

    developer.log('ルーム参加: $roomId');
    _socket!.emit('join_room', {
      'roomId': roomId,
      'playerId': _playerId,
      'playerName': _playerName,
    });
  }

  /// ダジャレを投稿
  void submitDajare(String dajare) {
    if (_socket == null || _playerId == null) return;

    developer.log('ダジャレ投稿: $dajare');
    _socket!.emit('submit_dajare', {
      'playerId': _playerId,
      'dajare': dajare,
    });
  }

  /// 投票
  void vote(String targetPlayerId) {
    if (_socket == null || _playerId == null) return;

    developer.log('投票: $targetPlayerId');
    _socket!.emit('vote', {
      'playerId': _playerId,
      'targetId': targetPlayerId,
    });
  }

  /// 人狼の特殊能力を使用
  void useWerewolfAbility() {
    if (_socket == null || _playerId == null) return;

    developer.log('人狼能力使用');
    _socket!.emit('use_werewolf_ability', {
      'playerId': _playerId,
    });
  }

  /// 投票フェーズを開始
  void startVoting() {
    if (_socket == null || _playerId == null) return;

    developer.log('投票フェーズ開始');
    _socket!.emit('start_voting', {
      'playerId': _playerId,
    });
  }

  /// 接続を切断
  void disconnect() {
    developer.log('WebSocket切断');
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _playerId = null;
    _playerName = null;
    _roomId = null;
  }

  /// 接続状態を確認
  bool get isConnected => _socket?.connected ?? false;

  /// プレイヤーID取得
  String? get playerId => _playerId;

  /// プレイヤー名取得
  String? get playerName => _playerName;

  /// ルームID取得
  String? get roomId => _roomId;
}