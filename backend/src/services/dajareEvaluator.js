// ダジャレ評価AI システム

class DajareEvaluator {
  constructor() {
    // 基本的なダジャレパターンや単語のデータベース（簡易版）
    this.hotKeywords = [
      '熱い', '暑い', '燃える', '火', '太陽', '溶ける', '温かい',
      'ホット', 'アツい', '炎', '灼熱', 'ファイヤー'
    ];
    
    this.coldKeywords = [
      '寒い', '冷たい', '氷', '雪', '凍る', '冷える', '霜',
      'アイス', '冷凍', 'フリーズ', '極寒', '氷河'
    ];

    // ダジャレの質を判定するキーワード
    this.goodDajarePatterns = [
      /(.+)だけに(.+)/,  // "○○だけに××"パターン
      /(.+)なんて(.+)/,  // "○○なんて××"パターン
      /(.+)って(.+)/,    // "○○って××"パターン
    ];

    this.commonDajareWords = [
      'ふとん', 'パン', 'アルミ缶', 'みかん', 'パイ', 'ないふ'
    ];
  }

  // メイン評価関数
  async evaluateDajare(dajare, playerEfficiencyModifier = 1.0) {
    try {
      // 複数の評価軸で採点
      const thermalScore = this.evaluateThermalContent(dajare);
      const qualityScore = this.evaluateQuality(dajare);
      const creativityScore = this.evaluateCreativity(dajare);
      
      // 基本スコア計算
      let baseScore = (thermalScore + qualityScore + creativityScore) / 3;
      
      // プレイヤー効率修正を適用
      const finalScore = baseScore * playerEfficiencyModifier;
      
      // -10 to +10 の範囲にクランプ
      const clampedScore = Math.max(-10, Math.min(10, finalScore));
      
      return {
        score: Math.round(clampedScore),
        breakdown: {
          thermal: thermalScore,
          quality: qualityScore,
          creativity: creativityScore,
          base: baseScore,
          final: clampedScore
        },
        evaluation: this.getEvaluationComment(clampedScore)
      };
    } catch (error) {
      console.error('Dajare evaluation error:', error);
      // エラー時は中性値を返す
      return {
        score: 0,
        breakdown: { thermal: 0, quality: 0, creativity: 0 },
        evaluation: 'エラーが発生しました'
      };
    }
  }

  // 温度関連内容の評価 (-5 to +5)
  evaluateThermalContent(dajare) {
    let score = 0;
    
    // 熱いキーワードをチェック
    for (const keyword of this.hotKeywords) {
      if (dajare.includes(keyword)) {
        score += 2;
      }
    }
    
    // 冷たいキーワードをチェック
    for (const keyword of this.coldKeywords) {
      if (dajare.includes(keyword)) {
        score -= 2;
      }
    }
    
    // 季節や温度に関する表現
    if (dajare.includes('夏') || dajare.includes('真夏')) score += 1;
    if (dajare.includes('冬') || dajare.includes('真冬')) score -= 1;
    
    return Math.max(-5, Math.min(5, score));
  }

  // ダジャレの質の評価 (-5 to +5)
  evaluateQuality(dajare) {
    let score = 0;
    
    // 定番すぎるダジャレは減点
    for (const commonWord of this.commonDajareWords) {
      if (dajare.includes(commonWord)) {
        score -= 2;
      }
    }
    
    // 良いダジャレパターンをチェック
    for (const pattern of this.goodDajarePatterns) {
      if (pattern.test(dajare)) {
        score += 3;
        break;
      }
    }
    
    // 文字数による評価（長すぎず短すぎず）
    const length = dajare.length;
    if (length >= 10 && length <= 30) {
      score += 1;
    } else if (length > 50) {
      score -= 1;
    }
    
    // ひらがな・カタカナ・漢字のバランス
    const hiraganaCount = (dajare.match(/[ひ-ゞ]/g) || []).length;
    const katakanaCount = (dajare.match(/[ァ-ヾ]/g) || []).length;
    const kanjiCount = (dajare.match(/[一-龯]/g) || []).length;
    
    if (hiraganaCount > 0 && (katakanaCount > 0 || kanjiCount > 0)) {
      score += 1; // 文字種類のバリエーション
    }
    
    return Math.max(-5, Math.min(5, score));
  }

  // 創造性の評価 (-3 to +3)
  evaluateCreativity(dajare) {
    let score = 0;
    
    // 音の響きや語呂合わせの巧妙さ（簡易判定）
    const vowels = dajare.match(/[あいうえおアイウエオ]/g) || [];
    const consonantPattern = dajare.match(/[かきくけこがぎぐげごさしすせそざじずぜぞたちつてとだぢづでど]/g) || [];
    
    // 母音の繰り返しパターン
    if (vowels.length >= 3) {
      const vowelPattern = vowels.join('');
      if (vowelPattern.includes('ああ') || vowelPattern.includes('いい') || vowelPattern.includes('うう')) {
        score += 1;
      }
    }
    
    // 同音異義語の使用を推測
    if (dajare.includes('だけに') || dajare.includes('って') || dajare.includes('なんて')) {
      score += 1;
    }
    
    // 数字の語呂合わせ
    if (/[0-9０-９]/.test(dajare)) {
      score += 1;
    }
    
    // 既存の有名なダジャレパターンは減点
    const famousPatterns = [
      'パンはパンでも食べられないパン',
      'アルミ缶の上にあるみかん',
      'ふとんが吹っ飛んだ'
    ];
    
    for (const famous of famousPatterns) {
      if (dajare.includes(famous.substring(0, 5))) {
        score -= 2;
        break;
      }
    }
    
    return Math.max(-3, Math.min(3, score));
  }

  // 評価コメントを生成
  getEvaluationComment(score) {
    if (score >= 8) return '🔥 超アツアツ！あずきバーも一瞬で溶けそう！';
    if (score >= 5) return '🌡️ かなり熱い！いいダジャレです！';
    if (score >= 2) return '☀️ ほんのり温かい。もう少し！';
    if (score >= -1) return '😐 普通のダジャレ。可もなく不可もなく。';
    if (score >= -4) return '❄️ ちょっと寒い...あずきバーが固くなりました。';
    if (score >= -7) return '🧊 かなり寒い！このままでは凍ってしまいます！';
    return '⛄ 極寒！あずきバーがカチカチです...';
  }

  // ランダム要素を加えた評価（ゲーム性向上のため）
  addRandomness(baseScore, variance = 1.0) {
    const randomFactor = (Math.random() - 0.5) * 2 * variance; // -variance to +variance
    return baseScore + randomFactor;
  }

  // 人狼の能力による評価変更
  applyWerewolfEffect(score, isWerewolf = false) {
    if (isWerewolf) {
      // 人狼のダジャレは必ず寒くなる（ただし露骨すぎないように）
      return Math.min(score - 2, score * 0.7);
    }
    return score;
  }
}

// OpenAI APIを使用した高度な評価（実装例）
class AdvancedDajareEvaluator extends DajareEvaluator {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
  }

  async evaluateWithAI(dajare) {
    // TODO: 実際のOpenAI API呼び出し
    // 現在はモック実装
    const prompt = `
以下のダジャレの「熱さ」を-10から+10で評価してください。
面白くて温かい印象のダジャレほど高い点数、
つまらなくて寒い印象のダジャレほど低い点数をつけてください。

ダジャレ: "${dajare}"

評価基準:
- 面白さ・創造性
- 音の響きの良さ
- 温度に関連する内容
- オリジナリティ

数値のみで回答してください。
`;

    try {
      // OpenAI API呼び出しのモック
      // 実際の実装では axios などを使ってAPI呼び出し
      const mockScore = Math.floor(Math.random() * 21) - 10;
      return mockScore;
    } catch (error) {
      console.error('AI evaluation failed:', error);
      return super.evaluateDajare(dajare);
    }
  }
}

module.exports = { DajareEvaluator, AdvancedDajareEvaluator };