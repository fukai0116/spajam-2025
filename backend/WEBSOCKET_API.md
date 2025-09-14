# WebSocket API ドキュメント

## 概要
「最強あずき氷菓クラッシャー」のリアルタイム通信用WebSocket APIドキュメントです。

## 接続

### エンドポイント
- **開発環境**: `ws://localhost:3000/socket.io`
- **本番環境**: `wss://your-app.herokuapp.com/socket.io`

### 接続例（JavaScript）
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket'],
  autoConnect: true
});
```

## イベント一覧

### 📤 クライアント → サーバー (送信)

#### 1. `player_join` - プレイヤー参加
```javascript
socket.emit('player_join', {
  playerId: 'player123',
  playerName: 'たろう'
});
```

#### 2. `auto_match` - オートマッチング
```javascript
socket.emit('auto_match', {
  playerId: 'player123',
  playerName: 'たろう'
});
```

#### 3. `create_room` - ルーム作成
```javascript
socket.emit('create_room', {
  playerId: 'player123',
  playerName: 'たろう'
});
```

#### 4. `join_room` - ルーム参加
```javascript
socket.emit('join_room', {
  roomId: 'room123',
  playerId: 'player123',
  playerName: 'たろう'
});
```

#### 5. `submit_dajare` - ダジャレ投稿
```javascript
socket.emit('submit_dajare', {
  playerId: 'player123',
  dajare: 'アイスクリームは愛すクリーム'
});
```

#### 6. `vote` - 投票
```javascript
socket.emit('vote', {
  playerId: 'player123',
  targetId: 'player456'
});
```

#### 7. `use_werewolf_ability` - 人狼の特殊能力使用
```javascript
socket.emit('use_werewolf_ability', {
  playerId: 'player123'
});
```

#### 8. `start_voting` - 投票フェーズ開始
```javascript
socket.emit('start_voting', {
  playerId: 'player123'
});
```

### 📥 サーバー → クライアント (受信)

#### 1. `join_success` - 参加成功
```javascript
socket.on('join_success', (data) => {
  // data: { playerId, playerName, socketId }
});
```

#### 2. `room_created` - ルーム作成成功
```javascript
socket.on('room_created', (data) => {
  // data: { room, player }
});
```

#### 3. `room_updated` - ルーム状態更新
```javascript
socket.on('room_updated', (data) => {
  // data: { room, message }
});
```

#### 4. `role_assigned` - 役職割り当て
```javascript
socket.on('role_assigned', (data) => {
  // data: { role: 'civilian' | 'werewolf', isWerewolf: boolean }
});
```

#### 5. `game_started` - ゲーム開始
```javascript
socket.on('game_started', (data) => {
  // data: { gameState }
});
```

#### 6. `dajare_evaluated` - ダジャレ評価結果
```javascript
socket.on('dajare_evaluated', (data) => {
  // data: { dajareEntry, playerState }
});
```

#### 7. `vote_updated` - 投票状況更新
```javascript
socket.on('vote_updated', (data) => {
  // data: { gameState }
});
```

#### 8. `werewolf_ability_used` - 人狼能力使用
```javascript
socket.on('werewolf_ability_used', (data) => {
  // data: { message, gameState }
});
```

#### 9. `voting_started` - 投票フェーズ開始
```javascript
socket.on('voting_started', (data) => {
  // data: { message, gameState }
});
```

#### 10. `game_ended` - ゲーム終了
```javascript
socket.on('game_ended', (data) => {
  // data: { gameState, endReason }
});
```

#### 11. `player_left` - プレイヤー退出
```javascript
socket.on('player_left', (data) => {
  // data: { playerId, room, message }
});
```

#### 12. `error` - エラー
```javascript
socket.on('error', (data) => {
  // data: { message }
});
```

## データ構造

### GameState
```javascript
{
  id: 'room123',
  status: 'waiting' | 'playing' | 'finished',
  players: [
    {
      id: 'player123',
      name: 'たろう',
      role: 'civilian' | 'werewolf',
      isAlive: true,
      efficiency: 100,
      canVote: true,
      hasUsedAbility: false
    }
  ],
  azukiBarDurability: 100,
  timeRemaining: 300, // 秒
  currentTurn: 1,
  maxTurns: 10,
  votingPhase: false,
  endReason: null,
  dajareHistory: [
    {
      playerId: 'player123',
      dajare: 'アイスクリームは愛すクリーム',
      score: 85,
      timestamp: '2025-01-XX...'
    }
  ]
}
```

### DajareResult
```javascript
{
  playerId: 'player123',
  dajare: 'アイスクリームは愛すクリーム',
  score: 85,
  aiComment: 'とても面白いダジャレです！',
  damage: 15,
  timestamp: '2025-01-XX...'
}
```

### Room（クライアント用）
```javascript
{
  id: 'room123',
  status: 'waiting' | 'playing' | 'finished',
  players: [
    {
      id: 'player123',
      name: 'たろう',
      isAlive: true
      // 役職は隠される
    }
  ],
  playerCount: 4,
  maxPlayers: 6,
  azukiBarDurability: 100,
  timeRemaining: 300
}
```

## ゲームフロー例

### 1. 接続・参加
```javascript
// 接続
const socket = io('http://localhost:3000');

// プレイヤー参加
socket.emit('player_join', {
  playerId: 'player123',
  playerName: 'たろう'
});

// 参加成功を受信
socket.on('join_success', (data) => {
  console.log('参加成功:', data);
});
```

### 2. ゲーム参加
```javascript
// オートマッチング
socket.emit('auto_match', {
  playerId: 'player123',
  playerName: 'たろう'
});

// ルーム状態更新を受信
socket.on('room_updated', (data) => {
  console.log('ルーム更新:', data.room);
});

// ゲーム開始を受信
socket.on('game_started', (data) => {
  console.log('ゲーム開始:', data.gameState);
});

// 役職割り当てを受信
socket.on('role_assigned', (data) => {
  console.log('役職:', data.role);
});
```

### 3. ダジャレ投稿・評価
```javascript
// ダジャレ投稿
socket.emit('submit_dajare', {
  playerId: 'player123',
  dajare: 'アイスクリームは愛すクリーム'
});

// 評価結果を受信（投稿者向け）
socket.on('dajare_evaluated', (data) => {
  console.log('ダジャレ評価:', data.dajareEntry);
});

// ルーム全体の状態更新（全員向け）
socket.on('game_updated', (data) => {
  console.log('ゲーム状態:', data.gameState);
  if (data.lastDajare) {
    console.log('直近の投稿:', data.lastDajare);
  }
});
```

### 4. 投票フェーズ
```javascript
// 投票フェーズ開始を受信
socket.on('voting_started', (data) => {
  console.log('投票開始:', data.message);
});

// 投票
socket.emit('vote', {
  playerId: 'player123',
  targetId: 'player456'
});

// 投票結果を受信
socket.on('vote_updated', (data) => {
  console.log('投票結果:', data.gameState);
});
```

### 5. ゲーム終了
```javascript
// ゲーム終了を受信
socket.on('game_ended', (data) => {
  console.log('ゲーム終了:', data.endReason);
  console.log('最終状態:', data.gameState);
});
```

## エラーハンドリング

```javascript
// エラーを受信
socket.on('error', (data) => {
  console.error('エラー:', data.message);
});

// 接続エラー
socket.on('connect_error', (error) => {
  console.error('接続エラー:', error);
});

// 切断
socket.on('disconnect', (reason) => {
  console.log('切断:', reason);
});
```

## 注意事項

1. **プレイヤーID**: 各プレイヤーは一意のIDを持つ必要があります
2. **役職情報**: セキュリティのため、他プレイヤーの役職は隠されます
3. **タイムアウト**: ゲームには制限時間があります
4. **切断処理**: プレイヤーが切断した場合、自動的にルームから退出されます
5. **エラーハンドリング**: 全てのイベントでエラーハンドリングを実装してください

## Flutter実装例

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class GameWebSocket {
  late IO.Socket socket;
  
  void connect() {
    socket = IO.io('http://localhost:3000', <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });
    
    socket.connect();
    
    // イベントリスナー設定
    socket.on('connect', (_) => print('Connected'));
    socket.on('room_updated', (data) => _onRoomUpdated(data));
    socket.on('game_started', (data) => _onGameStarted(data));
    socket.on('dajare_evaluated', (data) => _onDajareEvaluated(data));
    socket.on('error', (data) => _onError(data));
  }
  
  void joinGame(String playerId, String playerName) {
    socket.emit('auto_match', {
      'playerId': playerId,
      'playerName': playerName,
    });
  }
  
  void submitDajare(String playerId, String dajare) {
    socket.emit('submit_dajare', {
      'playerId': playerId,
      'dajare': dajare,
    });
  }
  
  void _onRoomUpdated(dynamic data) {
    // ルーム状態更新処理
  }
  
  void _onGameStarted(dynamic data) {
    // ゲーム開始処理
  }
  
  void _onDajareEvaluated(dynamic data) {
    // ダジャレ評価結果処理
  }
  
  void _onError(dynamic data) {
    // エラー処理
  }
  
  void disconnect() {
    socket.disconnect();
  }
}
```
