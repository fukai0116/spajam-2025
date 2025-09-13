import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class GameScreen extends StatefulWidget {
  const GameScreen({super.key});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  // Timer state
  static const int _totalDuration = 90;
  int _remainingSeconds = _totalDuration;
  Timer? _timer;

  // UI State
  bool _showRolePopup = true;
  bool _showStartText = false;
  bool _isTimerRunning = false;
  final String _myRole = "市民"; // Dummy role

  @override
  void initState() {
    super.initState();
    _startSequence();
  }

  void _startSequence() async {
    // Step A: Show role for 5 seconds
    await Future.delayed(const Duration(seconds: 5));
    if (!mounted) return;
    setState(() {
      _showRolePopup = false;
      _showStartText = true;
    });

    // Step B: Show "Start!" for 1.5 seconds
    await Future.delayed(const Duration(milliseconds: 1500));
    if (!mounted) return;
    setState(() {
      _showStartText = false;
      _isTimerRunning = true;
    });

    // Step C: Start countdown
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remainingSeconds > 0) {
        if (mounted) {
          setState(() {
            _remainingSeconds--;
          });
        }
      } else {
        _timer?.cancel();
        if (mounted) {
          context.go('/result');
        }
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String _formatDuration(int seconds) {
    final minutes = (seconds / 60).floor().toString().padLeft(2, '0');
    final remainingSeconds = (seconds % 60).toString().padLeft(2, '0');
    return '$minutes:$remainingSeconds';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final players = ['you', 'hikari', 'suzu', 'rin'];

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'ゲーム',
          style: TextStyle(fontSize: 16, letterSpacing: 0.02),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(20.0),
          child: Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: Text(
              'ダジャレで温度を上げよう',
              style: TextStyle(color: theme.colorScheme.secondary, fontSize: 12),
            ),
          ),
        ),
        backgroundColor: theme.colorScheme.surface,
        elevation: 1,
        centerTitle: true,
        automaticallyImplyLeading: false,
      ),
      body: Stack(
        children: [
          // Main game UI
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Timer display
                    Visibility(
                      visible: _isTimerRunning,
                      maintainSize: true,
                      maintainAnimation: true,
                      maintainState: true,
                      child: Text(
                        _formatDuration(_remainingSeconds),
                        textAlign: TextAlign.center,
                        style: theme.textTheme.headlineSmall?.copyWith(
                          fontFamily: 'ui-monospace',
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.04,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(24),
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            // Ice image
                            Image.network(
                              'https://image.itmedia.co.jp/lifestyle/articles/1705/22/ts_takaratomyarts10.jpg',
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                return Container(
                                  decoration: BoxDecoration(
                                    color: Colors.grey[300],
                                    border: Border.all(
                                      color: theme.colorScheme.secondary,
                                      width: 2,
                                    ),
                                    borderRadius: BorderRadius.circular(24),
                                  ),
                                  child: const Center(child: Text('画像読込エラー')),
                                );
                              },
                            ),
                            // Input overlay
                            Positioned(
                              bottom: 12,
                              left: 12,
                              right: 12,
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(14),
                                child: BackdropFilter(
                                  filter: ImageFilter.blur(sigmaX: 4.0, sigmaY: 4.0),
                                  child: Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: theme.colorScheme.surface.withOpacity(0.8),
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(color: const Color(0xFFB79B90)),
                                    ),
                                    child: Row(
                                      children: [
                                        Expanded(
                                          child: TextField(
                                            decoration: InputDecoration(
                                              hintText: '例：あずきバー、味は“あずきっ”と驚く旨さ！',
                                              filled: true,
                                              fillColor: Colors.white,
                                              border: OutlineInputBorder(
                                                borderRadius: BorderRadius.circular(12),
                                                borderSide: BorderSide.none,
                                              ),
                                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        SizedBox(
                                          width: 44,
                                          height: 44,
                                          child: ElevatedButton(
                                            onPressed: () { /* Send action */ },
                                            style: ElevatedButton.styleFrom(
                                              padding: EdgeInsets.zero,
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                              backgroundColor: const Color(0xFFFFF2EA),
                                              side: BorderSide(color: theme.primaryColor),
                                            ),
                                            child: const Icon(Icons.mic),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
          ),
          // Role Popup
          if (_showRolePopup)
            Container(
              color: Colors.black.withOpacity(0.7),
              child: Center(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 32),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('あなたの役割は...', style: theme.textTheme.titleMedium),
                        const SizedBox(height: 16),
                        Text(
                          _myRole,
                          style: theme.textTheme.headlineLarge?.copyWith(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          // Start Text
          if (_showStartText)
            Center(
              child: Text(
                'Start!',
                style: theme.textTheme.displayLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  shadows: [
                    const Shadow(
                      blurRadius: 10.0,
                      color: Colors.black,
                      offset: Offset(5.0, 5.0),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
      bottomNavigationBar: Padding(
        padding: EdgeInsets.fromLTRB(16, 8, 16, 8 + MediaQuery.of(context).padding.bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Wrap(
              spacing: 8.0,
              runSpacing: 8.0,
              children: players.map((player) {
                return Chip(
                  label: Text(player),
                  backgroundColor: const Color(0xFFE1C2B8),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(999),
                    side: const BorderSide(
                      color: Color(0xFFB79B90),
                      width: 1,
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  context.go('/result');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: theme.colorScheme.secondary.withOpacity(0.8),
                  foregroundColor: Colors.white,
                ),
                child: const Text('時間切れ → 結果へ'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}