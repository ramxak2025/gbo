/// Основная оболочка — WebView обёртка
///
/// После авторизации загружает веб-версию iborcuha.ru
/// с инжектированным токеном. Pixel-perfect копия PWA
/// внутри нативного приложения.
///
/// Фичи:
/// - Эмуляция standalone mode (скрывает install prompt)
/// - Edge-to-edge отображение
/// - Нативные haptics через JS bridge
/// - Внешние ссылки открываются в системном браузере
library;

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
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _initWebView();
  }

  void _initWebView() {
    final auth = context.read<AuthProvider>();
    final token = auth.authData?.token ?? '';

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF0A0A0F))
      ..setUserAgent('iBorcuhaApp/1.0')
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            if (mounted) setState(() => _isLoading = true);
          },
          onPageFinished: (_) {
            // 1. Инжектируем токен
            // 2. Фейкаем standalone mode чтобы скрыть install prompt
            // 3. Скрываем любые оставшиеся баннеры
            _controller.runJavaScript('''
              try {
                // Auth token
                localStorage.setItem('token', '$token');

                // Fake standalone mode — скрывает InstallPrompt
                Object.defineProperty(window.navigator, 'standalone', {
                  get: function() { return true; },
                  configurable: true
                });

                // Также ставим dismissed на всякий случай
                localStorage.setItem('iborcuha_install_dismissed', Date.now().toString());

                // Обновляем auth если уже загружено
                if (window.__refreshAuth) window.__refreshAuth();
              } catch(e) {}
            ''');
            if (mounted) setState(() => _isLoading = false);
          },
          onWebResourceError: (error) {
            if (mounted) {
              setState(() {
                _isLoading = false;
                _hasError = true;
              });
            }
          },
          onNavigationRequest: (request) {
            final url = request.url;
            // Внешние ссылки — в системный браузер
            if (url.startsWith('https://wa.me/') ||
                url.startsWith('https://t.me/') ||
                url.startsWith('tel:') ||
                url.startsWith('mailto:')) {
              launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..addJavaScriptChannel(
        'FlutterBridge',
        onMessageReceived: (message) {
          _handleBridgeMessage(message.message);
        },
      )
      ..setOnScrollPositionChange((_) {
        // Подавляем overscroll чтобы не было "резинки" при скролле
      })
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

  Future<void> _reload() async {
    setState(() {
      _hasError = false;
      _isLoading = true;
    });
    await _controller.reload();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;

    // Edge-to-edge: прозрачный статус-бар, контент под ним
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
      // Без SafeArea — контент идёт на весь экран как нативное приложение
      body: Stack(
        children: [
          // WebView на весь экран
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
                    // Логотип как на splash
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

          // Error state
          if (_hasError && !_isLoading)
            Container(
              decoration: BoxDecoration(
                gradient:
                    LiquidGlassColors.backgroundGradient(isDark: isDark),
              ),
              child: SafeArea(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.wifi_off_rounded,
                        size: 48,
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.3)
                            : Colors.grey,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Нет подключения',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white : Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Проверьте интернет и попробуйте снова',
                        style: TextStyle(
                          fontSize: 14,
                          color: isDark
                              ? Colors.white.withValues(alpha: 0.5)
                              : Colors.grey,
                        ),
                      ),
                      const SizedBox(height: 24),
                      GestureDetector(
                        onTap: _reload,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 28, vertical: 12),
                          decoration: BoxDecoration(
                            color: LiquidGlassColors.primary,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            'Повторить',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
