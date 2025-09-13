class AppConfig {
  // 環境に応じてサーバーURLを切り替え
  static const bool isProduction = bool.fromEnvironment('dart.vm.product');
  
  static String get serverUrl {
    if (isProduction) {
      // 本番環境: Render.comのURL
      return 'https://spajam-2025.onrender.com';
    } else {
      // 開発環境: ローカルサーバー
      return 'http://localhost:3000';
    }
  }
  
  static String get apiBaseUrl => '$serverUrl/api';
}