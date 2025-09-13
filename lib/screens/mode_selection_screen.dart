import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ModeSelectionScreen extends StatelessWidget {
  const ModeSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        
        title: const Text(
          'モード選択',
          style: TextStyle(fontSize: 16, letterSpacing: 0.02),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(20.0),
          child: Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: Text(
              'シングルプレイ',
              style: TextStyle(color: theme.colorScheme.secondary, fontSize: 12),
            ),
          ),
        ),
        backgroundColor: theme.colorScheme.surface,
        elevation: 1,
        centerTitle: true,
        
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
                          '・タイムアタックのみ：制限時間内に温度を一定以上まで上げる。',
                          style: TextStyle(
                            color: theme.colorScheme.onSurface.withOpacity(0.8),
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: Padding(
        padding: EdgeInsets.fromLTRB(16, 8, 16, 8 + MediaQuery.of(context).padding.bottom),
        child: ElevatedButton(
          onPressed: () {
            context.push('/game');
          },
          child: const Text('タイムアタック'),
        ),
      ),
    );
  }
}