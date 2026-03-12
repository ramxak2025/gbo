/// Основная оболочка — один WebView, веб-навигация
///
/// Один WebView загружает iborcuha.ru с инжектированным токеном.
/// Веб-приложение управляет навигацией через свой BottomNav.
/// Flutter — нативная оболочка: splash, login, push, haptics.
library;

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../theme/app_theme.dart';
import '../utils/config.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => MainShellState();
}

class MainShellState extends State<MainShell> {
  late final WebViewController _controller;
  late final String _injectionScript;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();

    final auth = context.read<AuthProvider>();
    final authData = auth.authData;

    // Build auth JSON matching web's iborcuha_auth format
    final token = authData?.token ?? '';
    final authJson = authData != null
        ? jsonEncode({
            'userId': authData.userId,
            'role': authData.role.name,
            'studentId': authData.studentId,
            'user': authData.user.toJson(),
            'student': authData.studentData,
          })
        : '{}';

    final safeToken = token.replaceAll("'", "\\'");
    final safeAuth = authJson.replaceAll("'", "\\'").replaceAll('\n', '');

    _injectionScript = '''
      try {
        localStorage.setItem('iborcuha_token', '$safeToken');
        localStorage.setItem('iborcuha_auth', '$safeAuth');
        if (!window.__sp) {
          Object.defineProperty(window.navigator, 'standalone', {
            get: function() { return true; }, configurable: true
          });
          window.__sp = true;
        }
        localStorage.setItem('iborcuha_install_dismissed', Date.now().toString());
        window.__flutterNative = {
          haptic: function(t) { if(window.FlutterBridge) FlutterBridge.postMessage('haptic_'+t); },
          logout: function() { if(window.FlutterBridge) FlutterBridge.postMessage('logout'); },
          isNativeApp: true
        };
        if (window.__refreshAuth) window.__refreshAuth();
      } catch(e) {}
    ''';

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF0A0A0F))
      ..setUserAgent('iBorcuhaApp/1.0')
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            _controller.runJavaScript(_injectionScript);
          },
          onPageFinished: (_) {
            _controller.runJavaScript(_injectionScript);
            if (mounted && _isLoading) {
              setState(() => _isLoading = false);
            }
          },
          onNavigationRequest: (request) {
            final url = request.url;
            if (url.startsWith('https://wa.me/') ||
                url.startsWith('https://t.me/') ||
                url.startsWith('tel:') ||
                url.startsWith('mailto:')) {
              launchUrl(Uri.parse(url),
                  mode: LaunchMode.externalApplication);
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..addJavaScriptChannel(
        'FlutterBridge',
        onMessageReceived: (msg) => _handleBridgeMessage(msg.message),
      )
      ..loadRequest(Uri.parse(AppConfig.apiBaseUrl));
  }

  void _handleBridgeMessage(String message) {
    switch (message) {
      case 'logout':
        context.read<AuthProvider>().logout();
        break;
      case 'haptic_light':
        HapticFeedback.lightImpact();
        break;
      case 'haptic_medium':
        HapticFeedback.mediumImpact();
        break;
      case 'haptic_heavy':
        HapticFeedback.heavyImpact();
        break;
      case 'haptic_selection':
        HapticFeedback.selectionClick();
        break;
    }
  }

  /// Deep link — открыть конкретную страницу (из push-уведомления)
  void navigateToPath(String path) {
    _controller.runJavaScript('''
      try {
        window.history.pushState({}, '', '$path');
        window.dispatchEvent(new PopStateEvent('popstate'));
      } catch(e) { window.location.href = '$path'; }
    ''');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;

    SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
      statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarIconBrightness:
          isDark ? Brightness.light : Brightness.dark,
    ));
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);

    return Scaffold(
      body: Stack(
        children: [
          // WebView на весь экран — веб-приложение управляет навигацией
          WebViewWidget(controller: _controller),

          // Loading overlay
          if (_isLoading)
            Container(
              decoration: BoxDecoration(
                gradient:
                    LiquidGlassColors.backgroundGradient(isDark: isDark),
              ),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: isDark
                                ? const Color(0xFF7C3AED)
                                    .withValues(alpha: 0.3)
                                : const Color(0xFFC084FC)
                                    .withValues(alpha: 0.2),
                            blurRadius: 40,
                            spreadRadius: 8,
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(24),
                        child: Image.asset(
                          'assets/logo.png',
                          width: 64,
                          height: 64,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) =>
                              const SizedBox(width: 64, height: 64),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    const CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(
                        LiquidGlassColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
