// 簡単なWebSocket接続テスト（ブラウザ用）
const testWebSocket = () => {
  console.log('🧪 WebSocket接続テスト開始');
  
  // Socket.IOクライアントが既に読み込まれていることを確認
  if (typeof io === 'undefined') {
    console.error('❌ Socket.IOクライアントライブラリが見つかりません');
    return;
  }
  
  // WebSocket接続
  const socket = io('http://localhost:3000', {
    transports: ['websocket', 'polling'] // fallback to polling
  });
  
  // 接続成功
  socket.on('connect', () => {
    console.log('✅ WebSocket接続成功');
    console.log('Socket ID:', socket.id);
    
    // プレイヤー参加テスト
    socket.emit('player_join', {
      playerId: 'test_player_js',
      playerName: 'JavaScriptテストプレイヤー'
    });
  });
  
  // プレイヤー参加成功
  socket.on('join_success', (data) => {
    console.log('✅ プレイヤー参加成功:', data);
    
    // ルーム作成テスト
    socket.emit('create_room', {
      playerId: 'test_player_js',
      playerName: 'JavaScriptテストプレイヤー'
    });
  });
  
  // ルーム作成成功
  socket.on('room_created', (data) => {
    console.log('✅ ルーム作成成功:', data);
    
    // ダジャレ投稿テスト
    socket.emit('submit_dajare', {
      playerId: 'test_player_js',
      dajare: 'JavaScriptはJavaすくripと'
    });
  });
  
  // ダジャレ評価結果
  socket.on('dajare_evaluated', (data) => {
    console.log('✅ ダジャレ評価成功:', data.dajareResult);
    console.log('🎯 テスト完了！すべての機能が正常に動作しています');
    
    // 切断
    socket.disconnect();
  });
  
  // エラーハンドリング
  socket.on('connect_error', (error) => {
    console.error('❌ 接続エラー:', error);
  });
  
  socket.on('error', (data) => {
    console.error('❌ サーバーエラー:', data);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('🔌 切断:', reason);
  });
};

// ブラウザのコンソールで実行するためのグローバル関数
window.testWebSocket = testWebSocket;

console.log('💡 ブラウザのコンソールで testWebSocket() を実行してください');