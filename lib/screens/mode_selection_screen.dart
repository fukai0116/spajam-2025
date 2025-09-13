import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:spajam2025/config/app_config.dart';
import 'package:spajam2025/config/color_schemes.dart';

class ModeSelectionScreen extends StatefulWidget {
  const ModeSelectionScreen({super.key});

  @override
  State<ModeSelectionScreen> createState() => _ModeSelectionScreenState();
}

class _ModeSelectionScreenState extends State<ModeSelectionScreen> {
  bool _isServerOnline = false;
  bool _isLoading = true;
  String? _connectionError;
  Timer? _healthCheckTimer;

  @override
  void initState() {
    super.initState();
    _checkServerStatus();
    _healthCheckTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
      _checkServerStatus();
    });
  }

  @override
  void dispose() {
    _healthCheckTimer?.cancel();
    super.dispose();
  }

  Future<void> _checkServerStatus() async {
    try {
      final response = await http.get(Uri.parse('${AppConfig.apiBaseUrl}/health')).timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        if (mounted) {
          setState(() {
            _isServerOnline = true;
            _connectionError = null;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _isServerOnline = false;
            _connectionError = 'サーバーに接続できませんでした';
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isServerOnline = false;
          _connectionError = 'サーバーに接続できませんでした';
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        leading: TextButton.icon(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back_ios_new, size: 14),
          label: const Text('戻る'),
          style: TextButton.styleFrom(
            foregroundColor: theme.textTheme.bodyMedium?.color,
            padding: const EdgeInsets.symmetric(horizontal: 12),
          ),
        ),
        leadingWidth: 80,
        title: const Text(
          'モード選択',
          style: TextStyle(fontSize: 16, letterSpacing: 0.02),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(20.0),
          child: Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: Text(
              'ゲームモードを選択してください',
              style: TextStyle(color: theme.colorScheme.secondary, fontSize: 12),
            ),
          ),
        ),
        backgroundColor: theme.colorScheme.surface,
        elevation: 1,
        centerTitle: true,
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 24),
                
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '補足',
                          style: TextStyle(
                            fontSize: 14,
                            color: theme.colorScheme.secondary,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          '・ダジャレでAIが評価し、あずきバーの温度が変化します。\n・寒いダジャレほどあずきバーが溶けます。\n・制限時間内にあずきバーを完全に溶かそう！',
                          style: TextStyle(
                            color: theme.colorScheme.onSurface.withOpacity(0.8),
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // シングルプレイボタン
                ElevatedButton(
                  onPressed: () => context.push('/mode/single_play'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: theme.colorScheme.primary,
                    foregroundColor: creamColor,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.person),
                      SizedBox(width: 8),
                      Text(
                        'シングルプレイ',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 12),

                if (_isLoading)
                  const Center(child: CircularProgressIndicator())
                else if (_connectionError != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8.0),
                    child: Column(
                      children: [
                        Text(
                          _connectionError!,
                          style: const TextStyle(color: Colors.red),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        ElevatedButton(
                          onPressed: () {
                            setState(() {
                              _isLoading = true;
                            });
                            _checkServerStatus();
                          },
                          child: const Text('再接続'),
                        ),
                      ],
                    ),
                  ),
                
                // マルチプレイボタン
                ElevatedButton(
                  onPressed: _isServerOnline ? () => context.push('/multiplay') : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: azukiColor,
                    foregroundColor: creamColor,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.people),
                      SizedBox(width: 8),
                      Text(
                        'マルチプレイ',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
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