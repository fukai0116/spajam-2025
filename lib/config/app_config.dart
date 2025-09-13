class AppConfig {
  // 環境に応じてサーバーURLを切り替え
  static const bool isProduction = bool.fromEnvironment('dart.vm.product');
  
  static String get serverUrl {
    // Flutter Web では常に本番環境を使用（一時的な修正）
    // 本番デプロイ用の設定
    return 'https://spajam-2025.onrender.com';
    
    // 開発時にローカルサーバーを使用したい場合は以下をコメントアウト
    // if (kDebugMode) {
    //   return 'http://localhost:3000';
    // } else {
    //   return 'https://spajam-2025.onrender.com';
    // }
  }
  
  static String get apiBaseUrl => '$serverUrl/api';
}