# あずき氷菓クラッシャー - ゲーム仕様書

## ゲーム概要

### 基本ルール
- **目的**: ダジャレを言ってあずきバーを溶かす（または凍らせる）アイスブレイクゲーム
- **プレイヤー数**: 1人（シングルプレイ）
- **ゲーム時間**: 制限時間あり（仮に5分）
- **あずきバー耐久値**: 100（MAX）

### ゲームモード
- **シングルプレイ**: 一人であずきバーを完全に溶かすことを目指す
- **チャレンジモード**: より短時間での完全溶解を目指す

### 勝利条件
- **勝利**: あずきバーを完全に溶かす（耐久値0）
- **敗北**: 時間切れまでにあずきバーを溶かしきれない
- **パーフェクト**: 残り時間が多い状態で完全溶解

## ゲームフロー

### 1. ゲーム開始

- プレイヤーがゲームを開始
- あずきバーライフ100でスタート
- 制限時間（5分）のカウントダウン開始

### 2. ダジャレ評価システム

- プレイヤーがダジャレを投稿
- OpenAI APIがダジャレの「温度」（temperature）を評価（例: -15〜+60の範囲で返却；内部処理は正規化）
- 評価に基づいてあずきバーの耐久値を変更
  - 熱いダジャレ（+5以上）: 耐久値を10-50減らす（溶かす）🔥
  - 普通のダジャレ（-4〜+4）: 耐久値変化なし😐
  - 寒いダジャレ（-5以下）: 耐久値を10-30増やす（凍らせる）❄️

### 3. ゲーム終了条件

- **完全勝利**: あずきバーを完全に溶かす（耐久値0）
- **時間切れ**: 制限時間内に溶かしきれない
- **スコアシステム**: 残り時間と効率性でスコア算出

## API設計

### エンドポイント一覧

#### ゲーム系

- `POST /api/evaluate-dajare` - ダジャレAI評価
- `POST /api/game/single/start` - シングルプレイ開始
- `GET /api/game/single/:gameId/state` - ゲーム状態取得
- `POST /api/game/single/:gameId/end` - ゲーム終了

#### WebSocket イベント（将来的な拡張用）

- `game_started` - ゲーム開始
- `dajare_evaluated` - ダジャレ評価結果
- `game_state_updated` - ゲーム状態更新
- `game_ended` - ゲーム終了

## データ構造

### SingleGameSession

```javascript
{
  id: string,
  playerId: string,
  playerName: string,
  status: 'playing' | 'finished',
  azukiBarLife: number, // 0-100
  timeRemaining: number,
  score: number,
  dajareHistory: DajareEvaluation[],
  startedAt: timestamp,
  endedAt: timestamp
}
```

### DajareEvaluation（正規化）

```javascript
{
  dajare: string,
  temperature: number, // 寒い<0 / 暑い>0
  funnyScore: number,
  comment: string,
  // 互換フィールド（内部/旧仕様）
  score: number,
  breakdown: { thermal: number, quality: number, creativity: number, sound: number },
  azukiBarLifeChange: number,
  evaluation: string,
  analysis: string,
  recommendations: string[],
  timestamp: timestamp
}
```
