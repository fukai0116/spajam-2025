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
            content: `あなたは厳しめのダジャレ評価の専門家です。平均的なダジャレには低めの温度を付与し、明確に優れたダジャレのみ高温度を与えてください：

【重要】通常のダジャレは温度5〜20度程度、明確に優れたもののみ30度以上。やや弱い/寒いと感じるものは0〜5度、寒いものはマイナス評価。

【評価基準】（厳しめ設定）
1. 温度レベル (-15〜50点): 
   - 寒い系ダジャレ: -15〜-3点
   - 低調/普通: 10〜20点（控えめ）
   - 明確に面白い: 30〜50点（稀）
2. 面白さ (3〜9点): 平均は5〜6点程度
3. 創造性 (2〜8点)
4. 音韻 (2〜8点)

【温度付けの指針】
- 暑さ系キーワードのみでは30度以上に直結しない。全体の巧妙さを重視。
- 普通のダジャレや繰り返し系 → 10〜20度
- つまらない/弱い → 0〜5度、またはマイナス
- 明らかに寒い/ダジャレに関係のない文/敵対的な言葉 → -5〜-20度

必ず以下のJSON形式で回答してください：
{
  "temperature": 数値(-15〜60),
  "funnyScore": 数値(4〜10),
  "comment": "優しく温かいコメント"
}`,
          },
          {
            role: "user",
            content: `以下のダジャレを優しく評価してください：「${dajare}」`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const response = completion.choices[0].message.content;
      return this.parseOpenAIResponse(response, efficiencyModifier);

    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.fallbackEvaluation(dajare);
    }
  }

  // OpenAIのレスポンスをパース（優しい評価版）
  parseOpenAIResponse(response, efficiencyModifier) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const data = JSON.parse(jsonMatch[0]);
      
      // 新しいAPIレスポンス形式に対応
      const temperature = data.temperature || 0;
      const funnyScore = Math.max(Math.min(data.funnyScore || 5, 9), 3);
      
      // ライフが減りやすい設定（新温度範囲対応）
      let azukiBarLifeChange = 0;
      if (temperature <= -10) {
        azukiBarLifeChange = Math.floor(Math.random() * 15) + 5; // 5-20点（凍る）
      } else if (temperature <= -3) {
        azukiBarLifeChange = Math.floor(Math.random() * 8) + 2; // 2-10点（少し凍る）
      } else if (temperature >= 40) {
        azukiBarLifeChange = -(Math.floor(Math.random() * 20) + 12); // -12〜-32点（大きく溶ける）
      } else if (temperature >= 25) {
        azukiBarLifeChange = -(Math.floor(Math.random() * 14) + 6); // -6〜-20点（溶ける）
      } else if (temperature >= 12) {
        azukiBarLifeChange = -(Math.floor(Math.random() * 9) + 3); // -3〜-12点（少し溶ける）
      } else if (temperature >= 5) {
        azukiBarLifeChange = -(Math.floor(Math.random() * 6) + 2); // -2〜-8点（わずかに溶ける）
      }
      
      // 優しい総合スコア計算
      const totalScore = Math.max(temperature + funnyScore + 5, 8); // 最低8点保証
      const finalScore = totalScore * efficiencyModifier;

      return {
        // 正規化フィールド（クライアント向け）
        temperature: temperature,
        funnyScore: funnyScore,
        comment: data.comment || 'ナイスなダジャレです！',

        // 既存互換フィールド（暫定互換用）
        score: Math.round(finalScore * 10) / 10,
        breakdown: {
          thermal: temperature,
          quality: funnyScore,
          creativity: Math.max(Math.floor(funnyScore * 0.8), 2),
          sound: Math.max(Math.floor(funnyScore * 0.9), 2)
        },
        evaluation: data.comment || 'ナイスなダジャレです！',
        analysis: `温度: ${temperature}度、面白さ: ${funnyScore}点の評価です！`,
        recommendations: temperature < 0 ? 
          ["もう少し暖かいダジャレにチャレンジしてみよう！"] : 
          ["その調子でもっと面白いダジャレを！"],
        azukiBarLifeChange: azukiBarLifeChange,
        thermalLevel: this.getThermalLevelDescription(temperature)
      };

    } catch (error) {
      console.error('Parse error:', error);
      return this.fallbackEvaluation('パース失敗');
    }
  }

  // フォールバック評価（API利用不可時）- 優しい版
  fallbackEvaluation(dajare) {
    const length = dajare.length;
    
    // 優しい簡易評価ロジック
    const thermal = this.analyzeThermalLevel(dajare) - 1.5; // 厳しめバイアス
    const quality = Math.random() * 4 + 5; // 5-9点で優しく
    const creativity = Math.random() * 3 + 4; // 4-7点
    const sound = this.analyzeSoundPattern(dajare);

    const breakdown = { thermal, quality, creativity, sound };
    const score = Math.max((thermal + quality + creativity + sound) / 4, 6); // 最低6点保証

    // 優しいあずきバーライフ変化を計算
    const azukiBarLifeChange = this.calculateAzukiBarLifeChange(thermal);

    return {
      // 正規化フィールド（クライアント向け）
      temperature: thermal,
      funnyScore: Math.round((quality) * 10) / 10,
      comment: this.getEvaluationText(score),

      // 既存互換フィールド（暫定互換用）
      score: Math.round(score * 10) / 10,
      breakdown,
      evaluation: this.getEvaluationText(score),
      analysis: `文字数: ${length}文字, 温度レベル: ${this.getThermalLevelDescription(thermal)} - 頑張ったダジャレです！`,
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

  // あずきバーライフ変化を計算（減りやすい版）
  calculateAzukiBarLifeChange(thermalLevel) {
    if (thermalLevel <= -8) {
      // 極寒ダジャレ：ライフ追加（5-20点）
      return Math.floor(Math.random() * 16) + 5;
    } else if (thermalLevel <= -3) {
      // 寒いダジャレ：ライフ追加（2-10点）
      return Math.floor(Math.random() * 9) + 2;
    } else if (thermalLevel >= 9) {
      // 灼熱ダジャレ：ライフ減少（8-24点）
      return -(Math.floor(Math.random() * 17) + 8);
    } else if (thermalLevel >= 5) {
      // 暑いダジャレ：ライフ減少（4-14点）
      return -(Math.floor(Math.random() * 11) + 4);
    } else if (thermalLevel >= 2) {
      // ほんのり暖かいダジャレ：ライフ減少（2-7点）
      return -(Math.floor(Math.random() * 6) + 2);
    }
    // マイナス温度のダジャレ：変化なし
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

  // 評価テキスト生成（優しい版）
  getEvaluationText(score) {
    if (score >= 8) return '🔥🔥🔥 最高のダジャレ！会場が燃え上がってます！';
    if (score >= 7) return '🔥🔥 素晴らしいダジャレ！観客も大興奮！';
    if (score >= 6) return '🔥 良いダジャレ！温かい拍手が！';
    if (score >= 5) return '👏 なかなかのダジャレ！いい感じです！';
    if (score >= 4) return '😊 頑張ったダジャレ！努力が伝わります！';
    if (score >= 3) return '🙂 チャレンジしたダジャレ！次も期待！';
    return '😌 ファイト！次はもっと良いダジャレを！';
  }

  // 改善提案生成（優しい版）
  generateRecommendations(breakdown) {
    const recommendations = [];
    
    if (breakdown.thermal < -2) {
      recommendations.push('🔥 もう少し暖かいキーワードを使ってみませんか？');
    }
    if (breakdown.quality < 5) {
      recommendations.push('✨ 素敵なアイデアです！もう少し発展させてみましょう');
    }
    if (breakdown.creativity < 4) {
      recommendations.push('🚀 良いチャレンジです！もっとユニークな表現も試してみて');
    }
    if (breakdown.sound < 4) {
      recommendations.push('🎵 音の響きを意識すると更に良くなりそう！');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('😊 とても良いダジャレです！このまま頑張って！');
    }
    
    return recommendations.slice(0, 2); // 最大2つに制限
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

  // 和を乱す人効果適用
  applyWerewolfEffect(score, isWerewolf) {
    if (isWerewolf) {
      return score * 0.8; // 和を乱す人は評価を20%下げる
    }
    return score;
  }
}

module.exports = AdvancedDajareEvaluator;
