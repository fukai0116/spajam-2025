import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ModeSelectionScreen extends StatelessWidget {
  const ModeSelectionScreen({super.key});

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
              'あずきバー溶かしチャレンジ',
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
                
                // プレイボタン（旧シングルプレイ）
                ElevatedButton(
                  onPressed: () => context.push('/mode/single_play'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: theme.colorScheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 20),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.play_arrow, size: 28),
                      SizedBox(width: 12),
                      Text(
                        'プレイ',
                        style: TextStyle(
                          fontSize: 18,
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