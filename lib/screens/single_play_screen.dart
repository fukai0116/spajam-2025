import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:spajam2025/config/color_schemes.dart';
import '../services/single_game_service.dart';
import 'dart:async';

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

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ゲーム状態表示
          _buildGameStatusCard(),
          const SizedBox(height: 16),
          
          // ダジャレ入力
          _buildDajareInputCard(),
          const SizedBox(height: 16),
          
          // 最新の評価結果
          if (_lastEvaluation != null) _buildLastEvaluationCard(),
          if (_lastEvaluation != null) const SizedBox(height: 16),
          
          // 履歴
          if (_evaluationHistory.isNotEmpty) _buildHistoryCard(),
        ],
      ),
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
      ),
      body: _gameStarted ? _buildGamePlay() : _buildGameSetup(),
    );
  }
}