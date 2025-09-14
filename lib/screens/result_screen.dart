import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ResultScreen extends StatelessWidget {
  final Map<String, dynamic>? data;
  const ResultScreen({super.key, this.data});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final playerName = (data?['playerName'] as String?)?.trim();
    final score = (data?['score'] as int?) ?? 0;
    final endReason = (data?['endReason'] as String?) ?? '';
    final role = (data?['role'] as String?) ?? '';
    final winner = (data?['winner'] as String?)?.trim();
    // 勝敗タイトル：マルチはwinner優先、シングルはendReasonで判定
    final isDisturberWin = winner != null ? (winner == '和を乱す人' || winner == '和を乱す人陣営') : (endReason == 'timeout');
    final resultTitle = isDisturberWin ? '和を乱す人陣営 勝利' : '和やかな人陣営 勝利';
    // ランキング：マルチは渡されたrankingsを使用、なければ自分のみ
    final providedRankings = (data?['rankings'] as List?)?.cast<Map<String, dynamic>>();
    final rankings = providedRankings ?? [
      {
        'name': (playerName?.isNotEmpty == true) ? playerName : 'あなた',
        'score': score,
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('結果', style: TextStyle(fontSize: 16, letterSpacing: 0.02)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(20.0),
          child: Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: Text(
              '和やかな人 vs 和を乱す人',
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
                        resultTitle,
                        style: theme.textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.04,
                          color: const Color(0xFF3B1212),
                        ),
                      ),
                      const SizedBox(height: 6),
                      if (role.isNotEmpty &&
                          ((role == '和やかな人' && !isDisturberWin) ||
                           (role == '和を乱す人' && isDisturberWin)))
                        Text(
                          'あなた（$role）の勝利です！',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Colors.green[700],
                          ),
                        ),
                      // 追加で詳細を出したければここに統計表示
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                // Rankings
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('ランキング', style: TextStyle(fontSize: 14, color: theme.colorScheme.secondary)),
                        const SizedBox(height: 12),
                        for (int index = 0; index < rankings.length; index++)
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4.0),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Text('${index + 1}位: '),
                                    Text(
                                      (() {
                                        final item = rankings[index];
                                        final n = item['name'] ?? item['playerName'] ?? 'プレイヤー';
                                        return n.toString();
                                      })(),
                                      style: const TextStyle(fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                                Text('${(rankings[index]['score'] ?? 0).toString()} pt'),
                              ],
                            ),
                          ),
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
                            context.go('/mode/single_play');
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
