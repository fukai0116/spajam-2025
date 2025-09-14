import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:spajam2025/config/color_schemes.dart';
import '../services/multiplay_game_service.dart';
import 'package:spajam2025/widgets/azuki_bar_video.dart';

class MultiplayRoomScreen extends StatefulWidget {
  const MultiplayRoomScreen({super.key});

  @override
  State<MultiplayRoomScreen> createState() => _MultiplayRoomScreenState();
}

class _MultiplayRoomScreenState extends State<MultiplayRoomScreen> {
  final MultiplayGameService _gameService = MultiplayGameService();
  final TextEditingController _dajareController = TextEditingController();
  
  Map<String, dynamic>? _roomState;
  Map<String, dynamic>? _gameState;
  Map<String, dynamic>? _votingState;
  
  List<Map<String, dynamic>> _dajareList = [];
  String? _lastMessage;
  bool _isSubmitting = false;
  String? _role;
  bool _showRoleOverlay = false;
  bool _showStartBanner = false;
  int _sharedLife = 100;

  @override
  void initState() {
    super.initState();
    _setupListeners();
  }

  @override
  void dispose() {
    _dajareController.dispose();
    super.dispose();
  }

  void _setupListeners() {
    // ルーム更新の監視
    _gameService.roomUpdates.listen((update) {
      switch (update['type']) {
        case 'room_updated':
          setState(() {
            _roomState = update['data']['room'];
            _lastMessage = update['data']['message'];
          });
          break;
        case 'player_disconnected':
          setState(() {
            _roomState = update['data']['room'];
            _lastMessage = '${update['data']['playerName']}が退出しました';
          });
          break;
      }
    });

    // ゲーム更新の監視
    _gameService.gameUpdates.listen((update) {
      switch (update['type']) {
        case 'role_assigned':
          setState(() {
            _role = update['data']?['role'];
            _showRoleOverlay = true;
          });
          Future.delayed(const Duration(seconds: 5), () {
            if (!mounted) return;
            setState(() { _showRoleOverlay = false; _showStartBanner = true; });
            Future.delayed(const Duration(seconds: 1), () {
              if (!mounted) return;
              setState(() { _showStartBanner = false; });
            });
          });
          break;
        case 'game_started':
          setState(() {
            _gameState = update['data']['gameState'];
            _lastMessage = update['data']['message'];
            _sharedLife = (_gameState?['azukiBarLife'] ?? 100) as int;
          });
          break;
        case 'dajare_evaluated':
          setState(() {
            _isSubmitting = false;
          });
          _dajareController.clear();
          break;
        case 'game_updated':
          setState(() {
            _gameState = update['data']['gameState'];
            _sharedLife = (_gameState?['azukiBarLife'] ?? _sharedLife) as int;
            if (update['data']['lastDajare'] != null) {
              final lastDajare = update['data']['lastDajare'];
              _lastMessage = '${lastDajare['playerName']}: ${lastDajare['dajare']}';
            }
          });
          break;
        case 'game_ended':
          _showGameResults(update['data']);
          break;
        case 'game_finished':
          _showGameResults(update['data']);
          break;
      }
    });

    // 投票更新の監視
    _gameService.votingUpdates.listen((update) {
      switch (update['type']) {
        case 'voting_started':
          setState(() {
            _votingState = update['data'];
            _dajareList = List<Map<String, dynamic>>.from(
              update['data']['dajares'] ?? []
            );
            _lastMessage = '投票フェーズが開始されました！';
          });
          break;
        case 'vote_submitted':
          setState(() {
            _votingState = update['data']['votingState'];
          });
          break;
        case 'voting_updated':
          setState(() {
            _votingState = update['data'];
          });
          break;
        case 'round_result':
          _showRoundResult(update['data']);
          break;
      }
    });

    // エラーの監視
    _gameService.errors.listen((error) {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
        _showErrorDialog(error);
      }
    });
  }

  Future<void> _startGame() async {
    try {
      await _gameService.startGame();
    } catch (error) {
      _showErrorDialog(error.toString());
    }
  }

  Future<void> _submitDajare() async {
    final dajare = _dajareController.text.trim();
    if (dajare.isEmpty) {
      _showErrorDialog('ダジャレを入力してください');
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      await _gameService.submitDajare(dajare);
    } catch (error) {
      setState(() {
        _isSubmitting = false;
      });
      _showErrorDialog(error.toString());
    }
  }

  Future<void> _vote(String dajareId) async {
    try {
      await _gameService.vote(dajareId);
    } catch (error) {
      _showErrorDialog(error.toString());
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

  void _showRoundResult(Map<String, dynamic> result) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('ラウンド結果'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('ラウンド ${result['round']} 終了'),
            const SizedBox(height: 16),
            if (result['winnerDajare'] != null)
              Text(
                '🏆 最優秀ダジャレ:\n${result['winnerDajare']['dajare']}',
                textAlign: TextAlign.center,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('次のラウンドへ'),
          ),
        ],
      ),
    );
  }

  void _showGameResults(Map<String, dynamic> results) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('🎉 ゲーム終了！'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('最終結果'),
            const SizedBox(height: 16),
            ...List.generate(
              (results['rankings'] as List? ?? []).length,
              (index) {
                final ranking = results['rankings'][index];
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    children: [
                      Text('${index + 1}位: '),
                      Text(
                        ranking['playerName'] ?? '',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const Spacer(),
                      Text('${ranking['score']}点'),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              context.pushReplacement('/multiplay/room-select');
            },
            child: const Text('ルーム選択に戻る'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: _buildAppBarTitle(),
        centerTitle: true,
        backgroundColor: azukiColor,
        foregroundColor: creamColor,
        actions: [
          // 残り時間のチップ
          Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.timer, size: 16, color: Colors.black87),
                  const SizedBox(width: 6),
                  Text(
                    '残り ${_formatMs((_gameState?['timeRemaining'] ?? 0) as int)}',
                    style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ),
          if (_roomState?['status'] == 'waiting' &&
              _roomState?['hostPlayerId'] == _gameService.playerId)
            IconButton(
              onPressed: _startGame,
              icon: const Icon(Icons.play_arrow),
              tooltip: 'ゲーム開始',
            ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: _buildAppBarInfoBar(),
        ),
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
          child: Column(
            children: [
              // メインコンテンツ（協力モードUI）
              Expanded(child: _gameState != null ? _buildCoopGameArea() : _buildMainContent()),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAppBarTitle() {
    final roleText = (_role ?? '').isNotEmpty ? _role! : 'ルーム ${_gameService.roomId ?? ''}';
    return Text(roleText, style: const TextStyle(fontWeight: FontWeight.bold));
  }

  Widget _buildAppBarInfoBar() {
    final playerName = _roomState?['players'] is List
        ? ((_roomState!['players'] as List).firstWhere(
              (p) => p['playerId'] == _gameService.playerId,
              orElse: () => null,
            )?['playerName'] as String?)
        : null;
    final score = _gameState?['players'] is List
        ? ((_gameState!['players'] as List).firstWhere(
              (p) => p['playerId'] == _gameService.playerId,
              orElse: () => null,
            )?['score'] as int?) ?? 0
        : 0;
    final dajareCount = _gameState?['players'] is List
        ? ((_gameState!['players'] as List).firstWhere(
              (p) => p['playerId'] == _gameService.playerId,
              orElse: () => null,
            )?['dajareCount'] as int?) ?? 0
        : 0;
    final life = (_gameState?['azukiBarLife'] ?? _sharedLife) as int;

    return Container(
      padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.person, size: 16, color: Colors.white70),
              const SizedBox(width: 6),
              Text(
                (playerName?.isNotEmpty == true) ? playerName! : 'あなた',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
              const SizedBox(width: 12),
              Text('スコア $score', style: const TextStyle(color: Colors.white70)),
              const SizedBox(width: 12),
              Text('ダジャレ $dajareCount', style: const TextStyle(color: Colors.white70)),
              const Spacer(),
              Row(
                children: [
                  const Icon(Icons.favorite, size: 16, color: Colors.redAccent),
                  const SizedBox(width: 4),
                  Text('ライフ $life/100', style: const TextStyle(color: Colors.white)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              minHeight: 6,
              value: life / 100,
              backgroundColor: Colors.white24,
              valueColor: AlwaysStoppedAnimation<Color>(
                life > 70 ? Colors.lightBlueAccent :
                life > 30 ? Colors.orangeAccent : Colors.redAccent,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatMs(int ms) {
    final s = (ms / 1000).floor();
    final m = s ~/ 60;
    final ss = (s % 60).toString().padLeft(2, '0');
    return '$m:$ss';
  }

  Widget _buildStatusBar() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: creamColor.withOpacity(0.9),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'ステータス: ${_getStatusText()}',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              if (_gameState != null)
                Text(
                  'ラウンド ${_gameState!['round'] ?? 1}/${_gameState!['maxRounds'] ?? 3}',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
            ],
          ),
          if (_lastMessage != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                _lastMessage!,
                style: const TextStyle(color: Colors.blue),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildMainContent() {
    if (_gameState != null) {
      return _buildGameArea();
    }
    return _buildWaitingArea();
  }

  // 協力モード用の動画＋UIオーバーレイ
  Widget _buildCoopGameArea() {
    final life = _sharedLife;
    return Stack(
      children: [
        Positioned.fill(
          child: AzukiBarVideoWidget(
            durability: life,
            background: true,
            coverScale: 0.9,
          ),
        ),
        if (_lastMessage != null)
          Positioned(
            left: 12,
            right: 12,
            bottom: 96,
            child: Align(
              alignment: Alignment.bottomRight,
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 380),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.85),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.black12),
                  ),
                  padding: const EdgeInsets.all(12),
                  child: Text(
                    _lastMessage!,
                    style: const TextStyle(color: Colors.black87),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
            ),
          ),
        Positioned(
          left: 12,
          right: 12,
          bottom: 12,
          child: _buildInputInline(),
        ),
        if (_showRoleOverlay && _role != null)
          Positioned.fill(
            child: Container(
              color: Colors.black45,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('役割', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                      const SizedBox(height: 8),
                      Text('あなたは「$_role」です。'),
                    ],
                  ),
                ),
              ),
            ),
          ),
        if (_showStartBanner)
          Positioned.fill(
            child: IgnorePointer(
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.9), borderRadius: BorderRadius.circular(12)),
                  child: const Text('Start!', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900)),
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildInputInline() {
    return Material(
      color: Colors.transparent,
      child: TextField(
        controller: _dajareController,
        onSubmitted: (_) => _submitDajare(),
        maxLines: 2,
        minLines: 1,
        decoration: InputDecoration(
          hintText: 'ダジャレを入力…',
          filled: true,
          fillColor: Colors.white.withOpacity(0.9),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
          suffixIcon: IconButton(
            onPressed: _isSubmitting ? null : _submitDajare,
            icon: const Icon(Icons.send_rounded),
          ),
        ),
      ),
    );
  }

  Widget _buildWaitingArea() {
    final players = _roomState?['players'] as List? ?? [];
    final maxPlayers = _roomState?['maxPlayers'] ?? 4;
    final isHost = _roomState?['hostPlayerId'] == _gameService.playerId;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: creamColor.withOpacity(0.9),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(Icons.people, color: Colors.brown),
                    const SizedBox(width: 8),
                    Text(
                      'プレイヤー (${players.length}/$maxPlayers)',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.brown,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                ...players.map((player) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: player['isHost'] ? azukiColor : creamColor,
                        child: Text(
                          player['playerName']?.substring(0, 1) ?? 'P',
                          style: const TextStyle(color: creamColor),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          player['playerName'] ?? '',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                      if (player['isHost'])
                        const Chip(
                          label: Text('ホスト'),
                          backgroundColor: azukiColor,
                        ),
                    ],
                  ),
                )),
              ],
            ),
          ),
          
          const Spacer(),
          
          if (isHost)
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: players.length >= 2 ? _startGame : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: azukiColor,
                  foregroundColor: creamColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  players.length >= 2 ? 'ゲーム開始' : '2人以上必要です',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            )
          else
            const Text(
              'ホストがゲームを開始するのを待っています...',
              style: TextStyle(
                color: creamColor,
                fontSize: 16,
              ),
              textAlign: TextAlign.center,
            ),
        ],
      ),
    );
  }

  Widget _buildGameArea() {
    final players = _gameState?['players'] as List? ?? [];
    
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // プレイヤー状態
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: creamColor.withOpacity(0.9),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                const Text(
                  '🧊 あずきバーライフ',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.brown,
                  ),
                ),
                const SizedBox(height: 12),
                ...players.map((player) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          player['playerName'] ?? '',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: _getLifeColor(player['azukiBarLife'] ?? 100),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          '${player['azukiBarLife'] ?? 100}%',
                          style: const TextStyle(
                            color: creamColor,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text('${player['score'] ?? 0}点'),
                    ],
                  ),
                )),
              ],
            ),
          ),
          
          const Spacer(),
        ],
      ),
    );
  }

  Widget _buildVotingArea() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: creamColor.withOpacity(0.9),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Column(
              children: [
                Text(
                  '🗳️ 投票タイム',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.brown,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  '一番面白いダジャレに投票してください！',
                  style: TextStyle(color: Colors.brown),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 16),
          
          Expanded(
            child: ListView.builder(
              itemCount: _dajareList.length,
              itemBuilder: (context, index) {
                final dajare = _dajareList[index];
                final hasVoted = _votingState?['votedPlayers']
                    ?.contains(_gameService.playerId) ?? false;
                
                return Card(
                  margin: const EdgeInsets.symmetric(vertical: 4),
                  child: ListTile(
                    title: Text(
                      dajare['dajare'] ?? '',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: Text('by ${dajare['playerName'] ?? ''}'),
                    trailing: hasVoted
                        ? const Icon(Icons.check, color: azukiColor)
                        : ElevatedButton(
                            onPressed: () => _vote(dajare['id']),
                            child: const Text('投票'),
                          ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: creamColor,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _dajareController,
              decoration: const InputDecoration(
                hintText: 'ダジャレを入力...',
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
              ),
              onSubmitted: (_) => _submitDajare(),
            ),
          ),
          const SizedBox(width: 12),
          ElevatedButton(
            onPressed: _isSubmitting ? null : _submitDajare,
            style: ElevatedButton.styleFrom(
              backgroundColor: azukiColor,
              foregroundColor: creamColor,
              padding: const EdgeInsets.symmetric(
                horizontal: 20,
                vertical: 12,
              ),
            ),
            child: _isSubmitting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: creamColor,
                    ),
                  )
                : const Text('送信'),
          ),
        ],
      ),
    );
  }

  String _getStatusText() {
    if (_votingState != null) {
      return '投票中';
    } else if (_gameState != null) {
      return 'ゲーム中';
    } else {
      return '待機中';
    }
  }

  Color _getLifeColor(int life) {
    if (life > 70) return azukiColor;
    if (life > 30) return azukiColor;
    return Colors.black;
  }
}
