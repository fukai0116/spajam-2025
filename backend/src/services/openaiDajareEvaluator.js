const OpenAI = require('openai');
require('dotenv').config();

class AdvancedDajareEvaluator {
  constructor() {
    // OpenAI APIキーが設定されている場合のみ初期化
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    } else {
      console.warn('OpenAI API key not found. Will use fallback evaluation.');
      this.openai = null;
    }
    this.azukiBarMaxLife = 100; // あずきバーの最大ライフ
  }

  // OpenAI APIを使用してダジャレを評価
  async evaluateDajare(dajare, efficiencyModifier = 1, difficulty = 'normal') {
    try {
      if (!this.openai || !process.env.OPENAI_API_KEY) {
        console.warn('OpenAI API not available. Using fallback evaluation.');
        return this.fallbackEvaluation(dajare);
      }

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `あなたはダジャレ評価の専門家です。ダジャレの評価を以下の基準で行い、あずきバーライフシステムを適用してください：

【評価基準】
1. 温度レベル (-10〜10点): 寒いダジャレは低く、暑い・熱いダジャレは高く
2. 質 (0〜10点): 言葉遊びの巧妙さ、面白さ
3. 創造性 (0〜10点): オリジナリティ、ユニークさ
4. 音韻 (0〜10点): 韻の踏み方、リズム感

【あずきバーライフシステム】
- 寒いダジャレ（温度レベル-5以下）: ライフ10-30点追加（寒さで固まるため）
- 普通のダジャレ（温度レベル-4〜4）: ライフ変化なし
- 暑いダジャレ（温度レベル5以上）: ライフ10-50点減少（溶けるため）

必ず以下のJSON形式で回答してください：
{
  "thermal": 数値,
  "quality": 数値,
  "creativity": 数値,
  "sound": 数値,
  "totalScore": 数値,
  "azukiBarLifeChange": 数値,
  "evaluation": "評価コメント",
  "analysis": "詳細分析",
  "recommendations": ["改善提案1", "改善提案2"]
}`
          },
          {
            role: "user",
            content: `以下のダジャレを評価してください：「${dajare}」`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const response = completion.choices[0].message.content;
      return this.parseOpenAIResponse(response, efficiencyModifier);

    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.fallbackEvaluation(dajare);
    }
  }

  // OpenAIのレスポンスをパース
  parseOpenAIResponse(response, efficiencyModifier) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const data = JSON.parse(jsonMatch[0]);
      
      const breakdown = {
        thermal: data.thermal || 0,
        quality: data.quality || 0,
        creativity: data.creativity || 0,
        sound: data.sound || 0
      };

      const score = data.totalScore || (breakdown.thermal + breakdown.quality + breakdown.creativity + breakdown.sound) / 4;
      const finalScore = score * efficiencyModifier;

      return {
        score: Math.round(finalScore * 10) / 10,
        breakdown,
        evaluation: data.evaluation || 'AI評価が完了しました',
        analysis: data.analysis || '詳細分析が利用できます',
        recommendations: data.recommendations || [],
        azukiBarLifeChange: data.azukiBarLifeChange || 0,
        thermalLevel: this.getThermalLevelDescription(breakdown.thermal)
      };

    } catch (error) {
      console.error('Parse error:', error);
      return this.fallbackEvaluation('パース失敗');
    }
  }

  // フォールバック評価（API利用不可時）
  fallbackEvaluation(dajare) {
    const length = dajare.length;
    
    // 簡易評価ロジック
    const thermal = this.analyzeThermalLevel(dajare);
    const quality = Math.random() * 5 + 2;
    const creativity = Math.random() * 4 + 1;
    const sound = this.analyzeSoundPattern(dajare);

    const breakdown = { thermal, quality, creativity, sound };
    const score = (thermal + quality + creativity + sound) / 4;

    // あずきバーライフ変化を計算
    const azukiBarLifeChange = this.calculateAzukiBarLifeChange(thermal);

    return {
      score: Math.round(score * 10) / 10,
      breakdown,
      evaluation: this.getEvaluationText(score),
      analysis: `文字数: ${length}文字, 温度レベル: ${this.getThermalLevelDescription(thermal)}`,
      recommendations: this.generateRecommendations(breakdown),
      azukiBarLifeChange,
      thermalLevel: this.getThermalLevelDescription(thermal)
    };
  }

  // 温度レベル分析
  analyzeThermalLevel(dajare) {
    const coldWords = ['寒い', '冷たい', '氷', '雪', '冬', '冷却', 'クール', '凍結', '涼しい', '氷点下'];
    const hotWords = ['暑い', '熱い', '火', '燃える', '夏', 'ファイヤー', 'ホット', '灼熱', '溶ける', '太陽'];
    
    let thermal = 0;
    
    coldWords.forEach(word => {
      if (dajare.includes(word)) thermal -= 3; // より強い影響
    });
    
    hotWords.forEach(word => {
      if (dajare.includes(word)) thermal += 3; // より強い影響
    });
    
    // ランダム要素を追加してバラつきを作る
    thermal += (Math.random() * 4 - 2);
    
    return Math.max(-10, Math.min(10, thermal));
  }

  // 音韻パターン分析
  analyzeSoundPattern(dajare) {
    const hiraganaCount = (dajare.match(/[\u3041-\u3096]/g) || []).length;
    const katakanaCount = (dajare.match(/[\u30A1-\u30F6]/g) || []).length;
    const kanjiCount = (dajare.match(/[\u4e00-\u9faf]/g) || []).length;
    
    return Math.min(10, (hiraganaCount * 0.3 + katakanaCount * 0.5 + kanjiCount * 0.2));
  }

  // あずきバーライフ変化を計算
  calculateAzukiBarLifeChange(thermalLevel) {
    if (thermalLevel <= -5) {
      // 寒いダジャレ：ライフ追加（10-30点）
      return Math.floor(Math.random() * 21) + 10;
    } else if (thermalLevel >= 5) {
      // 暑いダジャレ：ライフ減少（10-50点）
      return -(Math.floor(Math.random() * 41) + 10);
    }
    // 普通のダジャレ：変化なし
    return 0;
  }

  // 温度レベルの説明文
  getThermalLevelDescription(thermal) {
    if (thermal <= -7) return '極寒❄️❄️❄️';
    if (thermal <= -4) return 'かなり寒い❄️❄️';
    if (thermal <= -1) return 'ちょっと寒い❄️';
    if (thermal <= 1) return 'ほんのり暖か☀️';
    if (thermal <= 4) return 'けっこう暖か☀️☀️';
    if (thermal <= 7) return 'かなり暑い🔥🔥';
    return '灼熱🔥🔥🔥';
  }

  // 評価テキスト生成
  getEvaluationText(score) {
    if (score >= 8) return '🔥🔥🔥 最高のダジャレ！会場が燃え上がってます！';
    if (score >= 6) return '🔥🔥 素晴らしいダジャレ！観客も大興奮！';
    if (score >= 4) return '🔥 良いダジャレ！温かい拍手が！';
    if (score >= 2) return '☀️ ほんのり温かい。あと一息！';
    if (score >= 0) return '😐 普通のダジャレ。可もなく不可もなく。';
    if (score >= -2) return '🌤️ ちょっと曇り空。もう少し温度を上げて！';
    if (score >= -4) return '❄️ 寒いダジャレ。観客も震えてます。';
    return '🧊 極寒のダジャレ。あずきバーが凍ってます！';
  }

  // 改善提案生成
  generateRecommendations(breakdown) {
    const recommendations = [];
    
    if (breakdown.thermal < 0) {
      recommendations.push('🔥 もっと熱いキーワードを使ってみてください');
    }
    if (breakdown.quality < 3) {
      recommendations.push('✨ もう少し創造性を加えてみてください');
    }
    if (breakdown.creativity < 2) {
      recommendations.push('🚀 もっとオリジナルな表現に挑戦してみてください');
    }
    if (breakdown.sound < 2) {
      recommendations.push('🎵 音の響きやリズムを意識してみましょう');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('😊 なかなか良いですね！');
    }
    
    return recommendations.slice(0, 3);
  }

  // テスト機能
  async runTests() {
    const testCases = [
      { dajare: '暑い夏だけにあつかましい人が多いですね', expected: 'positive' },
      { dajare: '寒い冬だけにさむいダジャレですみません', expected: 'neutral' },
      { dajare: '氷点下の心で冷静にクールダウン', expected: 'negative' },
      { dajare: '燃える情熱でファイヤーな仕事をします', expected: 'positive' }
    ];

    console.log('🧪 OpenAI + あずきバーライフシステム テスト開始');
    
    for (const testCase of testCases) {
      try {
        const result = await this.evaluateDajare(testCase.dajare);
        const lifeChangeText = result.azukiBarLifeChange > 0 
          ? `+${result.azukiBarLifeChange}` 
          : result.azukiBarLifeChange.toString();
        
        console.log(`💬 "${testCase.dajare}"`);
        console.log(`📊 スコア: ${result.score}/10`);
        console.log(`🍡 あずきバーライフ変化: ${lifeChangeText}`);
        console.log(`🌡️ 温度: ${result.thermalLevel}`);
        console.log(`🔥 評価: ${result.evaluation}`);
        console.log('---');
      } catch (error) {
        console.error(`❌ テストエラー: ${error.message}`);
      }
    }
  }

  // 人狼効果適用
  applyWerewolfEffect(score, isWerewolf) {
    if (isWerewolf) {
      return score * 0.8; // 人狼は評価を20%下げる
    }
    return score;
  }
}

module.exports = AdvancedDajareEvaluator;