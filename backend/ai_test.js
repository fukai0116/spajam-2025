// AI ダジャレ判定システムのテストスクリプト

const { DajareEvaluator, AdvancedDajareEvaluator } = require('./src/services/dajareEvaluator');

async function runAITests() {
  console.log('🤖 AI ダジャレ判定システム テスト開始\n');
  
  const evaluator = new DajareEvaluator();
  
  // 基本的なテストケース
  const basicTests = [
    "暑い夏だけにあつかましい人が多いですね",
    "寒い冬だけにさむいダジャレですみません", 
    "アイスクリームが溶けるくらい熱い愛です",
    "氷のように冷たい心で冷静に判断します",
    "布団が吹っ飛んだ", // 定番
    "燃える情熱でファイヤーな仕事をします",
    "このラーメン、麺が拉麺してますね",
    "プログラマーだけにバグを見つけるのはデバッグです"
  ];

  console.log('📝 基本テスト結果:');
  console.log('=' * 50);
  
  for (const dajare of basicTests) {
    console.log(`\n💬 ダジャレ: "${dajare}"`);
    
    const result = await evaluator.evaluateDajare(dajare);
    console.log(`📊 総合スコア: ${result.score}/10`);
    console.log(`🔥 評価: ${result.evaluation}`);
    console.log(`📈 詳細スコア:`);
    console.log(`   🌡️  温度: ${result.breakdown.thermal}`);
    console.log(`   ✨ 質: ${result.breakdown.quality}`);
    console.log(`   🎨 創造性: ${result.breakdown.creativity}`);
    console.log(`   🎵 音韻: ${result.breakdown.sound}`);
    
    if (result.analysis) {
      console.log(`📋 ${result.analysis.replace(/\n/g, '\n     ')}`);
    }
    
    if (result.recommendations && result.recommendations.length > 0) {
      console.log(`💡 改善提案:`);
      result.recommendations.forEach(rec => {
        console.log(`     ${rec}`);
      });
    }
  }
  
  console.log('\n\n🧪 システムテスト実行...');
  await evaluator.testEvaluationSystem();
  
  console.log('\n⏱️ パフォーマンステスト実行...');
  await evaluator.measurePerformance("熱い夏だけにあつかましいですね", 50);
  
  // 難易度別テスト
  console.log('\n\n🎚️ 難易度別テスト:');
  const testDajare = "燃える夏だけにファイヤーな気分です";
  
  for (const difficulty of ['easy', 'normal', 'hard', 'expert']) {
    const result = await evaluator.evaluateDajare(testDajare, 1.0, difficulty);
    console.log(`${difficulty.toUpperCase()}: ${result.score}/10 - ${result.evaluation}`);
  }
  
  console.log('\n🏁 全てのテスト完了！');
}

// エラーハンドリング付きで実行
runAITests().catch(error => {
  console.error('❌ テスト実行エラー:', error);
  process.exit(1);
});