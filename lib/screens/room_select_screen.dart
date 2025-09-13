import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/multiplay_game_service.dart';

class RoomSelectScreen extends StatefulWidget {
  const RoomSelectScreen({super.key});

  @override
  State<RoomSelectScreen> createState() => _RoomSelectScreenState();
}

class _RoomSelectScreenState extends State<RoomSelectScreen> {
  final MultiplayGameService _gameService = MultiplayGameService();
  final TextEditingController _roomIdController = TextEditingController();
  
  List<Map<String, dynamic>> _rooms = [];
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _setupListeners();
    _loadRooms();
  }

  @override
  void dispose() {
    _roomIdController.dispose();
    super.dispose();
  }

  void _setupListeners() {
    // ルーム更新の監視
    _gameService.roomUpdates.listen((update) {
      switch (update['type']) {
        case 'room_list':
          setState(() {
            _rooms = List<Map<String, dynamic>>.from(update['data']['rooms'] ?? []);
            _isLoading = false;
          });
          break;
        case 'room_created':
        case 'room_joined':
          // ルーム画面に遷移
          if (mounted) {
            context.pushReplacement('/multiplay/room');
          }
          break;
      }
    });

    // エラーの監視
    _gameService.errors.listen((error) {
      if (mounted) {
        setState(() {
          _error = error;
          _isLoading = false;
        });
        _showErrorDialog(error);
      }
    });
  }

  Future<void> _loadRooms() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await _gameService.getRoomList();
    } catch (error) {
      setState(() {
        _error = error.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _createRoom() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await _gameService.createRoom(maxPlayers: 4);
    } catch (error) {
      setState(() {
        _error = error.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _joinRoom(String roomId) async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await _gameService.joinRoom(roomId);
    } catch (error) {
      setState(() {
        _error = error.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _joinRoomById() async {
    final roomId = _roomIdController.text.trim();
    if (roomId.isEmpty) {
      _showErrorDialog('ルームIDを入力してください');
      return;
    }

    await _joinRoom(roomId);
  }

  Future<void> _autoMatch() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await _gameService.autoMatch();
    } catch (error) {
      setState(() {
        _error = error.toString();
        _isLoading = false;
      });
    }
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('エラー'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  String _formatRoomStatus(String status) {
    switch (status) {
      case 'waiting':
        return '待機中';
      case 'playing':
        return 'ゲーム中';
      case 'finished':
        return '終了';
      default:
        return status;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'waiting':
        return Colors.green;
      case 'playing':
        return Colors.orange;
      case 'finished':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ルーム選択'),
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            onPressed: _loadRooms,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.orange, Colors.deepOrange],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                // クイックアクション
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _isLoading ? null : _createRoom,
                        icon: const Icon(Icons.add),
                        label: const Text('ルーム作成'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: Colors.deepOrange,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _isLoading ? null : _autoMatch,
                        icon: const Icon(Icons.shuffle),
                        label: const Text('自動参加'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // ルームID入力
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _roomIdController,
                          decoration: const InputDecoration(
                            hintText: 'ルームIDを入力',
                            border: InputBorder.none,
                            contentPadding: EdgeInsets.symmetric(horizontal: 8),
                          ),
                        ),
                      ),
                      ElevatedButton(
                        onPressed: _isLoading ? null : _joinRoomById,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('参加'),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // ルーム一覧
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.9),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(16),
                          child: const Row(
                            children: [
                              Icon(Icons.list, color: Colors.brown),
                              SizedBox(width: 8),
                              Text(
                                'ルーム一覧',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.brown,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Divider(height: 1),
                        Expanded(
                          child: _buildRoomList(),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // 戻るボタン
                TextButton(
                  onPressed: () => context.pop(),
                  child: const Text(
                    'メニューに戻る',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRoomList() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'エラーが発生しました\n$_error',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.red),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadRooms,
              child: const Text('再試行'),
            ),
          ],
        ),
      );
    }

    if (_rooms.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.meeting_room, size: 48, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'まだルームがありません',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: _rooms.length,
      padding: const EdgeInsets.all(8),
      itemBuilder: (context, index) {
        final room = _rooms[index];
        final status = room['status'] ?? 'waiting';
        final players = room['players'] ?? [];
        final maxPlayers = room['maxPlayers'] ?? 4;
        
        return Card(
          margin: const EdgeInsets.symmetric(vertical: 4),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: _getStatusColor(status),
              child: Text(
                '${players.length}',
                style: const TextStyle(color: Colors.white),
              ),
            ),
            title: Text('ルーム ${room['roomId'] ?? ''}'),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('状態: ${_formatRoomStatus(status)}'),
                Text('プレイヤー: ${players.length}/$maxPlayers'),
              ],
            ),
            trailing: status == 'waiting'
                ? ElevatedButton(
                    onPressed: _isLoading
                        ? null
                        : () => _joinRoom(room['roomId']),
                    child: const Text('参加'),
                  )
                : Chip(
                    label: Text(_formatRoomStatus(status)),
                    backgroundColor: _getStatusColor(status),
                  ),
            onTap: status == 'waiting'
                ? () => _joinRoom(room['roomId'])
                : null,
          ),
        );
      },
    );
  }
}