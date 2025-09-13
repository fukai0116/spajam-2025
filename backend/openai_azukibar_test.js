// OpenAI + あずきバーライフシステム テストファイル
const AdvancedDajareEvaluator = require('./src/services/openaiDajareEvaluator');

async function runOpenAITests() {
  console.log('🤖 OpenAI + あずきバーライフシステム テスト開始\n');

  const evaluator = new AdvancedDajareEvaluator();

  const testDajares = [
    { dajare: '暑い夏だけにあつかましい人が多いですね', expected: 'hot' },
    { dajare: '寒い冬だけにさむいダジャレですみません', expected: 'cold' },
    { dajare: '氷点下の心で冷静にクールダウン', expected: 'very_cold' },
    { dajare: '燃える情熱でファイヤーな仕事をします', expected: 'hot' },
    { dajare: '雪の結晶のように美しい', expected: 'cold' },
    { dajare: '太陽のように熱いハートで頑張ります', expected: 'very_hot' }
  ];

  let totalLifeChange = 0;
  let currentLife = 100;

  console.log('🍡 初期あずきバーライフ: 100/100\n');

  for (let i = 0; i < testDajares.length; i++) {
    const { dajare, expected } = testDajares[i];
    
    try {
      console.log(`💬 テスト ${i + 1}: "${dajare}"`);
      
      const result = await evaluator.evaluateDajare(dajare);
      
      // ライフ変化を適用
      currentLife = Math.max(0, Math.min(100, currentLife + result.azukiBarLifeChange));
      totalLifeChange += result.azukiBarLifeChange;
      
      const lifeChangeText = result.azukiBarLifeChange > 0 
        ? `+${result.azukiBarLifeChange}` 
        : result.azukiBarLifeChange === 0 
        ? '±0'
        : result.azukiBarLifeChange.toString();
      
      console.log(`📊 総合スコア: ${result.score}/10`);
      console.log(`🌡️ 温度レベル: ${result.breakdown.thermal} (${result.thermalLevel})`);
      console.log(`🍡 ライフ変化: ${lifeChangeText}`);
      console.log(`❄️ 現在のライフ: ${currentLife}/100`);
      console.log(`🔥 評価: ${result.evaluation}`);
      
      if (result.analysis) {
        console.log(`📋 分析: ${result.analysis}`);
      }
      
      if (result.recommendations && result.recommendations.length > 0) {
        console.log(`💡 改善提案: ${result.recommendations.join(', ')}`);
      }
      
      // 特別な状態チェック
      if (currentLife === 0) {
        console.log('🧊💔 あずきバーが完全に溶けました！ゲームオーバー！');
        break;
      } else if (currentLife === 100) {
        console.log('❄️✨ あずきバーが完璧な状態です！');
      } else if (currentLife <= 20) {
        console.log('💦⚠️ あずきバーがかなり溶けています！危険！');
      }
      
      console.log('---');
      
    } catch (error) {
      console.error(`❌ エラー: ${error.message}`);
    }
    
    // APIレート制限対策で少し待機
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📈 テスト結果サマリー:');
  console.log(`🍡 総ライフ変化: ${totalLifeChange > 0 ? '+' : ''}${totalLifeChange}`);
  console.log(`❄️ 最終ライフ: ${currentLife}/100`);
  
  const finalStatus = getAzukiBarStatus(currentLife);
  console.log(`🏁 最終状態: ${finalStatus.emoji} ${finalStatus.status} - ${finalStatus.description}`);
  
  console.log('\n🎉 OpenAI + あずきバーシステムテスト完了！');
}

function getAzukiBarStatus(azukiBarLife) {
  if (azukiBarLife >= 90) return { status: '完璧', emoji: '🧊', description: 'カチカチに凍って最高の状態' };
  if (azukiBarLife >= 70) return { status: '良好', emoji: '❄️', description: 'しっかり凍っている' };
  if (azukiBarLife >= 50) return { status: '普通', emoji: '🍡', description: '適度な固さ' };
  if (azukiBarLife >= 30) return { status: '軟化', emoji: '💧', description: '少し柔らかくなってきた' };
  if (azukiBarLife >= 10) return { status: '溶解中', emoji: '💦', description: 'かなり溶けている' };
  return { status: '完全溶解', emoji: '🌊', description: '完全に溶けてしまった' };
}

// テスト実行
runOpenAITests().catch(console.error);