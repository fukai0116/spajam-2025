import 'package:flutter/material.dart';
import 'package:spajam2025/app_router.dart';
import 'package:spajam2025/config/color_schemes.dart';

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
        scaffoldBackgroundColor: creamColor,
        primaryColor: azukiColor,
        fontFamily: 'Noto Serif JP',
        textTheme: const TextTheme(
          bodyMedium: TextStyle(color: azukiColor),
          titleLarge: TextStyle(color: azukiColor),
        ),
        colorScheme: const ColorScheme.light(
          primary: azukiColor,
          secondary: azukiColor,
          background: creamColor,
          surface: creamColor,
          onPrimary: creamColor,
          onSecondary: creamColor,
          onBackground: azukiColor,
          onSurface: azukiColor,
        ),
        cardTheme: CardThemeData(
          color: creamColor,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: azukiColor),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: azukiColor,
            foregroundColor: creamColor,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: azukiColor),
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