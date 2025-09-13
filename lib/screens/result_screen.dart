import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ResultScreen extends StatelessWidget {
  const ResultScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Dummy data
    final scores = [
      {'name': 'you', 'score': 120, 'isWolf': false},
      {'name': 'hikari', 'score': 110, 'isWolf': false},
      {'name': 'suzu', 'score': 70, 'isWolf': false},
      {'name': 'rin', 'score': -40, 'isWolf': true},
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          '結果',
          style: TextStyle(fontSize: 16, letterSpacing: 0.02),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(20.0),
          child: Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: Text(
              '市民 vs 人狼',
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
                // Result Hero
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF2EA),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: theme.primaryColor),
                  ),
                  child: Column(
                    children: [
                      Text(
                        '市民陣営 勝利',
                        style: theme.textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.04,
                          color: const Color(0xFF3B1212),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '最終温度： +18℃',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF5A2E2E),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                // Scores
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'プレイヤー別スコア',
                          style: TextStyle(
                            fontSize: 14,
                            color: theme.colorScheme.secondary,
                          ),
                        ),
                        const SizedBox(height: 12),
                        ...scores.map((score) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4.0),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  Text(score['name'] as String),
                                  if (score['isWolf'] as bool) ...[
                                    const SizedBox(width: 8),
                                    Chip(
                                      label: const Text('人狼'),
                                      labelStyle: const TextStyle(fontSize: 10),
                                      padding: const EdgeInsets.symmetric(horizontal: 4),
                                      visualDensity: VisualDensity.compact,
                                      backgroundColor: theme.dividerColor,
                                    )
                                  ]
                                ],
                              ),
                              Text('${score['score']} pt'),
                            ],
                          ),
                        )),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                // Retry
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                         Text(
                          'リトライ',
                          style: TextStyle(
                            fontSize: 14,
                            color: theme.colorScheme.secondary,
                          ),
                        ),
                        const SizedBox(height: 12),
                        ElevatedButton(
                          onPressed: () {
                            context.go('/matching');
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: theme.colorScheme.secondary.withOpacity(0.8),
                            foregroundColor: Colors.white,
                          ),
                          child: const Text('再戦する'),
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
            context.go('/');
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.transparent,
            foregroundColor: theme.textTheme.bodyMedium?.color,
            elevation: 0,
            side: BorderSide(color: theme.dividerColor),
          ),
          child: const Text('トップに戻る'),
        ),
      ),
    );
  }
}