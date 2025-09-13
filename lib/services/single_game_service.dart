import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class SingleGameService {
  static String get baseUrl => AppConfig.apiBaseUrl;
  String? _playerId;
  String? _playerName;
  
  // ゲーム状態
  GameState? _currentGameState;
  
  // StreamController for game state updates
  final StreamController<GameState> _gameStateController = StreamController<GameState>.broadcast();
  Stream<GameState> get gameStateStream => _gameStateController.stream;
  
  // StreamController for evaluation results
  final StreamController<EvaluationResult> _evaluationController = StreamController<EvaluationResult>.broadcast();
  Stream<EvaluationResult> get evaluationStream => _evaluationController.stream;

  GameState? get currentGameState => _currentGameState;
  bool get isGameActive => _currentGameState != null && !_currentGameState!.isGameOver;

  // ゲーム開始
  Future<bool> startGame(String playerName) async {
    try {
      _playerId = 'player_${DateTime.now().millisecondsSinceEpoch}';
      _playerName = playerName;

      print('🔗 Connecting to: $baseUrl');
      print('🌍 isProduction: ${AppConfig.isProduction}');
      print('🌐 serverUrl: ${AppConfig.serverUrl}');

      final response = await http.post(
        Uri.parse('$baseUrl/game/single/start'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'playerId': _playerId,
          'playerName': _playerName,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success']) {
          _currentGameState = GameState.fromJson(data['gameState']);
          _gameStateController.add(_currentGameState!);
          return true;
        }
      }
      return false;
    } catch (e) {
      print('ゲーム開始エラー: $e');
      return false;
    }
  }

  // ダジャレ評価
  Future<bool> evaluateDajare(String dajare) async {
    if (_playerId == null || !isGameActive) {
      print('評価失敗: プレイヤーIDなし または ゲーム非アクティブ');
      return false;
    }

    try {
      print('ダジャレ評価リクエスト: $_playerId, "$dajare"');
      
      final response = await http.post(
        Uri.parse('$baseUrl/game/single/dajare'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'playerId': _playerId,
          'dajare': dajare,
        }),
      );

      print('評価レスポンス: ${response.statusCode}');
      print('評価レスポンスボディ: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('評価データ: $data');
        
        if (data['success']) {
          final result = EvaluationResult.fromJson(data['result']);
          _currentGameState = result.gameState;
          
          print('評価結果: ${result.evaluation.comment}');
          print('ライフ変化: ${result.lifeDelta}');
          
          _evaluationController.add(result);
          _gameStateController.add(_currentGameState!);
          
          return true;
        }
      }
      return false;
    } catch (e) {
      print('ダジャレ評価エラー: $e');
      return false;
    }
  }

  // ゲーム状態取得
  Future<void> refreshGameState() async {
    if (_playerId == null) return;

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/game/single/$_playerId/state'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success']) {
          _currentGameState = GameState.fromJson(data['gameState']);
          _gameStateController.add(_currentGameState!);
        }
      }
    } catch (e) {
      print('ゲーム状態取得エラー: $e');
    }
  }

  // ゲーム終了
  Future<GameReport?> endGame() async {
    if (_playerId == null) return null;

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/game/single/$_playerId/end'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success']) {
          final report = GameReport.fromJson(data['report']);
          _currentGameState = null;
          return report;
        }
      }
      return null;
    } catch (e) {
      print('ゲーム終了エラー: $e');
      return null;
    }
  }

  // リソースクリーンアップ
  void dispose() {
    _gameStateController.close();
    _evaluationController.close();
  }
}

// データモデル
class GameState {
  final String playerId;
  final String playerName;
  final int azukiBarLife;
  final int dajareCount;
  final double averageTemperature;
  final bool isGameOver;
  final int timeRemaining;
  final int score;

  GameState({
    required this.playerId,
    required this.playerName,
    required this.azukiBarLife,
    required this.dajareCount,
    required this.averageTemperature,
    required this.isGameOver,
    required this.timeRemaining,
    required this.score,
  });

  factory GameState.fromJson(Map<String, dynamic> json) {
    return GameState(
      playerId: json['playerId'] ?? '',
      playerName: json['playerName'] ?? '',
      azukiBarLife: json['azukiBarLife'] ?? 100,
      dajareCount: json['dajareCount'] ?? 0,
      averageTemperature: (json['averageTemperature'] ?? 0.0).toDouble(),
      isGameOver: json['isGameOver'] ?? false,
      timeRemaining: json['timeRemaining'] ?? 0,
      score: json['score'] ?? 0,
    );
  }

  // あずきバーの状態テキスト
  String get azukiBarStatusText {
    if (azukiBarLife >= 90) return '完璧に凍っています ❄️';
    if (azukiBarLife >= 70) return 'しっかり凍っています 🧊';
    if (azukiBarLife >= 50) return '適度な固さです 🍡';
    if (azukiBarLife >= 30) return '少し柔らかくなってきました 💧';
    if (azukiBarLife >= 10) return 'かなり溶けています 💦';
    return '完全に溶けました！ 🌊';
  }

  // 残り時間（分:秒）
  String get timeRemainingText {
    final minutes = timeRemaining ~/ 60000;
    final seconds = (timeRemaining % 60000) ~/ 1000;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }
}

class DajareEvaluation {
  final double temperature;
  final int funnyScore;
  final String comment;

  DajareEvaluation({
    required this.temperature,
    required this.funnyScore,
    required this.comment,
  });

  factory DajareEvaluation.fromJson(Map<String, dynamic> json) {
    return DajareEvaluation(
      temperature: (json['temperature'] ?? 0.0).toDouble(),
      funnyScore: json['funnyScore'] ?? 0,
      comment: json['comment'] ?? '',
    );
  }

  // 温度の表示テキスト
  String get temperatureText {
    return '${temperature.toStringAsFixed(1)}°C';
  }

  // 温度による色
  Color get temperatureColor {
    if (temperature < 0) {
      return const Color(0xFF2196F3); // 青（寒い）
    } else if (temperature > 30) {
      return const Color(0xFFF44336); // 赤（暑い）
    } else {
      return const Color(0xFFFF9800); // オレンジ（暖かい）
    }
  }
}

class EvaluationResult {
  final String dajare;
  final DajareEvaluation evaluation;
  final int lifeDelta;
  final GameState gameState;

  EvaluationResult({
    required this.dajare,
    required this.evaluation,
    required this.lifeDelta,
    required this.gameState,
  });

  factory EvaluationResult.fromJson(Map<String, dynamic> json) {
    return EvaluationResult(
      dajare: json['dajare'] ?? '',
      evaluation: DajareEvaluation.fromJson(json['evaluation'] ?? {}),
      lifeDelta: json['lifeDelta'] ?? 0,
      gameState: GameState.fromJson(json['gameState'] ?? {}),
    );
  }

  String get lifeDeltaText {
    if (lifeDelta > 0) return '+$lifeDelta';
    return lifeDelta.toString();
  }
}

class GameReport {
  final String playerName;
  final int duration;
  final int finalLife;
  final int totalDajare;
  final double averageTemperature;
  final bool isCleared;
  final int finalScore;

  GameReport({
    required this.playerName,
    required this.duration,
    required this.finalLife,
    required this.totalDajare,
    required this.averageTemperature,
    required this.isCleared,
    required this.finalScore,
  });

  factory GameReport.fromJson(Map<String, dynamic> json) {
    return GameReport(
      playerName: json['playerName'] ?? '',
      duration: json['duration'] ?? 0,
      finalLife: json['finalLife'] ?? 0,
      totalDajare: json['totalDajare'] ?? 0,
      averageTemperature: (json['averageTemperature'] ?? 0.0).toDouble(),
      isCleared: json['isCleared'] ?? false,
      finalScore: json['finalScore'] ?? 0,
    );
  }

  String get durationText {
    final minutes = duration ~/ 60;
    final seconds = duration % 60;
    return '${minutes}分${seconds}秒';
  }
}