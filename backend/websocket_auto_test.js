const io = require('socket.io-client');

console.log('🧪 WebSocket自動テスト開始');
console.log('📡 サーバー接続テスト: http://localhost:3000');

// テストクライアント1
const client1 = io('http://localhost:3000', {
  transports: ['websocket'],
  autoConnect: false
});

// テストクライアント2
const client2 = io('http://localhost:3000', {
  transports: ['websocket'],
  autoConnect: false
});

let testStep = 1;
const maxSteps = 10;

function logTest(message, isSuccess = true) {
  const status = isSuccess ? '✅' : '❌';
  console.log(`${status} Step ${testStep}/${maxSteps}: ${message}`);
  testStep++;
}

// Client 1 イベントハンドラー
client1.on('connect', () => {
  logTest('Client1 WebSocket接続成功');
  
  // プレイヤー参加
  client1.emit('player_join', {
    playerId: 'test_player_1',
    playerName: 'テストプレイヤー1'
  });
});

client1.on('join_success', (data) => {
  logTest('Client1 プレイヤー参加成功');
  
  // ルーム作成
  setTimeout(() => {
    client1.emit('create_room', {
      playerId: 'test_player_1',
      playerName: 'テストプレイヤー1'
    });
  }, 500);
});

client1.on('room_created', (data) => {
  logTest('Client1 ルーム作成成功');
  
  // Client2を同じルームに参加させる
  setTimeout(() => {
    client2.connect();
  }, 500);
});

client1.on('room_updated', (data) => {
  logTest(`Client1 ルーム更新: ${data.message}`);
  
  // ダジャレテスト
  if (data.room && data.room.playerCount >= 2) {
    setTimeout(() => {
      client1.emit('submit_dajare', {
        playerId: 'test_player_1',
        dajare: '自動テストは時間テスト'
      });
    }, 1000);
  }
});

client1.on('dajare_evaluated', (data) => {
  logTest(`Client1 ダジャレ評価: "${data.dajareResult.dajare}" スコア: ${data.dajareResult.score}`);
  
  // 人狼能力テスト
  setTimeout(() => {
    client1.emit('use_werewolf_ability', {
      playerId: 'test_player_1'
    });
  }, 1000);
});

client1.on('werewolf_ability_used', (data) => {
  logTest('Client1 人狼能力使用成功');
  
  // 投票フェーズテスト
  setTimeout(() => {
    client1.emit('start_voting', {
      playerId: 'test_player_1'
    });
  }, 1000);
});

client1.on('voting_phase_started', (data) => {
  logTest('Client1 投票フェーズ開始成功');
  
  // テスト完了
  setTimeout(() => {
    console.log('\n🎉 自動テスト完了！');
    console.log('📊 結果: WebSocket通信が正常に動作しています');
    process.exit(0);
  }, 2000);
});

// Client 2 イベントハンドラー
client2.on('connect', () => {
  logTest('Client2 WebSocket接続成功');
  
  // プレイヤー参加
  client2.emit('player_join', {
    playerId: 'test_player_2',
    playerName: 'テストプレイヤー2'
  });
});

client2.on('join_success', (data) => {
  logTest('Client2 プレイヤー参加成功');
  
  // オートマッチング（既存ルームに参加）
  setTimeout(() => {
    client2.emit('auto_match', {
      playerId: 'test_player_2',
      playerName: 'テストプレイヤー2'
    });
  }, 500);
});

// エラーハンドリング
client1.on('connect_error', (error) => {
  logTest(`Client1 接続エラー: ${error}`, false);
  process.exit(1);
});

client2.on('connect_error', (error) => {
  logTest(`Client2 接続エラー: ${error}`, false);
  process.exit(1);
});

client1.on('error', (data) => {
  logTest(`Client1 エラー: ${data.message}`, false);
});

client2.on('error', (data) => {
  logTest(`Client2 エラー: ${data.message}`, false);
});

// テスト開始
console.log('⏱️  3秒後にテスト開始...');
setTimeout(() => {
  client1.connect();
}, 3000);

// タイムアウト処理
setTimeout(() => {
  console.log('\n⏰ テストタイムアウト（30秒）');
  console.log('❌ テストが完了しませんでした');
  process.exit(1);
}, 30000);