
import 'package:go_router/go_router.dart';
import 'package:spajam2025/screens/start_screen.dart';
import 'package:spajam2025/screens/mode_selection_screen.dart';
import 'package:spajam2025/screens/matching_screen.dart';
import 'package:spajam2025/screens/game_screen.dart';
import 'package:spajam2025/screens/result_screen.dart';
import 'package:spajam2025/screens/single_play_screen.dart';
import 'package:spajam2025/pages/websocket_test_page.dart';

final router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const StartScreen(),
      routes: [
        GoRoute(
          path: 'mode',
          builder: (context, state) => const ModeSelectionScreen(),
          routes: [
            GoRoute(
              path: 'single_play',
              builder: (context, state) => const SinglePlayScreen(),
            ),
          ],
        ),
        GoRoute(
          path: 'matching',
          builder: (context, state) => const MatchingScreen(),
        ),
        GoRoute(
          path: 'test',
          builder: (context, state) => const WebSocketTestPage(),
        ),
      ],
    ),
    GoRoute(
      path: '/game',
      builder: (context, state) => const GameScreen(),
    ),
    GoRoute(
      path: '/result',
      builder: (context, state) => const ResultScreen(),
    ),
  ],
);
