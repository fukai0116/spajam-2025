
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class StartScreen extends StatelessWidget {
  const StartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          '最強あずき氷菓クラッシャー',
          style: TextStyle(fontSize: 16, letterSpacing: 0.02),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(20.0),
          child: Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: Text(
              'オンライン・アイスブレイク用ゲーム',
              style: TextStyle(color: theme.colorScheme.secondary, fontSize: 12),
            ),
          ),
        ),
        backgroundColor: theme.colorScheme.surface,
        elevation: 1,
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 24),
                // Logo
                Container(
                  height: 140,
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: theme.colorScheme.secondary.withOpacity(0.5),
                      width: 1,
                      style: BorderStyle.solid,
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(
                    child: Text(
                      'LOGO / KEY VISUAL',
                      style: TextStyle(color: theme.colorScheme.secondary),
                    ),
                  ),
                ),
                // Description card (centered)
                Expanded(
                  child: Center(
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '説明',
                              style: TextStyle(
                                fontSize: 14,
                                color: theme.colorScheme.secondary,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'ダジャレの面白さをAIが評価し、あずきバーの温度が上下。時間内に溶かせば市民勝利、凍らせたままなら人狼勝利。',
                              style: TextStyle(
                                color: theme.colorScheme.onSurface.withOpacity(0.8),
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                // Play mode card (bottom)
                Padding(
                  padding: EdgeInsets.only(bottom: 16 + MediaQuery.of(context).padding.bottom),
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            'プレイモード',
                            style: TextStyle(
                              fontSize: 14,
                              color: theme.colorScheme.secondary,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            onPressed: () {
                              context.push('/mode');
                            },
                            child: const Text('シングルプレイ'),
                          ),
                          const SizedBox(height: 10),
                          ElevatedButton(
                            onPressed: () {
                              context.push('/matching');
                            },
                            child: const Text('マルチプレイ'),
                          ),
                          const SizedBox(height: 10),
                          ElevatedButton(
                            onPressed: () {
                              context.push('/test');
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blue.shade100,
                              foregroundColor: Colors.blue.shade800,
                            ),
                            child: const Text('WebSocketテスト'),
                          ),
                        ],
                      ),
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
