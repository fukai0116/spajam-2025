import 'package:flutter/material.dart';
import 'package:spajam2025/app_router.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: '最強あずき氷菓クラッシャー',
      theme: ThemeData(
        scaffoldBackgroundColor: const Color(0xFFE7D8CE),
        primaryColor: const Color(0xFF4A1717),
        fontFamily: 'Noto Serif JP',
        textTheme: const TextTheme(
          bodyMedium: TextStyle(color: Color(0xFF1E1313)),
          titleLarge: TextStyle(color: Color(0xFF1E1313)),
        ),
        colorScheme: const ColorScheme.light(
          primary: Color(0xFF4A1717), // accent
          secondary: Color(0xFF5A2E2E), // muted
          background: Color(0xFFE7D8CE), // bg
          surface: Color(0xFFFFE7D6), // panel
          onPrimary: Colors.white,
          onSecondary: Colors.white,
          onBackground: Color(0xFF1E1313), // ink
          onSurface: Color(0xFF1E1313), // ink
        ),
        cardTheme: CardThemeData(
          color: const Color(0xFFFFE7D6), // panel
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: Color(0xFFB79B90)), // line
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFFFF2EA),
            foregroundColor: const Color(0xFF1E1313),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: Color(0xFF4A1717)), // accent
            ),
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
            textStyle: const TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
      ),
      routerConfig: router,
    );
  }
}