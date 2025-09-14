import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class MultiplayGameService {
  static final MultiplayGameService _instance = MultiplayGameService._internal();
  factory MultiplayGameService() => _instance;
  MultiplayGameService._internal();

  IO.Socket? _socket;
  String? _playerId;
  String? _playerName;
  String? _roomId;

  // Stream Controllers
  final StreamController<Map<String, dynamic>> _roomUpdatesController = 
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _gameUpdatesController = 
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _votingUpdatesController = 
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<String> _errorController = 
      StreamController<String>.broadcast();

  // Getters for streams
  Stream<Map<String, dynamic>> get roomUpdates => _roomUpdatesController.stream;
  Stream<Map<String, dynamic>> get gameUpdates => _gameUpdatesController.stream;
  Stream<Map<String, dynamic>> get votingUpdates => _votingUpdatesController.stream;
  Stream<String> get errors => _errorController.stream;

  // Getters
  String? get playerId => _playerId;
  String? get playerName => _playerName;
  String? get roomId => _roomId;
  bool get isConnected => _socket?.connected ?? false;

  // WebSocket接続
  Future<bool> connect(String serverUrl, String playerId, String playerName) async {
    try {
      _playerId = playerId;
      _playerName = playerName;

      _socket = IO.io(serverUrl, {
        'transports': ['websocket'],
        'autoConnect': false,
      });

      // イベントリスナーを設定
      _setupEventListeners();

      // 接続
      _socket!.connect();

      // 接続完了を待機
      final completer = Completer<bool>();
      _socket!.on('connect', (_) {
        print('🔌 Connected to server');
        _socket!.emit('player_join', {
          'playerId': playerId,
          'playerName': playerName,
        });
      });

      _socket!.on('join_success', (data) {
        print('✅ Player connected successfully: $data');
        completer.complete(true);
      });

      _socket!.on('connect_error', (error) {
        print('❌ Connection error: $error');
        completer.complete(false);
      });

      return await completer.future.timeout(
        const Duration(seconds: 10),
        onTimeout: () => false,
      );

    } catch (error) {
      print('❌ Connect error: $error');
      return false;
    }
  }

  // イベントリスナーの設定
  void _setupEventListeners() {
    if (_socket == null) return;

    // ルーム関連イベント
    _socket!.on('room_created', (data) {
      _roomId = data['room']['roomId'];
      _roomUpdatesController.add({
        'type': 'room_created',
        'data': data,
      });
    });

    _socket!.on('room_joined', (data) {
      _roomId = data['room']['roomId'];
      _roomUpdatesController.add({
        'type': 'room_joined',
        'data': data,
      });
    });

    _socket!.on('room_updated', (data) {
      _roomUpdatesController.add({
        'type': 'room_updated',
        'data': data,
      });
    });

    _socket!.on('player_disconnected', (data) {
      _roomUpdatesController.add({
        'type': 'player_disconnected',
        'data': data,
      });
    });

    _socket!.on('room_list', (data) {
      _roomUpdatesController.add({
        'type': 'room_list',
        'data': data,
      });
    });

    // ゲーム関連イベント
    _socket!.on('role_assigned', (data) {
      _gameUpdatesController.add({
        'type': 'role_assigned',
        'data': data,
      });
    });
    _socket!.on('game_started', (data) {
      _gameUpdatesController.add({
        'type': 'game_started',
        'data': data,
      });
    });

    _socket!.on('dajare_evaluated', (data) {
      _gameUpdatesController.add({
        'type': 'dajare_evaluated',
        'data': data,
      });
    });

    _socket!.on('game_updated', (data) {
      _gameUpdatesController.add({
        'type': 'game_updated',
        'data': data,
      });
    });

    _socket!.on('game_finished', (data) {
      _gameUpdatesController.add({
        'type': 'game_finished',
        'data': data,
      });
    });

    _socket!.on('game_ended', (data) {
      _gameUpdatesController.add({
        'type': 'game_ended',
        'data': data,
      });
    });

    // 投票関連イベント
    _socket!.on('voting_started', (data) {
      _votingUpdatesController.add({
        'type': 'voting_started',
        'data': data,
      });
    });

    _socket!.on('vote_submitted', (data) {
      _votingUpdatesController.add({
        'type': 'vote_submitted',
        'data': data,
      });
    });

    _socket!.on('voting_updated', (data) {
      _votingUpdatesController.add({
        'type': 'voting_updated',
        'data': data,
      });
    });

    _socket!.on('round_result', (data) {
      _votingUpdatesController.add({
        'type': 'round_result',
        'data': data,
      });
    });

    // 観戦関連イベント
    _socket!.on('spectate_started', (data) {
      _roomUpdatesController.add({
        'type': 'spectate_started',
        'data': data,
      });
    });

    _socket!.on('spectator_joined', (data) {
      _roomUpdatesController.add({
        'type': 'spectator_joined',
        'data': data,
      });
    });

    // エラーハンドリング
    _socket!.on('error', (data) {
      final errorMessage = data is Map ? data['message'] ?? 'Unknown error' : data.toString();
      _errorController.add(errorMessage);
    });

    _socket!.on('disconnect', (_) {
      print('🔌 Disconnected from server');
    });
  }

  // ルーム作成
  Future<void> createRoom({int maxPlayers = 4}) async {
    if (_socket == null || !_socket!.connected) {
      throw Exception('Not connected to server');
    }

    _socket!.emit('create_room', {
      'playerId': _playerId,
      'playerName': _playerName,
      'maxPlayers': maxPlayers,
    });
  }

  // ルーム参加
  Future<void> joinRoom(String roomId) async {
    if (_socket == null || !_socket!.connected) {
      throw Exception('Not connected to server');
    }

    _socket!.emit('join_room', {
      'roomId': roomId,
      'playerId': _playerId,
      'playerName': _playerName,
    });
  }

  // オートマッチング
  Future<void> autoMatch() async {
    if (_socket == null || !_socket!.connected) {
      throw Exception('Not connected to server');
    }

    _socket!.emit('auto_match', {
      'playerId': _playerId,
      'playerName': _playerName,
    });
  }

  // ゲーム開始
  Future<void> startGame() async {
    if (_socket == null || !_socket!.connected) {
      throw Exception('Not connected to server');
    }

    _socket!.emit('start_game', {
      'playerId': _playerId,
    });
  }

  // ダジャレ投稿
  Future<void> submitDajare(String dajare) async {
    if (_socket == null || !_socket!.connected) {
      throw Exception('Not connected to server');
    }

    _socket!.emit('submit_dajare', {
      'playerId': _playerId,
      'dajare': dajare,
    });
  }

  // 投票
  Future<void> vote(String dajareId) async {
    if (_socket == null || !_socket!.connected) {
      throw Exception('Not connected to server');
    }

    _socket!.emit('vote', {
      'playerId': _playerId,
      'dajareId': dajareId,
    });
  }

  // 観戦開始
  Future<void> spectateRoom(String roomId, String spectatorName) async {
    if (_socket == null || !_socket!.connected) {
      throw Exception('Not connected to server');
    }

    _socket!.emit('spectate_room', {
      'roomId': roomId,
      'spectatorName': spectatorName,
    });
  }

  // ルーム一覧取得
  Future<void> getRoomList() async {
    if (_socket == null || !_socket!.connected) {
      throw Exception('Not connected to server');
    }

    _socket!.emit('get_room_list');
  }

  // ルーム退出
  Future<void> leaveRoom() async {
    _roomId = null;
    if (_socket?.connected == true) {
      _socket!.disconnect();
    }
  }

  // 接続終了
  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _playerId = null;
    _playerName = null;
    _roomId = null;
  }

  // リソースのクリーンアップ
  void dispose() {
    _socket!.on('role_assigned', (data) {
      _gameUpdatesController.add({
        'type': 'role_assigned',
        'data': data,
      });
    });
    disconnect();
    _roomUpdatesController.close();
    _gameUpdatesController.close();
    _votingUpdatesController.close();
    _errorController.close();
  }
}
