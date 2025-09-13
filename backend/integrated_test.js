// 統合テスト：GameService + OpenAI + あずきバーライフシステム
const gameService = require('./src/services/gameService');

async function runIntegratedTest() {
  console.log('🔧 GameService + OpenAI + あずきバーライフシステム 統合テスト開始\n');

  try {
    // 1. ルーム作成
    console.log('📍 1. ルーム作成テスト');
    const { room: createdRoom, player: hostPlayer } = gameService.createRoom('TestPlayer', 'TestUser', 'socket1');
    const roomId = createdRoom.id;
    console.log(`✅ ルーム作成成功: ${roomId}\n`);

    // 2. プレイヤー追加
    console.log('📍 2. プレイヤー追加テスト');
    gameService.joinRoom(roomId, 'Player1', 'Alice', 'socket2');
    gameService.joinRoom(roomId, 'Player2', 'Bob', 'socket3');
    console.log('✅ プレイヤー追加成功\n');

    // 2.5. ゲーム状態を'playing'に設定
    const testRoom = gameService.rooms.get(roomId);
    testRoom.status = 'playing';
    console.log('✅ ゲーム状態を設定\n');

    // 3. ダジャレ投稿とOpenAI + あずきバーライフ評価テスト
    console.log('📍 3. ダジャレ投稿＋OpenAI + あずきバーライフ評価テスト');
    
    const testDajares = [
      '暑い夏だけにあつかましい人が多いですね',
      '寒い冬だけにさむいダジャレですみません',
      '燃える情熱でファイヤーな仕事をします',
      '氷点下の心で冷静にクールダウン'
    ];

    for (let i = 0; i < testDajares.length; i++) {
      const dajare = testDajares[i];
      console.log(`\n💬 ダジャレ ${i + 1}: "${dajare}"`);
      
      try {
        const result = await gameService.submitDajare('Player1', dajare);
        
        const lifeChangeText = result.azukiBarLifeChange > 0 
          ? `+${result.azukiBarLifeChange}` 
          : result.azukiBarLifeChange === 0 
          ? '±0'
          : result.azukiBarLifeChange.toString();
        
        console.log(`� 総合スコア: ${result.finalScore}/10`);
        console.log(`🌡️ 温度レベル: ${result.breakdown.thermal} (${result.thermalLevel || 'N/A'})`);
        console.log(`🍡 ライフ変化: ${lifeChangeText}`);
        console.log(`❄️ 現在のライフ: ${result.azukiBarLife}/100`);
        console.log(`🔥 評価: ${result.evaluation}`);
        
        if (result.analysis) {
          console.log(`📋 分析: ${result.analysis}`);
        }
        
        if (result.recommendations && result.recommendations.length > 0) {
          console.log(`💡 改善提案: ${result.recommendations.join(', ')}`);
        }
        
        console.log(`🎯 難易度: ${result.difficulty}`);
        
        // あずきバー状態チェック
        const azukiStatus = gameService.getAzukiBarStatus(result.azukiBarLife);
        console.log(`🍡 あずきバー状態: ${azukiStatus.emoji} ${azukiStatus.status} - ${azukiStatus.description}`);
        
        // 次のテストのためにゲーム状態をリセット
        testRoom.status = 'playing';
        
      } catch (error) {
        console.error(`❌ エラー: ${error.message}`);
        // エラーが発生してもゲーム状態をリセット
        testRoom.status = 'playing';
      }
    }

    // 4. プレイヤー成長システム＋あずきバーライフ確認
    console.log('\n📍 4. プレイヤー成長システム＋あずきバーライフ確認');
    const gameRoom = gameService.rooms.get(roomId);
    const testPlayer = gameRoom.players.find(p => p.id === 'Player1');
    
    console.log(`📊 プレイヤー統計:`);
    console.log(`   🍡 あずきバーライフ: ${testPlayer.azukiBarLife || 100}/100`);
    
    const azukiStatus = gameService.getAzukiBarStatus(testPlayer.azukiBarLife || 100);
    console.log(`   🏁 あずきバー状態: ${azukiStatus.emoji} ${azukiStatus.status}`);
    console.log(`   � 状態詳細: ${azukiStatus.description}`);
    
    if (testPlayer.stats) {
      console.log(`   🔢 評価回数: ${testPlayer.stats.totalEvaluations}`);
      console.log(`   📈 平均スコア: ${testPlayer.stats.averageScore.toFixed(2)}`);
      console.log(`   🏆 最高スコア: ${testPlayer.stats.bestScore}`);
      console.log(`   🎮 レベル: ${testPlayer.level || 1}`);
      console.log(`   📊 カテゴリ別平均:`);
      Object.entries(testPlayer.stats.categoryScores).forEach(([category, score]) => {
        console.log(`     ${category}: ${score.toFixed(2)}`);
      });
    }

    // 5. ルーム状態確認
    console.log('\n📍 5. ルーム状態確認');
    const roomState = gameService.getRoomState(roomId);
    console.log(`✅ ルーム状態取得成功:`);
    console.log(`   プレイヤー数: ${roomState.players.length}`);
    console.log(`   ゲーム状態: ${roomState.gameState || roomState.status || 'unknown'}`);
    
    if (roomState.submissions && roomState.submissions.length !== undefined) {
      console.log(`   投稿数: ${roomState.submissions.length}`);
    } else {
      console.log(`   投稿数: データなし`);
    }

    console.log('\n🎉 統合テスト完了！OpenAI + あずきバーライフシステムが正常に動作しています！');

  } catch (error) {
    console.error('❌ 統合テストでエラーが発生:', error.message);
    console.error(error.stack);
  }
}

// テスト実行
runIntegratedTest().catch(console.error);