# あずき氷菓クラッシャー - ゲーム仕様書

## ゲーム概要

### 基本ルール
- **目的**: ダジャレを言ってあずきバーを溶かす（または凍らせる）アイスブレイクゲーム
- **プレイヤー数**: 4人（マルチプレイ）
- **ゲーム時間**: 制限時間あり（仮に5分）
- **あずきバー耐久値**: 90（MAX）

### 役職
- **市民**: あずきバーを溶かすことが目的（3人）
- **人狼**: あずきバーを凍らせることが目的（1人）

### 勝利条件
- **市民勝利**: あずきバーを完全に溶かす（耐久値0）OR 人狼を特定して追放
- **人狼勝利**: 時間切れまであずきバーを溶かしきれない

## ゲームフロー

### 1. マッチング
- 4人のプレイヤーがマッチング
- ランダムで1人が人狼に選ばれる
- 各プレイヤーに役職を通知

### 2. ゲーム進行
- プレイヤーがダジャレを投稿
- AIがダジャレの「熱さ」を評価（-10〜+10の数値）
- 評価に基づいてあずきバーの耐久値を変更
  - 熱いダジャレ（+値）: 耐久値を減らす（溶かす）
  - 寒いダジャレ（-値）: 耐久値を増やす（凍らせる）

### 3. 人狼の特殊能力
- 「吹雪の息」: 他プレイヤーの溶解効率を下げる
- 使用間隔: 数十秒ごと
- 効果: AI評価の平均値と分散値を操作

### 4. 市民の対抗手段
- 会議機能で人狼を特定・追放
- ダジャレの効果から人狼を推理

## API設計

### エンドポイント一覧

#### マッチング系
- `POST /api/game/rooms` - ルーム作成
- `POST /api/game/rooms/:roomId/join` - ルーム参加
- `GET /api/game/rooms/:roomId` - ルーム状態取得

#### ゲーム系
- `POST /api/game/:gameId/dajare` - ダジャレ投稿
- `GET /api/game/:gameId/state` - ゲーム状態取得
- `POST /api/game/:gameId/vote` - 投票（人狼追放）
- `POST /api/game/:gameId/ability` - 特殊能力使用

#### WebSocket イベント
- `game_started` - ゲーム開始
- `dajare_evaluated` - ダジャレ評価結果
- `game_state_updated` - ゲーム状態更新
- `game_ended` - ゲーム終了

## データ構造

### Player
```javascript
{
  id: string,
  name: string,
  role: 'citizen' | 'werewolf',
  isAlive: boolean,
  efficiencyModifier: number // 人狼の能力で変化
}
```

### GameRoom
```javascript
{
  id: string,
  players: Player[],
  status: 'waiting' | 'playing' | 'finished',
  azukiBarDurability: number, // 0-90
  timeRemaining: number,
  createdAt: timestamp
}
```

### DajareEvaluation
```javascript
{
  playerId: string,
  dajare: string,
  score: number, // -10 to +10
  timestamp: timestamp
}
```