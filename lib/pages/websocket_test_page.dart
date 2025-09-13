import 'package:flutter/material.dart';
import '../services/game_websocket_service.dart';
import '../config/app_config.dart';
import 'dart:math';
import 'dart:developer' as developer;

/// WebSocket接続テスト画面
class WebSocketTestPage extends StatefulWidget {
  const WebSocketTestPage({super.key});

  @override
  State<WebSocketTestPage> createState() => _WebSocketTestPageState();
}

class _WebSocketTestPageState extends State<WebSocketTestPage> {
  final GameWebSocketService _webSocketService = GameWebSocketService();
  final TextEditingController _dajareController = TextEditingController();
  final TextEditingController _playerNameController = TextEditingController(text: 'テストプレイヤー');
  
  bool _isConnected = false;
  String _connectionStatus = '未接続';
  String _playerRole = '未設定';
  List<String> _eventLogs = [];
  Map<String, dynamic>? _gameState;

  @override
  void initState() {
    super.initState();
    _setupWebSocketCallbacks();
  }

  void _setupWebSocketCallbacks() {
    _webSocketService.onRoomUpdated = (data) {
      _addEventLog('ルーム更新: ${data['message'] ?? ''}');
      setState(() {});
    };

    _webSocketService.onGameStarted = (data) {
      _addEventLog('ゲーム開始！');
      setState(() {
        _gameState = data['gameState'];
      });
    };

    _webSocketService.onRoleAssigned = (data) {
      _addEventLog('役職割り当て: ${data['role']}');
      setState(() {
        _playerRole = data['role'] ?? '未設定';
      });
    };

    _webSocketService.onDajareEvaluated = (data) {
      final result = data['dajareResult'];
      _addEventLog('ダジャレ評価: ${result['dajare']} (スコア: ${result['score']})');
      setState(() {
        _gameState = data['gameState'];
      });
    };

    _webSocketService.onVoteUpdated = (data) {
      _addEventLog('投票更新');
      setState(() {
        _gameState = data['gameState'];
      });
    };

    _webSocketService.onGameEnded = (data) {
      _addEventLog('ゲーム終了: ${data['endReason']}');
      setState(() {
        _gameState = data['gameState'];
      });
    };

    _webSocketService.onError = (error) {
      _addEventLog('エラー: $error');
    };
  }

  void _addEventLog(String message) {
    setState(() {
      _eventLogs.insert(0, '${DateTime.now().toString().substring(11, 19)}: $message');
      if (_eventLogs.length > 10) {
        _eventLogs.removeLast();
      }
    });
  }

  void _connect() {
    final playerId = 'player_${Random().nextInt(10000)}';
    final playerName = _playerNameController.text.trim();
    
    if (playerName.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('プレイヤー名を入力してください')),
      );
      return;
    }

    developer.log('🔌 Flutter WebSocket接続開始');
    developer.log('👤 プレイヤー情報: $playerName ($playerId)');

    _webSocketService.connect(
      serverUrl: AppConfig.serverUrl,
      playerId: playerId,
      playerName: playerName,
    );

    setState(() {
      _isConnected = true;
      _connectionStatus = '接続中...';
    });

    _addEventLog('🔌 接続開始: $playerName ($playerId)');
    _addEventLog('📡 サーバー: http://192.168.0.9:3000');

    // 接続状態を監視
    Future.delayed(const Duration(seconds: 3), () {
      setState(() {
        _connectionStatus = _webSocketService.isConnected ? '接続済み' : '接続失敗';
      });
      
      if (!_webSocketService.isConnected) {
        _addEventLog('❌ 接続タイムアウト - サーバーが応答しません');
      }
    });
  }

  void _disconnect() {
    _webSocketService.disconnect();
    setState(() {
      _isConnected = false;
      _connectionStatus = '未接続';
      _playerRole = '未設定';
      _gameState = null;
    });
    _addEventLog('切断しました');
  }

  void _autoMatch() {
    _webSocketService.startAutoMatch();
    _addEventLog('オートマッチング開始');
  }

  void _createRoom() {
    _webSocketService.createRoom();
    _addEventLog('ルーム作成');
  }

  void _submitDajare() {
    final dajare = _dajareController.text.trim();
    if (dajare.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('ダジャレを入力してください')),
      );
      return;
    }

    _webSocketService.submitDajare(dajare);
    _dajareController.clear();
    _addEventLog('ダジャレ投稿: $dajare');
  }

  void _useWerewolfAbility() {
    _webSocketService.useWerewolfAbility();
    _addEventLog('人狼能力使用');
  }

  void _startVoting() {
    _webSocketService.startVoting();
    _addEventLog('投票フェーズ開始');
  }

  @override
  void dispose() {
    _webSocketService.disconnect();
    _dajareController.dispose();
    _playerNameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('WebSocket テスト'),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 接続セクション
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      '接続状態: $_connectionStatus',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: _isConnected ? Colors.green : Colors.red,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (!_isConnected) ...[
                      TextField(
                        controller: _playerNameController,
                        decoration: const InputDecoration(
                          labelText: 'プレイヤー名',
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 8),
                      ElevatedButton(
                        onPressed: _connect,
                        child: const Text('接続'),
                      ),
                    ] else ...[
                      Text('プレイヤー: ${_webSocketService.playerName}'),
                      Text('役職: $_playerRole'),
                      if (_webSocketService.roomId != null)
                        Text('ルームID: ${_webSocketService.roomId}'),
                      const SizedBox(height: 8),
                      ElevatedButton(
                        onPressed: _disconnect,
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                        child: const Text('切断'),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            // ゲーム操作セクション
            if (_isConnected) ...[
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text(
                        'ゲーム操作',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: _autoMatch,
                              child: const Text('オートマッチング'),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: _createRoom,
                              child: const Text('ルーム作成'),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _dajareController,
                        decoration: const InputDecoration(
                          labelText: 'ダジャレを入力',
                          border: OutlineInputBorder(),
                        ),
                        onSubmitted: (_) => _submitDajare(),
                      ),
                      const SizedBox(height: 8),
                      ElevatedButton(
                        onPressed: _submitDajare,
                        child: const Text('ダジャレ投稿'),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: _useWerewolfAbility,
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.purple),
                              child: const Text('人狼能力'),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: _startVoting,
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
                              child: const Text('投票開始'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],

            // イベントログセクション
            const SizedBox(height: 16),
            Expanded(
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text(
                        'イベントログ',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Expanded(
                        child: Container(
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: ListView.builder(
                            itemCount: _eventLogs.length,
                            itemBuilder: (context, index) {
                              return Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2,
                                ),
                                child: Text(
                                  _eventLogs[index],
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // ゲーム状態表示
            if (_gameState != null) ...[
              const SizedBox(height: 8),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text(
                        'ゲーム状態',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text('ステータス: ${_gameState!['status']}'),
                      Text('あずきバー耐久度: ${_gameState!['azukiBarDurability']}'),
                      Text('残り時間: ${_gameState!['timeRemaining']}秒'),
                      Text('プレイヤー数: ${_gameState!['players']?.length ?? 0}'),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}