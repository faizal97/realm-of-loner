import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter/foundation.dart' show kDebugMode;
import 'package:webview_flutter_android/webview_flutter_android.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  runApp(const AzerothApp());
}

class AzerothApp extends StatelessWidget {
  const AzerothApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      title: 'Realm of Loner',
      debugShowCheckedModeBanner: false,
      home: GameScreen(),
    );
  }
}

class GameScreen extends StatefulWidget {
  const GameScreen({super.key});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> with WidgetsBindingObserver {
  late final WebViewController _controller;
  // Bridges to MainActivity.kt. The page sends {id, cmd, args} on a JS channel; the answer goes back to window.<reply>.
  static const _upd = MethodChannel('azsolo/update'); // in-app updater, answered with window.AZUPD_REPLY
  static const _file = MethodChannel('azsolo/file');  // save files: share sheet and file picker, window.AZFILE_REPLY
  static const _cloud = MethodChannel('azsolo/cloud'); // cloud save: a Google Drive token, window.AZCLOUD_REPLY
  static const _view = MethodChannel('azsolo/view');   // the WebView's mode (#99), window.AZVIEW_REPLY
  // hybrid: the native WebView draws at its own rate (#99: smoother than texture mode, where Flutter copies each frame);
  // texture mode stays one hidden switch away so the same phone can compare. null until read at start
  String? _mode;
  // Music files (v10.8): the page asks for one by path ({id, path}), the bytes come back as base64 to window.AZASSET_REPLY.
  // Only files under music/ can be read.
  static final _assetPath = RegExp(r'^music/[a-z0-9_]+\.m4a$');
  Future<void> _asset(JavaScriptMessage msg) async {
    Map<String, dynamic> req;
    try { req = jsonDecode(msg.message) as Map<String, dynamic>; } catch (_) { return; }
    final id = req['id'], path = req['path'];
    Map<String, dynamic> out;
    if (path is! String || !_assetPath.hasMatch(path)) {
      out = {'id': id, 'ok': false, 'err': 'not a music file'};
    } else {
      try {
        final data = await rootBundle.load('assets/game/$path');
        out = {'id': id, 'ok': true, 'b64': base64Encode(data.buffer.asUint8List(data.offsetInBytes, data.lengthInBytes))};
      } catch (e) {
        out = {'id': id, 'ok': false, 'err': e.toString()};
      }
    }
    _controller.runJavaScript('window.AZASSET_REPLY && window.AZASSET_REPLY(${jsonEncode(jsonEncode(out))})');
  }

  Future<void> _bridge(MethodChannel ch, String reply, JavaScriptMessage msg) async {
    Map<String, dynamic> req;
    try { req = jsonDecode(msg.message) as Map<String, dynamic>; } catch (_) { return; }
    final id = req['id'];
    bool ok = true;
    Object? value;
    try {
      value = await ch.invokeMethod(req['cmd'] as String, req['args']);
    } on PlatformException catch (e) {
      ok = false; value = {'code': e.code, 'message': e.message};
    } catch (e) {
      ok = false; value = {'code': 'error', 'message': e.toString()};
    }
    final payload = jsonEncode({'id': id, 'ok': ok, 'value': value});
    _controller.runJavaScript('window.$reply && window.$reply(${jsonEncode(payload)})');
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF0E0B08))
      ..addJavaScriptChannel('AzUpd', onMessageReceived: (m) => _bridge(_upd, 'AZUPD_REPLY', m))
      ..addJavaScriptChannel('AzFile', onMessageReceived: (m) => _bridge(_file, 'AZFILE_REPLY', m))
      ..addJavaScriptChannel('AzCloud', onMessageReceived: (m) => _bridge(_cloud, 'AZCLOUD_REPLY', m))
      ..addJavaScriptChannel('AzView', onMessageReceived: (m) => _bridge(_view, 'AZVIEW_REPLY', m))
      ..addJavaScriptChannel('AzAsset', onMessageReceived: _asset);
    // music may start without a tap (v10.8), so the main menu has its theme from the first screen; set before the page loads
    if (_controller.platform is AndroidWebViewController) (_controller.platform as AndroidWebViewController).setMediaPlaybackRequiresUserGesture(false);
    _controller.loadFlutterAsset('assets/game/index.html');
    _view.invokeMethod<String>('getMode').then((m) { if (mounted) setState(() => _mode = m == 'texture' ? 'texture' : 'hybrid'); },
        onError: (_) { if (mounted) setState(() => _mode = 'hybrid'); });
    // debug builds only: the page can be inspected from Chrome (chrome://inspect), for testing on an emulator
    if (kDebugMode && _controller.platform is AndroidWebViewController) AndroidWebViewController.enableDebugging(true);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  // Tell the page to save whenever the app goes to the background, so a
  // swipe-away never loses progress.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) {
      _controller.runJavaScript('window.GAME && window.GAME.save && window.GAME.save()');
    } else if (state == AppLifecycleState.resumed) {
      _controller.runJavaScript('window.GAME && window.GAME.resume && window.GAME.resume()');
    }
  }

  PlatformWebViewWidgetCreationParams _widgetParams() {
    final p = _controller.platform;
    if (p is AndroidWebViewController) return AndroidWebViewWidgetCreationParams(controller: p, displayWithHybridComposition: _mode != 'texture');
    return PlatformWebViewWidgetCreationParams(controller: p);
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _controller.runJavaScript('window.GAME && window.GAME.back && window.GAME.back()');
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF0E0B08),
        body: SafeArea(child: _mode == null ? const SizedBox.expand() : WebViewWidget.fromPlatformCreationParams(params: _widgetParams())),
      ),
    );
  }
}
