import 'package:flutter/foundation.dart';

class AppConfig {
  // 環境に応じてサーバーURLを切り替え
  static const bool isProduction = bool.fromEnvironment('dart.vm.product');
  
  static String get serverUrl {
    // Flutter Webのリリースビルドでは常に本番環境を使用
    // デバッグ時のみローカルサーバーを使用
    if (kDebugMode) {
      // 開発環境: ローカルサーバー
      return 'http://localhost:3000';
    } else {
      // 本番環境: Render.comのURL
      return 'https://spajam-2025.onrender.com';
    }
  }
  
  static String get apiBaseUrl => '$serverUrl/api';
}