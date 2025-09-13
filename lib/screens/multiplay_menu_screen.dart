import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:spajam2025/config/color_schemes.dart';
import '../services/multiplay_game_service.dart';
import '../config/app_config.dart';

class MultiplayMenuScreen extends StatefulWidget {
  const MultiplayMenuScreen({super.key});

  @override
  State<MultiplayMenuScreen> createState() => _MultiplayMenuScreenState();
}

class _MultiplayMenuScreenState extends State<MultiplayMenuScreen> {
  final MultiplayGameService _gameService = MultiplayGameService();
  final TextEditingController _playerNameController = TextEditingController();
  final TextEditingController _roomIdController = TextEditingController();
  bool _isConnecting = false;
  String? _connectionError;

  @override
  void initState() {
    super.initState();
    _playerNameController.text = 'プレイヤー${DateTime.now().millisecondsSinceEpoch % 1000}';
    
    // エラーストリームを監視
    _gameService.errors.listen((error) {
      if (mounted) {
        setState(() {
          _connectionError = error;
          _isConnecting = false;
        });
        _showErrorDialog(error);
      }
    });
  }

  @override
  void dispose() {
    _playerNameController.dispose();
    _roomIdController.dispose();
    super.dispose();
  }

  Future<void> _connectToServer() async {
    if (_playerNameController.text.trim().isEmpty) {
      _showErrorDialog('プレイヤー名を入力してください');
      return;
    }

    setState(() {
      _isConnecting = true;
      _connectionError = null;
    });

    final playerId = 'player_${DateTime.now().millisecondsSinceEpoch}';
    final playerName = _playerNameController.text.trim();

    try {
      final success = await _gameService.connect(
        AppConfig.serverUrl,
        playerId,
        playerName,
      );

      if (success && mounted) {
        // 接続成功後、ルーム選択画面に遷移
        context.push('/multiplay/room-select');
      } else if (mounted) {
        setState(() {
          _connectionError = 'サーバーに接続できませんでした';
          _isConnecting = false;
        });
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _connectionError = 'サーバー接続エラー: $error';
          _isConnecting = false;
        });
      }
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

  void _cancelConnection() {
    _gameService.disconnect();
    if (mounted) {
      setState(() {
        _isConnecting = false;
        _connectionError = '接続がキャンセルされました';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(' マルチプレイ'),
        backgroundColor: azukiColor,
        foregroundColor: creamColor,
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [azukiColor, Colors.black],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              children: [
                const SizedBox(height: 40),
                
                // タイトル
                const Text(
                  '🧊 あずきバー溶かし合戦',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: creamColor,
                  ),
                  textAlign: TextAlign.center,
                ),
                
                const SizedBox(height: 20),
                
                // 説明
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: creamColor.withOpacity(0.9),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    'みんなでダジャレを言い合って\nあずきバーを溶かそう！\n最後まで残った人の勝ち！',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.brown,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                
                const SizedBox(height: 40),
                
                // プレイヤー名入力
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: creamColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'プレイヤー名',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.brown,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _playerNameController,
                        decoration: const InputDecoration(
                          hintText: 'お名前を入力してください',
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                        ),
                        maxLength: 12,
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 20),
                
                // エラーメッセージ
                if (_connectionError != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade100,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.black),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error, color: Colors.black),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _connectionError!,
                            style: const TextStyle(color: Colors.black),
                          ),
                        ),
                      ],
                    ),
                  ),
                
                const SizedBox(height: 20),
                
                // 接続ボタン
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: _isConnecting
                      ? Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const CircularProgressIndicator(strokeWidth: 2),
                            const SizedBox(width: 12),
                            const Text('接続中...'),
                            const SizedBox(width: 12),
                            TextButton(
                              onPressed: _cancelConnection,
                              child: const Text('キャンセル'),
                            ),
                          ],
                        )
                      : ElevatedButton(
                          onPressed: _connectToServer,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: creamColor,
                            foregroundColor: Colors.black,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text(
                            'ゲームに参加',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                ),
                
                const Spacer(),
                
                // 戻るボタン
                TextButton(
                  onPressed: () => context.pop(),
                  child: const Text(
                    'メニューに戻る',
                    style: TextStyle(
                      color: creamColor,
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
}
