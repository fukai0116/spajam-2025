// ダジャレ評価AI システム

class DajareEvaluator {
  constructor() {
    // 温度関連キーワードのデータベース（拡張版）
    this.hotKeywords = [
      // 直接的な熱いキーワード
      '熱い', '暑い', '燃える', '火', '太陽', '溶ける', '温かい', '暖かい',
      'ホット', 'アツい', '炎', '灼熱', 'ファイヤー', '焼ける', '蒸し暑い',
      // 夏関連
      '夏', '真夏', '酷暑', '猛暑', '熱波', '熱帯', 'サマー',
      // 料理・調理関連
      '焼く', '茹でる', '煮る', '炒める', '蒸す', '揚げる', 'レンジ',
      // 体感・感情
      '熱情', '熱血', '沸騰', '興奮', '情熱', 'ハート',
      // オノマトペ
      'アチチ', 'ジリジリ', 'カンカン', 'ムシムシ', 'ホカホカ'
    ];
    
    this.coldKeywords = [
      // 直接的な冷たいキーワード
      '寒い', '冷たい', '氷', '雪', '凍る', '冷える', '霜', '凍える',
      'アイス', '冷凍', 'フリーズ', '極寒', '氷河', '氷点', '冷却',
      // 冬関連
      '冬', '真冬', '厳冬', '極寒', '寒波', '雪国', 'ウィンター',
      // 自然現象
      '雪だるま', 'つらら', '吹雪', '霜柱', '氷山', 'かき氷',
      // 体感・感情
      '冷静', '冷淡', '冷酷', '寒気', 'クール', '無感情',
      // オノマトペ
      'ブルブル', 'ガタガタ', 'ヒヤヒヤ', 'ゾクゾク', 'キンキン'
    ];

    // ダジャレの質を判定するパターン（拡張版）
    this.excellentDajarePatterns = [
      /(.+)だけに(.+)/,  // "○○だけに××"パターン
      /(.+)なんて(.+)/,  // "○○なんて××"パターン  
      /(.+)って(.+)/,    // "○○って××"パターン
      /(.+)だけあって(.+)/, // "○○だけあって××"パターン
      /(.+)ばっかり(.+)/, // "○○ばっかり××"パターン
      /(.+)なら(.+)/,    // "○○なら××"パターン
      /(.+)といえば(.+)/, // "○○といえば××"パターン
    ];

    // 音韻パターンの分析用
    this.soundPatterns = {
      // 濁音・半濁音
      dakuten: /[がぎぐげござじずぜぞだぢづでどばびぶべぼガギグゲゴザジズゼゾダヂヅデドバビブベボ]/g,
      // 促音・長音
      sokuon: /[っッ]/g,
      choon: /[ーぁぃぅぇぉゃゅょァィゥェォャュョ]/g,
      // 撥音
      hatsuon: /[んン]/g
    };

    // 有名なダジャレパターン（減点対象）
    this.commonDajareWords = [
      'ふとん', 'パン', 'アルミ缶', 'みかん', 'パイ', 'ないふ',
      '布団が吹っ飛んだ', 'パンはパンでも', 'アルミ缶の上に',
      '電話に出んわ', 'お風呂でおぼれる', 'カレーは辛え'
    ];

    // 語彙の豊かさチェック用
    this.vocabularyBonus = {
      // 専門用語・カタカナ語
      technical: /[A-Za-z]+|[ァ-ヾ]{4,}/g,
      // 四字熟語・慣用句風
      idiom: /[一-龯]{4,}/g,
      // 数字の語呂合わせ
      numbers: /[0-9０-９]{2,}/g
    };
  }

  // メイン評価関数（AI強化版）
  async evaluateDajare(dajare, playerEfficiencyModifier = 1.0, difficulty = 'normal') {
    try {
      // 前処理：文字列の正規化
      const normalizedDajare = this.normalizeDajare(dajare);
      
      // 複数の評価軸で採点（重み付きスコア）
      const thermalScore = this.evaluateThermalContent(normalizedDajare) * 0.35;
      const qualityScore = this.evaluateQuality(normalizedDajare) * 0.30;
      const creativityScore = this.evaluateCreativity(normalizedDajare) * 0.25;
      const soundScore = this.evaluateSoundPattern(normalizedDajare) * 0.10;
      
      // 基本スコア計算
      let baseScore = thermalScore + qualityScore + creativityScore + soundScore;
      
      // 難易度による調整
      baseScore = this.adjustForDifficulty(baseScore, difficulty);
      
      // ランダム要素（少量）
      baseScore = this.addRandomness(baseScore, 0.5);
      
      // プレイヤー効率修正を適用
      const finalScore = baseScore * playerEfficiencyModifier;
      
      // -10 to +10 の範囲にクランプ
      const clampedScore = Math.max(-10, Math.min(10, finalScore));
      
      // 詳細な分析結果を返す
      return {
        score: Math.round(clampedScore * 10) / 10, // 小数点第1位まで
        breakdown: {
          thermal: Math.round(thermalScore * 10) / 10,
          quality: Math.round(qualityScore * 10) / 10,
          creativity: Math.round(creativityScore * 10) / 10,
          sound: Math.round(soundScore * 10) / 10,
          base: Math.round(baseScore * 10) / 10,
          final: Math.round(clampedScore * 10) / 10
        },
        evaluation: this.getEvaluationComment(clampedScore),
        analysis: this.getDetailedAnalysis(normalizedDajare, clampedScore),
        recommendations: this.getImprovementSuggestions(normalizedDajare, clampedScore)
      };
    } catch (error) {
      console.error('Dajare evaluation error:', error);
      // エラー時は中性値を返す
      return {
        score: 0,
        breakdown: { thermal: 0, quality: 0, creativity: 0, sound: 0 },
        evaluation: 'エラーが発生しました',
        analysis: '分析できませんでした',
        recommendations: []
      };
    }
  }

  // 文字列の正規化
  normalizeDajare(dajare) {
    return dajare
      .replace(/\s+/g, '') // 空白削除
      .replace(/[！!]/g, '') // 感嘆符削除
      .replace(/[？?]/g, '') // 疑問符削除
      .replace(/[。、]/g, '') // 句読点削除
      .toLowerCase(); // 英字小文字化
  }

  // 難易度調整
  adjustForDifficulty(score, difficulty) {
    switch (difficulty) {
      case 'easy':
        return score * 1.2; // 易しい評価
      case 'hard':
        return score * 0.8; // 厳しい評価
      case 'expert':
        return score * 0.6; // 超厳しい評価
      default:
        return score;
    }
  }

  // 音韻パターンの評価（新規追加）
  evaluateSoundPattern(dajare) {
    let score = 0;
    
    // 韻を踏んでいるかチェック
    score += this.checkRhyme(dajare);
    
    // 頭韻・脚韻のチェック
    score += this.checkAlliteration(dajare);
    
    // 音の響きの良さ
    score += this.checkSoundFlow(dajare);
    
    // 語呂合わせの巧妙さ
    score += this.checkWordPlay(dajare);
    
    return Math.max(-3, Math.min(3, score));
  }

  // 韻を踏んでいるかチェック
  checkRhyme(dajare) {
    let score = 0;
    
    // 文字単位での韻（例：「かき」と「なき」）
    const chars = Array.from(dajare);
    const patterns = new Map();
    
    // 2文字パターンをチェック
    for (let i = 0; i < chars.length - 1; i++) {
      const pattern = chars[i] + chars[i + 1];
      if (patterns.has(pattern)) {
        score += 0.5; // 同じパターンが見つかったら加点
      } else {
        patterns.set(pattern, i);
      }
    }
    
    // 音の類似性チェック（ひらがな・カタカナ）
    const hiragana = dajare.match(/[ひ-ゞ]/g) || [];
    const katakana = dajare.match(/[ァ-ヾ]/g) || [];
    
    if (hiragana.length > 0 && katakana.length > 0) {
      // ひらがなとカタカナの混用は良いリズムを生む
      score += 0.5;
    }
    
    return score;
  }

  // 頭韻・脚韻のチェック
  checkAlliteration(dajare) {
    let score = 0;
    
    // 単語の境界を推定（簡易版）
    const words = dajare.split(/[、。\s]/);
    
    if (words.length >= 2) {
      // 頭韻（単語の最初の音が同じ）
      const firstChars = words.map(w => w.charAt(0)).filter(c => c);
      const uniqueFirstChars = new Set(firstChars);
      if (firstChars.length > uniqueFirstChars.size) {
        score += 1;
      }
      
      // 脚韻（単語の最後の音が同じ）
      const lastChars = words.map(w => w.charAt(w.length - 1)).filter(c => c);
      const uniqueLastChars = new Set(lastChars);
      if (lastChars.length > uniqueLastChars.size) {
        score += 1;
      }
    }
    
    return score;
  }

  // 音の響きの良さ
  checkSoundFlow(dajare) {
    let score = 0;
    
    // 濁音・半濁音のバランス
    const dakutenCount = (dajare.match(this.soundPatterns.dakuten) || []).length;
    const totalLength = dajare.length;
    
    if (totalLength > 0) {
      const dakutenRatio = dakutenCount / totalLength;
      // 適度な濁音は迫力を生む
      if (dakutenRatio >= 0.1 && dakutenRatio <= 0.3) {
        score += 0.5;
      }
    }
    
    // 促音・長音の効果的な使用
    const sokuonCount = (dajare.match(this.soundPatterns.sokuon) || []).length;
    const choonCount = (dajare.match(this.soundPatterns.choon) || []).length;
    
    if (sokuonCount > 0) score += 0.3; // 促音はリズムを生む
    if (choonCount > 0) score += 0.2; // 長音は印象的
    
    return score;
  }

  // 語呂合わせの巧妙さ
  checkWordPlay(dajare) {
    let score = 0;
    
    // 同音異義語の使用を推測
    const homophonePatterns = [
      /かみ/, // 紙・髪・神
      /はし/, // 橋・箸・端
      /きかい/, // 機械・機会・奇怪
      /こうこう/, // 高校・航行・孝行
    ];
    
    for (const pattern of homophonePatterns) {
      if (pattern.test(dajare)) {
        score += 0.5;
      }
    }
    
    // 数字の語呂合わせ
    if (this.vocabularyBonus.numbers.test(dajare)) {
      score += 0.5;
    }
    
    return score;
  }
  // 温度関連内容の評価 (-7 to +7) 強化版
  evaluateThermalContent(dajare) {
    let score = 0;
    let hotMatches = 0;
    let coldMatches = 0;
    
    // 熱いキーワードをチェック（重み付き）
    for (const keyword of this.hotKeywords) {
      if (dajare.includes(keyword)) {
        // キーワードの長さと頻度で重み付け
        const weight = keyword.length >= 3 ? 1.5 : 1.0;
        const frequency = (dajare.match(new RegExp(keyword, 'g')) || []).length;
        score += weight * frequency;
        hotMatches += frequency;
      }
    }
    
    // 冷たいキーワードをチェック（重み付き）
    for (const keyword of this.coldKeywords) {
      if (dajare.includes(keyword)) {
        const weight = keyword.length >= 3 ? 1.5 : 1.0;
        const frequency = (dajare.match(new RegExp(keyword, 'g')) || []).length;
        score -= weight * frequency;
        coldMatches += frequency;
      }
    }
    
    // 温度関連の表現をさらに詳細にチェック
    const additionalThermalPatterns = {
      hot: [
        /あつ[いく]/, /ねつ/, /もえ/, /やけ/, /むしむし/, /じりじり/,
        /あちち/, /ほかほか/, /ぽかぽか/, /すてぃーむ/, /はあと/
      ],
      cold: [
        /さむ[いく]/, /つめ/, /こお/, /ひえ/, /しも/, /ゆき/,
        /ぶるぶる/, /がたがた/, /ひやひや/, /ぞくぞく/, /きんきん/
      ]
    };
    
    // 正規表現パターンでチェック
    for (const pattern of additionalThermalPatterns.hot) {
      if (pattern.test(dajare)) {
        score += 1;
        hotMatches++;
      }
    }
    
    for (const pattern of additionalThermalPatterns.cold) {
      if (pattern.test(dajare)) {
        score -= 1;
        coldMatches++;
      }
    }
    
    // 対比効果（熱いと冷たいが両方含まれている場合）
    if (hotMatches > 0 && coldMatches > 0) {
      score += 0.5; // 対比は面白い効果を生む
    }
    
    // 季節感の追加
    const seasonBonus = this.evaluateSeasonalContent(dajare);
    score += seasonBonus;
    
    return Math.max(-7, Math.min(7, score));
  }

  // 季節感の評価
  evaluateSeasonalContent(dajare) {
    let score = 0;
    
    const seasonalWords = {
      summer: ['夏', '真夏', '酷暑', '猛暑', '海', 'プール', '花火', 'かき氷', '夏祭り'],
      winter: ['冬', '真冬', '雪', '氷', 'スキー', 'こたつ', 'イルミネーション', '年末'],
      spring: ['春', '桜', '花見', '新緑', '暖かい'],
      autumn: ['秋', '紅葉', '涼しい', '月見']
    };
    
    let summerCount = 0, winterCount = 0;
    
    for (const word of seasonalWords.summer) {
      if (dajare.includes(word)) {
        score += 0.5;
        summerCount++;
      }
    }
    
    for (const word of seasonalWords.winter) {
      if (dajare.includes(word)) {
        score -= 0.5;
        winterCount++;
      }
    }
    
    // 中途半端な季節は少し加点
    for (const word of seasonalWords.spring) {
      if (dajare.includes(word)) score += 0.2;
    }
    for (const word of seasonalWords.autumn) {
      if (dajare.includes(word)) score += 0.2;
    }
    
    return score;
  }

  // ダジャレの質の評価 (-6 to +6) 強化版
  evaluateQuality(dajare) {
    let score = 0;
    
    // 定番すぎるダジャレは減点（厳格化）
    for (const commonPattern of this.commonDajareWords) {
      if (dajare.includes(commonPattern)) {
        score -= 3; // より厳しく減点
      }
    }
    
    // 優秀なダジャレパターンをチェック
    let patternBonus = 0;
    for (const pattern of this.excellentDajarePatterns) {
      if (pattern.test(dajare)) {
        patternBonus += 2;
      }
    }
    score += Math.min(patternBonus, 4); // 最大4点まで
    
    // 文字数による評価（より細かく）
    const length = dajare.length;
    if (length >= 8 && length <= 25) {
      score += 1.5; // 適切な長さ
    } else if (length >= 26 && length <= 40) {
      score += 0.5; // やや長いが許容範囲
    } else if (length > 50) {
      score -= 2; // 長すぎる
    } else if (length < 5) {
      score -= 1; // 短すぎる
    }
    
    // 文字種類のバランス（詳細分析）
    const analysis = this.analyzeCharacterTypes(dajare);
    score += this.evaluateCharacterBalance(analysis);
    
    // 語彙の豊かさ
    score += this.evaluateVocabularyRichness(dajare);
    
    // 構文の複雑さ
    score += this.evaluateSyntaxComplexity(dajare);
    
    return Math.max(-6, Math.min(6, score));
  }

  // 文字種類の分析
  analyzeCharacterTypes(dajare) {
    return {
      hiragana: (dajare.match(/[ひ-ゞ]/g) || []).length,
      katakana: (dajare.match(/[ァ-ヾ]/g) || []).length,
      kanji: (dajare.match(/[一-龯]/g) || []).length,
      numbers: (dajare.match(/[0-9０-９]/g) || []).length,
      alphabet: (dajare.match(/[A-Za-z]/g) || []).length,
      punctuation: (dajare.match(/[！？。、]/g) || []).length,
      total: dajare.length
    };
  }

  // 文字バランスの評価
  evaluateCharacterBalance(analysis) {
    let score = 0;
    
    if (analysis.total === 0) return 0;
    
    const ratios = {
      hiragana: analysis.hiragana / analysis.total,
      katakana: analysis.katakana / analysis.total,
      kanji: analysis.kanji / analysis.total
    };
    
    // ひらがな中心（読みやすさ）
    if (ratios.hiragana >= 0.4 && ratios.hiragana <= 0.8) {
      score += 0.5;
    }
    
    // カタカナの効果的使用
    if (ratios.katakana >= 0.1 && ratios.katakana <= 0.4) {
      score += 0.5;
    }
    
    // 漢字の適度な使用
    if (ratios.kanji >= 0.1 && ratios.kanji <= 0.3) {
      score += 0.5;
    }
    
    // 多様性ボーナス
    const usedTypes = [
      ratios.hiragana > 0,
      ratios.katakana > 0,
      ratios.kanji > 0,
      analysis.numbers > 0,
      analysis.alphabet > 0
    ].filter(Boolean).length;
    
    if (usedTypes >= 3) {
      score += 0.5; // 文字種類の多様性
    }
    
    return score;
  }

  // 語彙の豊かさ評価
  evaluateVocabularyRichness(dajare) {
    let score = 0;
    
    // 専門用語・カタカナ語の使用
    const technicalMatches = dajare.match(this.vocabularyBonus.technical) || [];
    score += Math.min(technicalMatches.length * 0.3, 1.0);
    
    // 四字熟語・慣用句風の表現
    const idiomMatches = dajare.match(this.vocabularyBonus.idiom) || [];
    score += Math.min(idiomMatches.length * 0.4, 1.2);
    
    // 数字の語呂合わせ
    const numberMatches = dajare.match(this.vocabularyBonus.numbers) || [];
    score += Math.min(numberMatches.length * 0.5, 1.0);
    
    // 稀な単語の使用（長いカタカナ語など）
    const rareWords = dajare.match(/[ァ-ヾ]{5,}/g) || [];
    score += Math.min(rareWords.length * 0.4, 0.8);
    
    return score;
  }

  // 構文の複雑さ評価
  evaluateSyntaxComplexity(dajare) {
    let score = 0;
    
    // 助詞の適切な使用
    const particles = ['は', 'が', 'を', 'に', 'で', 'と', 'の', 'から', 'まで'];
    let particleCount = 0;
    for (const particle of particles) {
      if (dajare.includes(particle)) {
        particleCount++;
      }
    }
    
    if (particleCount >= 2 && particleCount <= 4) {
      score += 0.5; // 適度な文法構造
    }
    
    // 修辞技法の使用
    if (dajare.includes('まるで') || dajare.includes('あたかも')) {
      score += 0.3; // 比喩
    }
    
    if (dajare.includes('とても') || dajare.includes('めちゃくちゃ')) {
      score += 0.2; // 強調
    }
    
    // 疑問文・感嘆文
    if (dajare.includes('？') || dajare.includes('?')) {
      score += 0.2;
    }
    if (dajare.includes('！') || dajare.includes('!')) {
      score += 0.1;
    }
    
    return score;
  }

  // 創造性の評価 (-4 to +4) 強化版
  evaluateCreativity(dajare) {
    let score = 0;
    
    // オリジナリティチェック（既存の有名なダジャレパターンは大幅減点）
    const famousPatterns = [
      '布団が吹っ飛んだ', 'パンはパンでも食べられないパン', 'アルミ缶の上にあるみかん',
      '電話に出んわ', 'お風呂でおぼれる', 'カレーは辛え', 'パイを投げるのはないパイ',
      '寒いから暖房を入れさむ', 'このラーメンは拉麺'
    ];
    
    for (const famous of famousPatterns) {
      if (dajare.includes(famous.substring(0, Math.min(6, famous.length)))) {
        score -= 3; // 有名なパターンは大幅減点
        break;
      }
    }
    
    // 独創的な表現の検出
    score += this.detectUniqueExpressions(dajare);
    
    // 意外性の評価
    score += this.evaluateSurprise(dajare);
    
    // 文化的参照の巧妙さ
    score += this.evaluateCulturalReferences(dajare);
    
    // 言葉遊びの技術的レベル
    score += this.evaluateWordPlayTechnique(dajare);
    
    return Math.max(-4, Math.min(4, score));
  }

  // 独創的な表現の検出
  detectUniqueExpressions(dajare) {
    let score = 0;
    
    // 造語の検出（カタカナ語の新しい組み合わせ）
    const katakanaWords = dajare.match(/[ァ-ヾ]{3,}/g) || [];
    for (const word of katakanaWords) {
      if (word.length >= 5) {
        score += 0.3; // 長いカタカナ語は独創的可能性
      }
    }
    
    // 複合語の創造
    const compounds = dajare.match(/[一-龯]{4,}/g) || [];
    for (const compound of compounds) {
      if (compound.length >= 6) {
        score += 0.4; // 長い複合語
      }
    }
    
    // 擬音語・擬態語の使用
    const onomatopoeia = ['ドキドキ', 'ワクワク', 'キラキラ', 'プルプル', 'ふわふわ'];
    for (const ono of onomatopoeia) {
      if (dajare.includes(ono)) {
        score += 0.2;
      }
    }
    
    return Math.min(score, 1.5);
  }

  // 意外性の評価
  evaluateSurprise(dajare) {
    let score = 0;
    
    // 異分野の組み合わせ
    const categories = {
      technology: ['コンピュータ', 'スマホ', 'AI', 'ロボット', 'デジタル'],
      food: ['ラーメン', 'すし', 'カレー', 'パン', 'ケーキ'],
      nature: ['山', '海', '森', '川', '花'],
      sports: ['サッカー', '野球', 'テニス', 'ゴルフ', 'バスケ']
    };
    
    let foundCategories = 0;
    for (const [category, words] of Object.entries(categories)) {
      for (const word of words) {
        if (dajare.includes(word)) {
          foundCategories++;
          break;
        }
      }
    }
    
    if (foundCategories >= 2) {
      score += 0.8; // 異分野の組み合わせは意外性がある
    }
    
    // 時代の組み合わせ（古典と現代など）
    const classical = ['侍', '姫', '殿', '城', '刀'];
    const modern = ['スマホ', 'ネット', 'ゲーム', 'アプリ'];
    
    let hasClassical = classical.some(word => dajare.includes(word));
    let hasModern = modern.some(word => dajare.includes(word));
    
    if (hasClassical && hasModern) {
      score += 0.6; // 時代ミックス
    }
    
    return score;
  }

  // 文化的参照の評価
  evaluateCulturalReferences(dajare) {
    let score = 0;
    
    // 有名人・キャラクター
    const celebrities = ['ドラえもん', 'ピカチュウ', 'アンパンマン'];
    for (const celeb of celebrities) {
      if (dajare.includes(celeb)) {
        score += 0.3;
      }
    }
    
    // 地名の使用
    const places = ['東京', '大阪', '京都', '沖縄', 'アメリカ', 'フランス'];
    for (const place of places) {
      if (dajare.includes(place)) {
        score += 0.2;
      }
    }
    
    // ことわざ・慣用句のパロディ
    const proverbs = ['猿も木から', '鬼に金棒', '花より団子'];
    for (const proverb of proverbs) {
      if (dajare.includes(proverb.substring(0, 3))) {
        score += 0.5;
      }
    }
    
    return Math.min(score, 1.0);
  }

  // 言葉遊びの技術レベル
  evaluateWordPlayTechnique(dajare) {
    let score = 0;
    
    // 回文（前から読んでも後ろから読んでも同じ）
    const reversed = Array.from(dajare).reverse().join('');
    if (dajare === reversed && dajare.length >= 3) {
      score += 1.5; // 回文は高技術
    }
    
    // アナグラム（文字の並び替え）の可能性
    const words = dajare.split(/\s+/);
    if (words.length >= 2) {
      for (let i = 0; i < words.length - 1; i++) {
        for (let j = i + 1; j < words.length; j++) {
          if (this.isAnagram(words[i], words[j])) {
            score += 0.8;
          }
        }
      }
    }
    
    // 複数の修辞技法の組み合わせ
    let rhetoricCount = 0;
    if (dajare.includes('まるで')) rhetoricCount++; // 直喩
    if (/(.+)のような(.+)/.test(dajare)) rhetoricCount++; // 比喩
    if (/(.+)は(.+)だ/.test(dajare)) rhetoricCount++; // 断定法
    
    if (rhetoricCount >= 2) {
      score += 0.5;
    }
    
    return score;
  }

  // アナグラム判定
  isAnagram(word1, word2) {
    if (word1.length !== word2.length) return false;
    const sorted1 = Array.from(word1).sort().join('');
    const sorted2 = Array.from(word2).sort().join('');
    return sorted1 === sorted2;
  }

  // 詳細分析の生成
  getDetailedAnalysis(dajare, score) {
    const analysis = this.analyzeCharacterTypes(dajare);
    const length = dajare.length;
    
    let analysisText = `📊 ダジャレ分析レポート\n`;
    analysisText += `文字数: ${length}文字 `;
    
    if (length >= 8 && length <= 25) {
      analysisText += `(適切) `;
    } else if (length > 25) {
      analysisText += `(やや長い) `;
    } else {
      analysisText += `(やや短い) `;
    }
    
    analysisText += `\n文字構成: `;
    if (analysis.hiragana > 0) analysisText += `ひらがな${analysis.hiragana} `;
    if (analysis.katakana > 0) analysisText += `カタカナ${analysis.katakana} `;
    if (analysis.kanji > 0) analysisText += `漢字${analysis.kanji} `;
    if (analysis.numbers > 0) analysisText += `数字${analysis.numbers} `;
    if (analysis.alphabet > 0) analysisText += `英字${analysis.alphabet} `;
    
    // 温度判定
    let thermalType = "中性";
    if (score > 3) thermalType = "アツアツ🔥";
    else if (score > 0) thermalType = "ほんのり暖か☀️";
    else if (score < -3) thermalType = "極寒🧊";
    else if (score < 0) thermalType = "ちょっと寒い❄️";
    
    analysisText += `\n温度レベル: ${thermalType}`;
    
    return analysisText;
  }

  // 改善提案の生成
  getImprovementSuggestions(dajare, score) {
    const suggestions = [];
    
    if (score < -5) {
      suggestions.push("🔥 熱い単語を追加してみましょう（例：燃える、熱血、太陽など）");
      suggestions.push("💡 「だけに」「なんて」などの決まり文句を使ってみてください");
    }
    
    if (score < 0) {
      suggestions.push("✨ もう少し創造性を加えてみてください");
      suggestions.push("🎵 音の響きやリズムを意識してみましょう");
    }
    
    const length = dajare.length;
    if (length < 8) {
      suggestions.push("📝 もう少し長くして詳しく表現してみてください");
    } else if (length > 40) {
      suggestions.push("✂️ 少し短くして、要点を絞ってみてください");
    }
    
    // 文字種類のバランス
    const analysis = this.analyzeCharacterTypes(dajare);
    const katakanaRatio = analysis.katakana / analysis.total;
    const kanjiRatio = analysis.kanji / analysis.total;
    
    if (katakanaRatio < 0.1 && analysis.total > 10) {
      suggestions.push("🌈 カタカナ語を使って表現力を豊かにしてみてください");
    }
    
    if (kanjiRatio > 0.5) {
      suggestions.push("� ひらがなを多めにして読みやすくしてみてください");
    }
    
    // 定番パターンのチェック
    for (const common of this.commonDajareWords) {
      if (dajare.includes(common)) {
        suggestions.push("🚀 もっとオリジナルな表現に挑戦してみてください");
        break;
      }
    }
    
    if (suggestions.length === 0) {
      if (score >= 7) {
        suggestions.push("🏆 完璧です！このクオリティを保ちましょう！");
      } else if (score >= 4) {
        suggestions.push("👍 とても良いダジャレです！");
      } else if (score >= 0) {
        suggestions.push("😊 なかなか良いですね！");
      }
    }
    
    return suggestions;
  }

  // 評価コメントを生成（強化版）
  getEvaluationComment(score) {
    if (score >= 8) return '🔥 超絶アツアツ！あずきバーが瞬間蒸発レベル！';
    if (score >= 6) return '🌋 溶岩級の熱さ！素晴らしいダジャレです！';
    if (score >= 4) return '🌡️ かなり熱い！いいダジャレですね！';
    if (score >= 2) return '☀️ ほんのり温かい。あと一息！';
    if (score >= 0) return '😐 普通のダジャレ。可もなく不可もなく。';
    if (score >= -2) return '🌤️ ちょっと曇り空。もう少し温度を上げて！';
    if (score >= -4) return '❄️ ちょっと寒い...あずきバーが固くなってきました。';
    if (score >= -6) return '🧊 かなり寒い！このままでは凍ってしまいます！';
    if (score >= -8) return '⛄ 極寒地帯！あずきバーがカチカチです...';
    return '🗻 南極レベル！あずきバーが粉々に砕けそう...';
  }

  // AI判定システムのテスト機能
  async testEvaluationSystem() {
    const testCases = [
      { dajare: "暑い日だけにあつかましいですね", expected: "positive" },
      { dajare: "アイスが売れる季節だけにナイスですね", expected: "neutral" },
      { dajare: "寒いから暖房を入れさむ", expected: "negative" },
      { dajare: "燃える情熱で今日もファイヤーな一日", expected: "positive" },
      { dajare: "氷点下の心で冷静にクールダウン", expected: "negative" },
      { dajare: "ふとんが吹っ飛んだ", expected: "negative" }, // 定番すぎる
      { dajare: "プログラマーだけにバグを直すのはデバッグ", expected: "positive" },
    ];

    console.log("🧪 AI判定システムテスト開始");
    
    for (const testCase of testCases) {
      const result = await this.evaluateDajare(testCase.dajare);
      const actualCategory = result.score > 2 ? "positive" : 
                           result.score < -2 ? "negative" : "neutral";
      
      const success = actualCategory === testCase.expected;
      console.log(`${success ? '✅' : '❌'} "${testCase.dajare}"`);
      console.log(`   期待: ${testCase.expected}, 実際: ${actualCategory} (${result.score})`);
      console.log(`   評価: ${result.evaluation}`);
      console.log('');
    }
    
    console.log("🏁 テスト完了");
  }

  // パフォーマンス測定
  async measurePerformance(dajare, iterations = 100) {
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      await this.evaluateDajare(dajare);
    }
    
    const endTime = Date.now();
    const avgTime = (endTime - startTime) / iterations;
    
    console.log(`⏱️ パフォーマンス測定結果:`);
    console.log(`   総実行時間: ${endTime - startTime}ms`);
    console.log(`   平均実行時間: ${avgTime.toFixed(2)}ms`);
    console.log(`   実行回数: ${iterations}回`);
    
    return avgTime;
  }

  // ランダム要素を加えた評価（ゲーム性向上のため）
  addRandomness(baseScore, variance = 1.0) {
    const randomFactor = (Math.random() - 0.5) * 2 * variance; // -variance to +variance
    return baseScore + randomFactor;
  }

  // 和を乱す人の能力による評価変更
  applyWerewolfEffect(score, isWerewolf = false) {
    if (isWerewolf) {
      // 和を乱す人のダジャレは必ず寒くなる（ただし露骨すぎないように）
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