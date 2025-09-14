import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

/// あずきバーの耐久値(0-100)に応じて段階動画を表示/再生するウィジェット。
/// - 溶け側(Melt1/2/3)を待機表示。
/// - しきい値を下回ると該当Melt動画を一度だけ再生。
/// - 耐久が上昇して30/70を跨ぐと、対応するSolid(2/1)を一度再生後、指定のMeltへ戻る。
class AzukiBarVideoWidget extends StatefulWidget {
  final int durability; // 0-100
  final bool background; // trueでカバー表示
  final double coverScale; // 背景時の縮尺（1.0未満で少し小さく）
  const AzukiBarVideoWidget({
    super.key,
    required this.durability,
    this.background = false,
    this.coverScale = 1.0,
  });

  @override
  State<AzukiBarVideoWidget> createState() => _AzukiBarVideoWidgetState();
}

class _AzukiBarVideoWidgetState extends State<AzukiBarVideoWidget> {
  late List<VideoPlayerController> _controllers;
  int _currentDurability = 100;
  int _currentVideoIndex = 0;
  bool _isPlayingTransition = false;
  int _lastDurability = 100;
  int? _pendingReturnIndex;

  // インデックス定義（_videoConfigsの順序と対応）
  static const int _idxMelt1 = 0; // (100-60)
  static const int _idxMelt2 = 1; // (60-20)
  static const int _idxMelt3 = 2; // (20-0)
  static const int _idxSolid2 = 3; // (20-60)
  static const int _idxSolid1 = 4; // (60-100)

  final List<Map<String, dynamic>> _videoConfigs = const [
    {'path': 'assets/videos/Melt1(100-60).mp4', 'threshold': 60},
    {'path': 'assets/videos/Melt2(60-20).mp4', 'threshold': 20},
    {'path': 'assets/videos/Melt3(20-0).mp4', 'threshold': 0},
    {'path': 'assets/videos/Solid2(20-60).mp4', 'threshold': 30},
    {'path': 'assets/videos/Solid1(60-100).mp4', 'threshold': 70},
  ];

  @override
  void initState() {
    super.initState();
    _currentDurability = widget.durability.clamp(0, 100);
    _lastDurability = _currentDurability;

    _controllers = List.generate(_videoConfigs.length, (index) {
      final controller = VideoPlayerController.asset(_videoConfigs[index]['path']);
      controller.initialize().then((_) {
        controller.setLooping(false);
        if (mounted) setState(() {});
      });
      controller.addListener(() {
        if (controller.value.isInitialized &&
            controller.value.position >= controller.value.duration &&
            _isPlayingTransition &&
            _controllers[_currentVideoIndex] == controller) {
          _onVideoEnded(controller);
        }
      });
      return controller;
    });

    _updateVideoDisplay();
  }

  @override
  void didUpdateWidget(covariant AzukiBarVideoWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    final newValue = widget.durability.clamp(0, 100);
    if (newValue == _currentDurability) return;

    final old = _currentDurability;
    _currentDurability = newValue;

    if (_currentDurability > old) {
      // 上昇時（凍る方向）の特殊再生
      final played = _tryPlayUpwardSpecial(old, _currentDurability);
      if (played) {
        _lastDurability = _currentDurability;
        return;
      }
    }

    // 下降時（溶ける方向）チェック
    _checkVideoPlayback();
    _lastDurability = _currentDurability;
  }

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    super.dispose();
  }

  void _checkVideoPlayback() {
    if (_isPlayingTransition) return;

    final currentConfig = _videoConfigs[_currentVideoIndex];
    if (_currentDurability <= currentConfig['threshold']) {
      _isPlayingTransition = true;
      _controllers[_currentVideoIndex].seekTo(Duration.zero);
      _controllers[_currentVideoIndex].play();
    } else {
      _updateVideoDisplay();
    }
  }

  void _updateVideoDisplay() {
    if (_isPlayingTransition) return;

    int newIndex;
    if (_currentDurability > 60) {
      newIndex = _idxMelt1;
    } else if (_currentDurability > 20) {
      newIndex = _idxMelt2;
    } else {
      newIndex = _idxMelt3;
    }

    if (newIndex != _currentVideoIndex) {
      _controllers[_currentVideoIndex].pause();
      _controllers[_currentVideoIndex].seekTo(Duration.zero);
      _currentVideoIndex = newIndex;
    }
    if (mounted) setState(() {});
  }

  bool _tryPlayUpwardSpecial(int oldValue, int newValue) {
    if (_isPlayingTransition) return false;
    if (oldValue < 70 && newValue >= 70) {
      _playSpecialVideo(_idxSolid1, _idxMelt1);
      return true;
    }
    if (oldValue < 30 && newValue >= 30) {
      _playSpecialVideo(_idxSolid2, _idxMelt2);
      return true;
    }
    return false;
  }

  void _playSpecialVideo(int specialIndex, int returnIndex) {
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
    if (mounted) setState(() {});
  }

  void _onVideoEnded(VideoPlayerController controller) {
    controller.pause();
    _isPlayingTransition = false;

    if (_pendingReturnIndex != null) {
      _controllers[_currentVideoIndex].seekTo(Duration.zero);
      _currentVideoIndex = _pendingReturnIndex!;
      _pendingReturnIndex = null;
      _controllers[_currentVideoIndex].pause();
      _controllers[_currentVideoIndex].seekTo(Duration.zero);
      if (mounted) setState(() {});
      return;
    }

    // 通常（Melt）遷移の終了は次の動画へ
    if (_currentVideoIndex < _videoConfigs.length - 1) {
      _currentVideoIndex++;
      _isPlayingTransition = false;
      _updateVideoDisplay();
    } else {
      _isPlayingTransition = false;
      if (mounted) setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    final controller = _controllers[_currentVideoIndex];
    final isReady = controller.value.isInitialized;

    if (widget.background) {
      if (!isReady) {
        return const Center(child: CircularProgressIndicator());
      }
      // 画面全面をカバー（左右トリミング可）
      final videoSize = controller.value.size;
      final width = videoSize.width > 0 ? videoSize.width : 1920.0;
      final height = videoSize.height > 0 ? videoSize.height : 1080.0;
      return SizedBox.expand(
        child: Center(
          child: FractionallySizedBox(
            widthFactor: widget.coverScale.clamp(0.6, 1.0),
            heightFactor: widget.coverScale.clamp(0.6, 1.0),
            child: FittedBox(
              fit: BoxFit.cover,
              child: SizedBox(
                width: width,
                height: height,
                child: VideoPlayer(controller),
              ),
            ),
          ),
        ),
      );
    } else {
      return Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 640),
          child: AspectRatio(
            aspectRatio: isReady ? controller.value.aspectRatio : 16 / 9,
            child: isReady
                ? VideoPlayer(controller)
                : const Center(child: CircularProgressIndicator()),
          ),
        ),
      );
    }
  }
}
