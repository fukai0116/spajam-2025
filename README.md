# 最強あずき氷菓クラッシャー（SPAJAM 2025）

Flutter + Node.js/Socket.IO で実装したオンライン対応アイスブレイクゲームです。ダジャレを投稿するとAIが温度（temperature）と面白さを評価し、あずきバーのライフが「溶ける/凍る」で変化します。シングル・マルチ両対応。

## 構成
- フロントエンド: Flutter（Web/モバイル）
  - ルーティング: `go_router`
  - リアルタイム: `socket_io_client`
  - 動画再生: `video_player`（mp4）
- バックエンド: Node.js + Express 5 + Socket.IO
  - AI評価: OpenAI API（キー未設定時はフォールバック評価）

## 起動（ローカル）
1) バックエンド
```
cd backend
npm install
npm run dev
```
2) フロントエンド（例: Web）
```
flutter pub get
flutter run -d chrome
```

接続先URLは `lib/config/app_config.dart` を参照してください。

## REST API（シングル）
- POST `/api/game/single/start` → ゲーム開始（req: playerId, playerName）
- POST `/api/game/single/dajare` → ダジャレ評価（req: playerId, dajare）
- GET `/api/game/single/:playerId/state` → 状態取得
- POST `/api/game/single/:playerId/end` → 終了/レポート

評価結果の`evaluation`は以下のキーで返ります（統一済み）：
- `temperature`: 数値（寒い<0 / 暑い>0）
- `funnyScore`: 数値
- `comment`: 文字列

## WebSocket（マルチ）
- Client → Server: `player_join`, `create_room`, `join_room`, `auto_match`, `start_game`, `submit_dajare`, `vote`, `use_werewolf_ability`
- Server → Client: `join_success`, `room_created`, `room_joined`, `room_updated`, `game_started`, `dajare_evaluated`, `game_updated`, `voting_started`, `vote_updated`, `game_ended`, `player_left`, `error`

特に以下を統一しました：
- イベント名: `voting_started`（旧: voting_phase_started）, `dajare_evaluated`（旧: dajare_submitted）, `join_success`（旧: connect_success）
- 評価キー: `temperature` を正とし、旧 `thermal` は内部互換のみに使用

詳細は `backend/WEBSOCKET_API.md` と `WEBSOCKET_TEST_PLAN.md` を参照してください。

## ライフ増減仕様（要旨）
- 温度`temperature`でライフを増減（寒い<0=凍る=増 / 暑い>0=溶ける=減）。
- 範囲は段階的（例: <=-15で+10〜+25, >40で-20〜-40 など）。

## 動画テストページ（開発用）
- `lib/pages/video_test_page.dart` にて、耐久値に応じた mp4 の段階表示/一回再生を検証できます（アプリ導線からは切り離し済み）。
- 全動画は起動時プリロード、切替時の読み込み待ちを回避します。

## デプロイ
- Render.com での手順は `DEPLOY.md` を参照。

## 既知の注意/懸念
- テスト用HTML/JSには開発用ログ表現が残る場合があります（API仕様は本READMEと `backend/WEBSOCKET_API.md` が正）。
- ライフ変化にはランダム幅があり、難易度調整は係数で調整可能です。
