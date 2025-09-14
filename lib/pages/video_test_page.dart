// lib/pages/video_test_page.dart
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

class VideoTestPage extends StatefulWidget {
  const VideoTestPage({super.key});

  static const String routeName = '/videoTest';

  @override
  State<VideoTestPage> createState() => _VideoTestPageState();
}

class _VideoTestPageState extends State<VideoTestPage> {
  late List<VideoPlayerController> _controllers;
  int _currentDurability = 100; // 初期耐久値
  int _currentVideoIndex = 0; // 現在表示中の動画のインデックス
  bool _isPlayingTransition = false; // 動画再生中フラグ
  int _lastDurability = 100; // 直前の耐久値
  int? _pendingReturnIndex; // 特殊再生（Solid）終了後の戻り先

  // インデックス定義（_videoConfigsの順序と対応）
  static const int _idxMelt1 = 0;
  static const int _idxMelt2 = 1;
  static const int _idxMelt3 = 2;
  static const int _idxSolid2 = 3;
  static const int _idxSolid1 = 4;

  // 動画ファイル名と耐久値の閾値
  final List<Map<String, dynamic>> _videoConfigs = [
    {'path': 'assets/videos/Melt1(100-60).mp4', 'threshold': 60},
    {'path': 'assets/videos/Melt2(60-20).mp4', 'threshold': 20},
    {'path': 'assets/videos/Melt3(20-0).mp4', 'threshold': 0},
    {'path': 'assets/videos/Solid2(20-60).mp4', 'threshold': 30},
    {'path': 'assets/videos/Solid1(60-100).mp4', 'threshold': 70},
  ];

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(_videoConfigs.length, (index) {
      final controller = VideoPlayerController.asset(
        _videoConfigs[index]['path'],
      );
      controller.initialize().then((_) {
        // 全ての動画をプリロードし、ループを無効にする
        controller.setLooping(false);
        setState(() {}); // UIを更新して動画の準備完了を反映
      });
      // 再生終了を検知するリスナー
      controller.addListener(() {
        // 動画が最後まで再生された、かつ、現在このコントローラーが再生中として扱われている場合
        if (controller.value.position >= controller.value.duration &&
            _isPlayingTransition &&
            _controllers[_currentVideoIndex] == controller) {
          _onVideoEnded(controller);
        }
      });
      return controller;
    });

    // 初期表示する動画を設定
    _updateVideoDisplay();
    _lastDurability = _currentDurability;
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    super.dispose();
  }

  void _updateDurability(int change) {
    final old = _currentDurability;
    setState(() {
      _currentDurability = (_currentDurability + change).clamp(
        0,
        100,
      ); // 0-100の範囲に制限
    });

    // 上昇（凍る方向）への遷移時に特殊再生（Solid）を一度だけ行う
    if (_currentDurability > old) {
      final played = _tryPlayUpwardSpecial(old, _currentDurability);
      if (played) {
        _lastDurability = _currentDurability;
        return;
      }
    }

    // 通常の下降（溶ける方向）チェック
    _checkVideoPlayback();
    _lastDurability = _currentDurability;
  }

  void _checkVideoPlayback() {
    if (_isPlayingTransition) return;

    final currentConfig = _videoConfigs[_currentVideoIndex];
    if (_currentDurability <= currentConfig['threshold']) {
      // 現在の動画の閾値を下回った場合、動画を再生
      _isPlayingTransition = true;
      _controllers[_currentVideoIndex].play();
    } else {
      // 閾値を超えている場合は、動画を表示するが再生はしない
      _updateVideoDisplay();
    }
  }

  void _updateVideoDisplay() {
    // 特殊再生中は表示切替しない
    if (_isPlayingTransition) return;

    // 現在の耐久値に基づいて「待機表示」すべきMelt動画のインデックスを直接決定
    int newIndex;
    if (_currentDurability > 60) {
      newIndex = _idxMelt1;
    } else if (_currentDurability > 20) {
      newIndex = _idxMelt2;
    } else {
      newIndex = _idxMelt3;
    }

    if (newIndex != _currentVideoIndex) {
      // 動画が切り替わる場合、前の動画を停止・巻き戻し
      _controllers[_currentVideoIndex].pause();
      _controllers[_currentVideoIndex].seekTo(Duration.zero);
      _currentVideoIndex = newIndex;
    }
    setState(() {}); // UIを更新
  }

  void _moveToNextVideo() {
    setState(() {
      if (_currentVideoIndex < _videoConfigs.length - 1) {
        _currentVideoIndex++;
        _isPlayingTransition = false; // 次の動画の準備ができたのでフラグをリセット
        _updateVideoDisplay(); // 新しい動画を表示
      } else {
        // 全ての動画が再生し終わった場合
        _isPlayingTransition = false;
        // 必要に応じてゲーム終了処理などをここに記述
      }
    });
  }

  // 上昇時の特殊再生判定（Solid動画の一回再生）
  bool _tryPlayUpwardSpecial(int oldValue, int newValue) {
    if (_isPlayingTransition) return false; // 再生中は割り込みしない

    // 70をまたいだらSolid1を再生し、終了後はMelt1待機へ
    if (oldValue < 70 && newValue >= 70) {
      _playSpecialVideo(_idxSolid1, _idxMelt1);
      return true;
    }
    // 30をまたいだらSolid2を再生し、終了後はMelt2待機へ
    if (oldValue < 30 && newValue >= 30) {
      _playSpecialVideo(_idxSolid2, _idxMelt2);
      return true;
    }
    return false;
  }

  // 特殊（Solid）動画を一度再生し、終了後に戻す
  void _playSpecialVideo(int specialIndex, int returnIndex) {
    // 現在の動画を停止して巻き戻す
    _controllers[_currentVideoIndex].pause();
    _controllers[_currentVideoIndex].seekTo(Duration.zero);

    _currentVideoIndex = specialIndex;
    _pendingReturnIndex = returnIndex;
    _isPlayingTransition = true;

    final controller = _controllers[_currentVideoIndex];
    if (controller.value.isInitialized) {
      controller.setLooping(false);
      controller.seekTo(Duration.zero);
      controller.play();
    }
    setState(() {});
  }

  // 動画終了時の共通処理
  void _onVideoEnded(VideoPlayerController controller) {
    controller.pause();
    _isPlayingTransition = false;

    if (_pendingReturnIndex != null) {
      // 特殊（Solid）再生の終了。指定の待機用Meltへそのまま戻す（再計算しない）
      _controllers[_currentVideoIndex].seekTo(Duration.zero); // 今の（Solid）を巻き戻す
      _currentVideoIndex = _pendingReturnIndex!; // 指定のMeltへ固定復帰
      _pendingReturnIndex = null;
      // 復帰先Meltは停止・先頭位置にして待機
      _controllers[_currentVideoIndex].pause();
      _controllers[_currentVideoIndex].seekTo(Duration.zero);
      setState(() {});
      return;
    }

    // 通常（Melt）遷移の終了は次の動画へ
    _moveToNextVideo();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('動画テストページ')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              '現在の耐久値: $_currentDurability',
              style: const TextStyle(fontSize: 24),
            ),
            const SizedBox(height: 20),
            // 動画表示部分
            _controllers[_currentVideoIndex].value.isInitialized
                ? AspectRatio(
                    aspectRatio:
                        _controllers[_currentVideoIndex].value.aspectRatio,
                    child: VideoPlayer(_controllers[_currentVideoIndex]),
                  )
                : const CircularProgressIndicator(), // 動画の初期化中はローディング表示
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton(
                  onPressed: () => _updateDurability(-10),
                  child: const Text('耐久値を減らす (-10)'),
                ),
                const SizedBox(width: 20),
                ElevatedButton(
                  onPressed: () => _updateDurability(10),
                  child: const Text('耐久値を増やす (+10)'),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Text(
              '現在表示中の動画: ${_videoConfigs[_currentVideoIndex]['path'].split('/').last}',
            ),
            Text('次の再生閾値: ${_videoConfigs[_currentVideoIndex]['threshold']}'),
          ],
        ),
      ),
    );
  }
}
