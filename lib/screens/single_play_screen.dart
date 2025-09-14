import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:spajam2025/config/color_schemes.dart';
import '../services/single_game_service.dart';
import 'dart:async';
import 'package:spajam2025/widgets/azuki_bar_video.dart';

class SinglePlayScreen extends StatefulWidget {
  const SinglePlayScreen({super.key});

  @override
  State<SinglePlayScreen> createState() => _SinglePlayScreenState();
}

class _SinglePlayScreenState extends State<SinglePlayScreen> {
  final SingleGameService _gameService = SingleGameService();
  final TextEditingController _playerNameController = TextEditingController();
  final TextEditingController _dajareController = TextEditingController();
  
  GameState? _gameState;
  EvaluationResult? _lastEvaluation;
  List<EvaluationResult> _evaluationHistory = [];
  bool _isLoading = false;
  bool _gameStarted = false;
  bool _historyExpanded = false;
  bool _ending = false;
  String _endReason = '';

  // ローカル制限時間（1:30）
  static const int _localLimitMs = 90 * 1000;
  int _localRemainingMs = 0;
  Timer? _localTimer;
  
  StreamSubscription<GameState>? _gameStateSubscription;
  StreamSubscription<EvaluationResult>? _evaluationSubscription;

  @override
  void initState() {
    super.initState();
    
    // ゲーム状態の監視
    _gameStateSubscription = _gameService.gameStateStream.listen((gameState) {
      setState(() {
        _gameState = gameState;
      });

      // 勝利条件① ライフが0になったら終了
      if (!_ending && gameState.azukiBarLife <= 0) {
        _ending = true;
        _endReason = 'victory'; // ライフ0到達
        _endGameAndNavigate();
      }
    });
    
    // 評価結果の監視
    _evaluationSubscription = _gameService.evaluationStream.listen((result) {
      setState(() {
        _lastEvaluation = result;
        _evaluationHistory.insert(0, result);
        if (_evaluationHistory.length > 10) {
          _evaluationHistory = _evaluationHistory.take(10).toList();
        }
      });
      
      // 評価結果の振動フィードバック
      HapticFeedback.lightImpact();
    });
  }

  @override
  void dispose() {
    _localTimer?.cancel();
    _gameStateSubscription?.cancel();
    _evaluationSubscription?.cancel();
    _gameService.dispose();
    _playerNameController.dispose();
    _dajareController.dispose();
    super.dispose();
  }

  Future<void> _startGame() async {
    if (_playerNameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('プレイヤー名を入力してください')),
      );
      return;
    }

    setState(() => _isLoading = true);
    
    final success = await _gameService.startGame(_playerNameController.text.trim());
    
    setState(() {
      _isLoading = false;
      _gameStarted = success;
    });

    if (!success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('ゲーム開始に失敗しました')),
      );
    } else {
      // ローカル制限時間（1:30）を開始
      _localRemainingMs = _localLimitMs;
      _localTimer?.cancel();
      _localTimer = Timer.periodic(const Duration(seconds: 1), (t) {
        if (!_gameStarted || _ending) {
          t.cancel();
          return;
        }
        if (mounted) {
          setState(() {
            _localRemainingMs = (_localRemainingMs - 1000).clamp(0, _localLimitMs);
          });
        }
        if (_localRemainingMs <= 0 && !_ending) {
          _ending = true;
          _endReason = 'timeout';
          _endGameAndNavigate();
        }
      });
    }
  }

  Future<void> _evaluateDajare() async {
    if (_dajareController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('ダジャレを入力してください')),
      );
      return;
    }

    setState(() => _isLoading = true);
    
    final success = await _gameService.evaluateDajare(_dajareController.text.trim());
    
    setState(() => _isLoading = false);
    
    if (success) {
      _dajareController.clear();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('評価に失敗しました')),
      );
    }
  }

  Future<void> _endGame() async {
    final report = await _gameService.endGame();
    if (report != null) {
      _showGameResult(report);
    }
  }

  Future<void> _endGameAndNavigate() async {
    // サーバ側セッションを閉じる
    await _gameService.endGame();
    if (!mounted) return;
    final gs = _gameState;
    final payload = {
      'playerName': gs?.playerName ?? '',
      'score': gs?.score ?? 0,
      'endReason': _endReason,
      'life': gs?.azukiBarLife ?? 0,
    };
    context.go('/result', extra: payload);
  }

  void _showGameResult(GameReport report) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Text(report.isCleared ? '🎉 ゲームクリア！' : '⏰ ゲーム終了'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('プレイ時間: ${report.durationText}'),
            Text('総ダジャレ数: ${report.totalDajare}個'),
            Text('平均温度: ${report.averageTemperature.toStringAsFixed(1)}°C'),
            Text('最終スコア: ${report.finalScore}点'),
            Text('最終ライフ: ${report.finalLife}'),
            const SizedBox(height: 8),
            Text(
              report.isCleared ? 'あずきバーを完全に溶かしました！' : 'あずきバーは溶けきりませんでした',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: report.isCleared ? Colors.green : Colors.orange,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              setState(() {
                _gameStarted = false;
                _gameState = null;
                _lastEvaluation = null;
                _evaluationHistory.clear();
                _playerNameController.clear();
              });
            },
            child: const Text('新しいゲーム'),
          ),
        ],
      ),
    );
  }

  Widget _buildGameSetup() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'シングルプレイゲーム',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          const Text(
            'ダジャレであずきバーを溶かそう！',
            style: TextStyle(fontSize: 16, color: Colors.grey),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          TextField(
            controller: _playerNameController,
            decoration: const InputDecoration(
              labelText: 'プレイヤー名',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.person),
            ),
            maxLength: 20,
            onSubmitted: (_) => _startGame(),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _isLoading ? null : _startGame,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: _isLoading 
              ? const CircularProgressIndicator()
              : const Text('ゲーム開始', style: TextStyle(fontSize: 18)),
          ),
          const SizedBox(height: 16), // スペース
          TextButton(
            onPressed: () {
              // ホーム画面に戻る
              context.go('/'); // go_router を使う
            },
            child: const Text('キャンセル'),
          ),
        ],
      ),
    );
  }

  Widget _buildGamePlay() {
    if (_gameState == null) return const Center(child: CircularProgressIndicator());

    final durability = _gameState!.azukiBarLife;

    final topOffset = MediaQuery.of(context).padding.top + kToolbarHeight + 44; // AppBar + 追加入力

    return Stack(
      children: [
        // 背景動画（画面いっぱい、左右見切れ可）
        Positioned.fill(
          child: AzukiBarVideoWidget(
            durability: durability,
            background: true,
            coverScale: 0.9, // 少し小さめに表示
          ),
        ),

        // 薄いグラデーションオーバーレイ（可読性向上）
        Positioned.fill(
          child: IgnorePointer(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withOpacity(0.20),
                    Colors.black.withOpacity(0.05),
                    Colors.black.withOpacity(0.35),
                  ],
                  stops: const [0.0, 0.5, 1.0],
                ),
              ),
            ),
          ),
        ),

        // 右下付近：最新評価ミニログ（入力欄の少し上）
        if (_lastEvaluation != null)
          Positioned(
            left: 12,
            right: 12,
            bottom: 96,
            child: Align(
              alignment: Alignment.bottomRight,
              child: Builder(builder: (context) {
                final width = MediaQuery.of(context).size.width - 24;
                final maxW = width.clamp(240.0, 380.0);
                return ConstrainedBox(
                  constraints: BoxConstraints(maxWidth: maxW),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.35),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white24),
                    ),
                    padding: const EdgeInsets.all(12),
                    child: _buildLatestEvalCompact(),
                  ),
                );
              }),
            ),
          ),

        // 下部：ダジャレ入力（シンプルUI）
        Positioned(
          left: 12,
          right: 12,
          bottom: 12,
          child: _buildDajareInputInline(),
        ),

        // 履歴パネル（スライド展開、ヘッダー直下）
        if (_historyExpanded)
          Positioned(
            left: 12,
            right: 12,
            top: topOffset,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.55),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white24),
              ),
              padding: const EdgeInsets.all(12),
              height: 240,
              child: _buildHistoryCompact(),
            ),
          ),
      ],
    );
  }

  // 上部ヘッダー（プレイヤー情報・スコア・時間・ライフをひとまとめに）
  Widget _buildHeaderBar() {
    final game = _gameState!;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.45),
        border: const Border(bottom: BorderSide(color: Colors.white24, width: 0.5)),
      ),
      child: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  game.playerName.isNotEmpty ? game.playerName : 'プレイヤー',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(width: 12),
                Text('スコア ${game.score}', style: const TextStyle(color: Colors.white70)),
                const SizedBox(width: 12),
                Text('ダジャレ ${game.dajareCount}', style: const TextStyle(color: Colors.white70)),
                const Spacer(),
                Text('残り ${game.timeRemainingText}', style: const TextStyle(color: Colors.white)),
              ],
            ),
            const SizedBox(height: 6),
            // ライフバー（細身）
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                minHeight: 8,
                value: game.azukiBarLife / 100,
                backgroundColor: Colors.white24,
                valueColor: AlwaysStoppedAnimation<Color>(
                  game.azukiBarLife > 70 ? Colors.lightBlueAccent :
                  game.azukiBarLife > 30 ? Colors.orangeAccent : Colors.redAccent,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // シンプルな入力UI（送信矢印をフィールド内に）
  Widget _buildDajareInputInline() {
    return Material(
      color: Colors.transparent,
      child: TextField(
        controller: _dajareController,
        onSubmitted: (_) => _evaluateDajare(),
        maxLines: 2,
        minLines: 1,
        decoration: InputDecoration(
          hintText: '寒いダジャレであずきバーを溶かそう…',
          filled: true,
          fillColor: Colors.white.withOpacity(0.85),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.black.withOpacity(0.1))),
          suffixIcon: IconButton(
            onPressed: _isLoading || _gameState?.isGameOver == true ? null : _evaluateDajare,
            icon: const Icon(Icons.send_rounded),
            color: Colors.black87,
            tooltip: '送信',
          ),
        ),
      ),
    );
  }

  // 右上に重ねる軽量版の最新評価表示
  Widget _buildLatestEvalCompact() {
    final e = _lastEvaluation!;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        const Text('最新の評価', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Text('"${e.dajare}"', maxLines: 2, overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: Colors.white70, fontStyle: FontStyle.italic)),
        const SizedBox(height: 6),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('温度: ${e.evaluation.temperatureText}', style: TextStyle(color: e.evaluation.temperatureColor)),
            Text('変化: ${e.lifeDeltaText}', style: TextStyle(color: e.lifeDelta < 0 ? Colors.lightBlueAccent : Colors.orangeAccent)),
          ],
        ),
        const SizedBox(height: 6),
        Text(e.evaluation.comment, maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white70, fontSize: 12)),
      ],
    );
  }

  // 下部履歴のコンパクト版
  Widget _buildHistoryCompact() {
    if (_evaluationHistory.isEmpty) {
      return const Center(child: Text('履歴はまだありません', style: TextStyle(color: Colors.white70)));
    }
    return ListView.builder(
      itemCount: _evaluationHistory.length,
      itemBuilder: (context, index) {
        final ev = _evaluationHistory[index];
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 6.0),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  ev.dajare,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Colors.white),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${ev.evaluation.temperatureText} / ${ev.lifeDeltaText}',
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildGameStatusCard() {
    final gameState = _gameState!;
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('プレイヤー: ${gameState.playerName}'),
                    Text('時間: ${gameState.timeRemainingText}'),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('スコア: ${gameState.score}'),
                    Text('ダジャレ数: ${gameState.dajareCount}'),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            // あずきバーライフ表示
            Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('🍭 あずきバーライフ', style: TextStyle(fontWeight: FontWeight.bold)),
                    Text('${gameState.azukiBarLife}/100', style: const TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: gameState.azukiBarLife / 100,
                  backgroundColor: Colors.grey[300],
                  valueColor: AlwaysStoppedAnimation<Color>(
                    gameState.azukiBarLife > 70 ? Colors.blue :
                    gameState.azukiBarLife > 30 ? Colors.orange : Colors.red,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  gameState.azukiBarStatusText,
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            // 平均温度
            if (gameState.dajareCount > 0)
              Text('平均温度: ${gameState.averageTemperature.toStringAsFixed(1)}°C'),
            
            const SizedBox(height: 8),
            
            // ゲーム終了ボタン
            ElevatedButton(
              onPressed: _endGame,
              style: ElevatedButton.styleFrom(backgroundColor: azukiColor),
              child: const Text('ゲーム終了', style: TextStyle(color: creamColor)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDajareInputCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'ダジャレを入力してください',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _dajareController,
              decoration: const InputDecoration(
                hintText: '寒いダジャレであずきバーを溶かそう！',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
              maxLength: 200,
              onSubmitted: (_) => _evaluateDajare(),
            ),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: _isLoading || _gameState?.isGameOver == true ? null : _evaluateDajare,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: _isLoading 
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('評価する'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLastEvaluationCard() {
    final evaluation = _lastEvaluation!;
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '最新の評価結果',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '"${evaluation.dajare}"',
                style: const TextStyle(fontStyle: FontStyle.italic),
              ),
            ),
            
            const SizedBox(height: 12),
            
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.thermostat,
                          color: evaluation.evaluation.temperatureColor,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          evaluation.evaluation.temperatureText,
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: evaluation.evaluation.temperatureColor,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text('面白さ: ${evaluation.evaluation.funnyScore}/10'),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'ライフ変化: ${evaluation.lifeDeltaText}',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: evaluation.lifeDelta < 0 ? Colors.blue : Colors.red,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            
            const SizedBox(height: 8),
            
            Text(
              evaluation.evaluation.comment,
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '履歴',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            
            SizedBox(
              height: 200,
              child: ListView.builder(
                itemCount: _evaluationHistory.length,
                itemBuilder: (context, index) {
                  final eval = _evaluationHistory[index];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey[300]!),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            '"${eval.dajare}"',
                            style: const TextStyle(fontSize: 12),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          eval.evaluation.temperatureText,
                          style: TextStyle(
                            fontSize: 10,
                            color: eval.evaluation.temperatureColor,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          eval.lifeDeltaText,
                          style: TextStyle(
                            fontSize: 10,
                            color: eval.lifeDelta < 0 ? Colors.blue : Colors.red,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('シングルプレイ'),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            onPressed: () => setState(() => _historyExpanded = !_historyExpanded),
            icon: Icon(_historyExpanded ? Icons.history_toggle_off : Icons.history),
            tooltip: _historyExpanded ? '履歴を閉じる' : '履歴',
          ),
        ],
        bottom: _gameStarted && _gameState != null
            ? PreferredSize(
                preferredSize: const Size.fromHeight(56),
                child: _buildAppBarInfoBar(),
              )
            : null,
      ),
      body: _gameStarted ? _buildGamePlay() : _buildGameSetup(),
    );
  }

  Widget _buildAppBarInfoBar() {
    final game = _gameState!;
    final remaining = _localRemainingMs > 0
        ? _formatMs(_localRemainingMs)
        : game.timeRemainingText;
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                game.playerName.isNotEmpty ? game.playerName : 'プレイヤー',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
              const SizedBox(width: 12),
              Text('スコア ${game.score}', style: const TextStyle(color: Colors.white70)),
              const SizedBox(width: 12),
              Text('ダジャレ ${game.dajareCount}', style: const TextStyle(color: Colors.white70)),
              const Spacer(),
              Text('残り $remaining', style: const TextStyle(color: Colors.white)),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              minHeight: 6,
              value: game.azukiBarLife / 100,
              backgroundColor: Colors.white24,
              valueColor: AlwaysStoppedAnimation<Color>(
                game.azukiBarLife > 70 ? Colors.lightBlueAccent :
                game.azukiBarLife > 30 ? Colors.orangeAccent : Colors.redAccent,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text('ライフ ${game.azukiBarLife}/100', style: const TextStyle(color: Colors.white70, fontSize: 12)),
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
}
