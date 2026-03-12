/// Основная оболочка — Multi-WebView + Offstage
///
/// Каждая вкладка = свой WebView. Offstage скрывает неактивные,
/// но НЕ уничтожает их. Состояние полностью сохраняется.
///
/// Auth передаётся через URL hash (#__ft=TOKEN&__fa=AUTH_JSON).
/// Inline-скрипт в index.html читает hash ПЕРЕД загрузкой React,
/// записывает в localStorage, убирает hash из URL.
/// Результат: каждый WebView авторизован с первого рендера.
///
/// Предзагрузка: ВСЕ вкладки загружаются параллельно в фоне.
/// Splash с прогрессом показывается до готовности первой вкладки.
library;

import 'dart:convert';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../theme/app_theme.dart';
import '../utils/config.dart';

// ============================================================
// Tab config — exact copy of BottomNav.jsx
// ============================================================

class _TabConfig {
  final String path;
  final IconData icon;
  final String label;
  const _TabConfig(
      {required this.path, required this.icon, required this.label});
}

final Map<String, List<_TabConfig>> _navConfigs = {
  'superadmin': [
    _TabConfig(path: '/', icon: LucideIcons.home, label: 'Главная'),
    _TabConfig(path: '/clubs', icon: LucideIcons.shield, label: 'Клубы'),
    _TabConfig(path: '/team', icon: LucideIcons.users, label: 'Люди'),
    _TabConfig(
        path: '/tournaments', icon: LucideIcons.trophy, label: 'Турниры'),
    _TabConfig(path: '/profile', icon: LucideIcons.user, label: 'Профиль'),
  ],
  'trainer': [
    _TabConfig(path: '/', icon: LucideIcons.home, label: 'Главная'),
    _TabConfig(path: '/cash', icon: LucideIcons.wallet, label: 'Касса'),
    _TabConfig(path: '/team', icon: LucideIcons.users, label: 'Команда'),
    _TabConfig(
        path: '/tournaments', icon: LucideIcons.trophy, label: 'Турниры'),
    _TabConfig(
        path: '/materials', icon: LucideIcons.film, label: 'Материалы'),
  ],
  'student': [
    _TabConfig(path: '/', icon: LucideIcons.home, label: 'Главная'),
    _TabConfig(path: '/team', icon: LucideIcons.users, label: 'Команда'),
    _TabConfig(
        path: '/tournaments', icon: LucideIcons.trophy, label: 'Турниры'),
    _TabConfig(path: '/author', icon: LucideIcons.sparkles, label: 'Автор'),
    _TabConfig(
        path: '/materials', icon: LucideIcons.film, label: 'Материалы'),
  ],
};

// ============================================================
// MainShell
// ============================================================

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => MainShellState();
}

class MainShellState extends State<MainShell>
    with SingleTickerProviderStateMixin {
  int _currentIndex = 0;
  late final List<_TabConfig> _tabs;
  late final List<WebViewController> _controllers;
  late final List<bool> _loaded;
  late final String _authHash;

  // Preload tracking
  int _loadedCount = 0;
  bool _splashDismissed = false;
  late final AnimationController _fadeController;

  // JS injected after each page load — each section isolated so one
  // failure (e.g. defineProperty on iOS) doesn't break the rest.
  static const String _postLoadScript = '''
    // 1. Fake standalone mode (may throw on iOS — isolated)
    try {
      if (!window.__sp) {
        Object.defineProperty(window.navigator, 'standalone', {
          get: function() { return true; }, configurable: true
        });
        window.__sp = true;
      }
    } catch(e) {}

    // 2. Dismiss install prompt
    try {
      localStorage.setItem('iborcuha_install_dismissed', Date.now().toString());
    } catch(e) {}

    // 3. Hide web BottomNav via CSS
    try {
      if (!document.getElementById('__fhn')) {
        var s = document.createElement('style');
        s.id = '__fhn';
        s.textContent = 'div.fixed.bottom-0 { display:none!important; }';
        document.head.appendChild(s);
      }
    } catch(e) {}

    // 4. Flutter ↔ Web bridge (haptic, logout, native flag)
    try {
      window.__flutterNative = {
        haptic: function(t) { if(window.FlutterBridge) FlutterBridge.postMessage('haptic_'+t); },
        logout: function() {
          if(window.FlutterBridge) setTimeout(function(){ FlutterBridge.postMessage('logout'); }, 0);
        },
        isNativeApp: true
      };
    } catch(e) {}

    // 5. Watch for logout: poll localStorage every 300ms
    //    When 'iborcuha_auth' disappears, notify Flutter.
    //    Works regardless of how React triggers logout.
    try {
      if (localStorage.getItem('iborcuha_auth') && !window.__authPoll) {
        window.__authPoll = setInterval(function() {
          if (!localStorage.getItem('iborcuha_auth')) {
            clearInterval(window.__authPoll);
            window.__authPoll = null;
            if (window.FlutterBridge) FlutterBridge.postMessage('logout');
          }
        }, 300);
      }
    } catch(e) {}
  ''';

  @override
  void initState() {
    super.initState();

    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    )..addStatusListener((status) {
        if (status == AnimationStatus.completed) {
          setState(() {}); // remove splash from widget tree
        }
      });

    final auth = context.read<AuthProvider>();
    final authData = auth.authData;
    final roleName = auth.role?.name ?? 'student';
    _tabs = _navConfigs[roleName] ?? _navConfigs['student']!;

    // Build URL hash with auth data
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

    _authHash =
        '#__ft=${Uri.encodeComponent(token)}&__fa=${Uri.encodeComponent(authJson)}';

    // Create all WebViews — ALL load in parallel for fast preloading
    _loaded = List.filled(_tabs.length, false);
    _controllers = List.generate(_tabs.length, _createController);
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  /// Build URL for tab: baseUrl + path + #__ft=TOKEN&__fa=AUTH
  String _urlForTab(int index) {
    final baseUrl = AppConfig.apiBaseUrl;
    final path = _tabs[index].path;
    final pagePath = path == '/' ? '' : path;
    return '$baseUrl$pagePath$_authHash';
  }

  WebViewController _createController(int index) {
    final controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF0A0A0F))
      ..setUserAgent('iBorcuhaApp/1.0')
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (_) {
            _controllers[index].runJavaScript(_postLoadScript);
            if (mounted && !_loaded[index]) {
              setState(() {
                _loaded[index] = true;
                _loadedCount++;
              });
              // Dismiss splash as soon as ANY tab finishes loading
              if (!_splashDismissed) {
                _dismissSplash();
              }
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
      ..loadRequest(Uri.parse(_urlForTab(index)));

    return controller;
  }

  void _dismissSplash() {
    _splashDismissed = true;
    _fadeController.forward();
  }

  void _handleBridgeMessage(String message) {
    if (!mounted) return;
    switch (message) {
      case 'logout':
        context.read<AuthProvider>().logout();
        return; // skip haptics after logout
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

  /// Deep link
  void navigateToPath(String path) {
    for (var i = 0; i < _tabs.length; i++) {
      if (_tabs[i].path == path ||
          (_tabs[i].path != '/' && path.startsWith(_tabs[i].path))) {
        setState(() => _currentIndex = i);
        if (path != _tabs[i].path) {
          final baseUrl = AppConfig.apiBaseUrl;
          _controllers[i].loadRequest(Uri.parse('$baseUrl$path$_authHash'));
        }
        HapticFeedback.selectionClick();
        return;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;
    final bottomPadding = MediaQuery.of(context).padding.bottom;

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
          // All WebViews — Offstage keeps them alive, ALL preload in parallel
          for (var i = 0; i < _tabs.length; i++)
            Offstage(
              offstage: i != _currentIndex,
              child: WebViewWidget(controller: _controllers[i]),
            ),

          // Preload splash with progress — fades out when first tab ready
          if (!_splashDismissed || _fadeController.isAnimating)
            IgnorePointer(
              ignoring: _splashDismissed,
              child: FadeTransition(
                opacity: Tween<double>(begin: 1.0, end: 0.0)
                    .animate(_fadeController),
                child: _PreloadSplash(
                  isDark: isDark,
                  loadedCount: _loadedCount,
                  totalCount: _tabs.length,
                ),
              ),
            ),

          // Native BottomNav
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _GlassBottomNav(
              tabs: _tabs,
              currentIndex: _currentIndex,
              isDark: isDark,
              bottomPadding: bottomPadding,
              onTap: (index) {
                HapticFeedback.selectionClick();
                setState(() => _currentIndex = index);
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================
// Preload Splash — shows progress while WebViews load
// ============================================================

class _PreloadSplash extends StatelessWidget {
  final bool isDark;
  final int loadedCount;
  final int totalCount;

  const _PreloadSplash({
    required this.isDark,
    required this.loadedCount,
    required this.totalCount,
  });

  @override
  Widget build(BuildContext context) {
    final progress = totalCount > 0 ? loadedCount / totalCount : 0.0;

    return Container(
      decoration: BoxDecoration(
        gradient: LiquidGlassColors.backgroundGradient(isDark: isDark),
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
                        ? const Color(0xFF7C3AED).withValues(alpha: 0.3)
                        : const Color(0xFFC084FC).withValues(alpha: 0.2),
                    blurRadius: 40,
                    spreadRadius: 8,
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: Image.asset(
                  'assets/logo.png',
                  width: 80,
                  height: 80,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) =>
                      const SizedBox(width: 80, height: 80),
                ),
              ),
            ),
            const SizedBox(height: 32),
            // Progress bar
            SizedBox(
              width: 140,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 3,
                  backgroundColor: isDark
                      ? Colors.white.withValues(alpha: 0.08)
                      : Colors.black.withValues(alpha: 0.06),
                  valueColor: const AlwaysStoppedAnimation<Color>(
                    LiquidGlassColors.primary,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ============================================================
// Glass BottomNav
// ============================================================

class _GlassBottomNav extends StatelessWidget {
  final List<_TabConfig> tabs;
  final int currentIndex;
  final bool isDark;
  final double bottomPadding;
  final ValueChanged<int> onTap;

  const _GlassBottomNav({
    required this.tabs,
    required this.currentIndex,
    required this.isDark,
    required this.bottomPadding,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 8, 16, bottomPadding + 10),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(22),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 40, sigmaY: 40),
          child: Container(
            height: 60,
            decoration: BoxDecoration(
              color: isDark
                  ? Colors.white.withValues(alpha: 0.08)
                  : Colors.white.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(22),
              boxShadow: isDark
                  ? [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.4),
                        blurRadius: 32,
                        offset: const Offset(0, 8),
                      ),
                    ]
                  : [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.08),
                        blurRadius: 32,
                        offset: const Offset(0, 8),
                      ),
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
              border: Border(
                top: BorderSide(
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.1)
                      : Colors.white.withValues(alpha: 0.8),
                  width: 0.5,
                ),
              ),
            ),
            child: Row(
              children: [
                for (var i = 0; i < tabs.length; i++)
                  Expanded(
                    child: GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: () => onTap(i),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        margin: const EdgeInsets.symmetric(
                            horizontal: 4, vertical: 6),
                        decoration: BoxDecoration(
                          color: i == currentIndex
                              ? (isDark
                                  ? Colors.white.withValues(alpha: 0.12)
                                  : Colors.black.withValues(alpha: 0.06))
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              tabs[i].icon,
                              size: 22,
                              color: i == currentIndex
                                  ? (isDark ? Colors.white : Colors.black87)
                                  : (isDark
                                      ? Colors.grey.shade600
                                      : Colors.grey.shade400),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              tabs[i].label,
                              style: TextStyle(
                                fontSize: 9,
                                letterSpacing: 0.3,
                                fontWeight: i == currentIndex
                                    ? FontWeight.bold
                                    : FontWeight.w500,
                                color: i == currentIndex
                                    ? (isDark
                                        ? Colors.white
                                        : Colors.black87)
                                    : (isDark
                                        ? Colors.grey.shade600
                                        : Colors.grey.shade400),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
