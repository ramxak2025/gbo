/// Основная оболочка — Multi-WebView с нативным BottomNav
///
/// Архитектура:
/// - 5 WebView в IndexedStack (каждая вкладка — свой WebView)
/// - Все WebView предзагружаются при старте (preload)
/// - Переключение вкладок мгновенное (без перезагрузки)
/// - Скролл, формы, React-состояние сохраняются
///
/// Интеграция с веб-приложением:
/// - Токен передаётся через localStorage (iborcuha_token + iborcuha_auth)
/// - Двусторонний JS bridge (FlutterBridge)
/// - Веб BottomNav скрыт через CSS (заменён нативным)
/// - Fake standalone mode (скрывает install prompt)
/// - DOM storage + кэш включены
///
/// Deep linking:
/// - navigateToPath(path) переключает вкладку или навигирует внутри WebView
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
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import '../utils/config.dart';

// ============================================================
// Tab configuration — exact copy of BottomNav.jsx navConfigs
// ============================================================

class _TabConfig {
  final String path;
  final IconData icon;
  final String label;
  const _TabConfig({
    required this.path,
    required this.icon,
    required this.label,
  });
}

final Map<String, List<_TabConfig>> _navConfigs = {
  'superadmin': [
    _TabConfig(path: '/', icon: LucideIcons.home, label: 'Главная'),
    _TabConfig(path: '/clubs', icon: LucideIcons.shield, label: 'Клубы'),
    _TabConfig(path: '/team', icon: LucideIcons.users, label: 'Люди'),
    _TabConfig(path: '/tournaments', icon: LucideIcons.trophy, label: 'Турниры'),
    _TabConfig(path: '/profile', icon: LucideIcons.user, label: 'Профиль'),
  ],
  'trainer': [
    _TabConfig(path: '/', icon: LucideIcons.home, label: 'Главная'),
    _TabConfig(path: '/cash', icon: LucideIcons.wallet, label: 'Касса'),
    _TabConfig(path: '/team', icon: LucideIcons.users, label: 'Команда'),
    _TabConfig(path: '/tournaments', icon: LucideIcons.trophy, label: 'Турниры'),
    _TabConfig(path: '/materials', icon: LucideIcons.film, label: 'Материалы'),
  ],
  'student': [
    _TabConfig(path: '/', icon: LucideIcons.home, label: 'Главная'),
    _TabConfig(path: '/team', icon: LucideIcons.users, label: 'Команда'),
    _TabConfig(path: '/tournaments', icon: LucideIcons.trophy, label: 'Турниры'),
    _TabConfig(path: '/author', icon: LucideIcons.sparkles, label: 'Автор'),
    _TabConfig(path: '/materials', icon: LucideIcons.film, label: 'Материалы'),
  ],
};

// ============================================================
// JS injection script — runs on every page load in each WebView
// ============================================================

String _buildInjectionScript({
  required String token,
  required String authJson,
}) {
  // Escape for JS string safety
  final safeToken = token.replaceAll("'", "\\'");
  final safeAuth = authJson.replaceAll("'", "\\'").replaceAll('\n', '');

  return '''
    try {
      // ---- Auth token (iborcuha_token — used by api.js) ----
      localStorage.setItem('iborcuha_token', '$safeToken');

      // ---- Auth data (iborcuha_auth — used by AuthContext.jsx) ----
      localStorage.setItem('iborcuha_auth', '$safeAuth');

      // ---- Fake standalone mode — hides InstallPrompt ----
      if (!window.__standalonePatched) {
        Object.defineProperty(window.navigator, 'standalone', {
          get: function() { return true; },
          configurable: true
        });
        window.__standalonePatched = true;
      }
      localStorage.setItem('iborcuha_install_dismissed', Date.now().toString());

      // ---- Hide web BottomNav (native one replaces it) ----
      if (!document.getElementById('__flutter_hide_nav')) {
        var style = document.createElement('style');
        style.id = '__flutter_hide_nav';
        style.textContent = `
          .fixed.bottom-0.left-0.right-0.z-50,
          .fixed.bottom-0.left-0.right-0[class*="z-50"],
          div.fixed.bottom-0 > nav { display: none !important; }
          body { padding-bottom: 0 !important; }
        `;
        document.head.appendChild(style);
      }

      // ---- Bridge: expose native functions to React ----
      window.__flutterNative = {
        haptic: function(type) {
          if (window.FlutterBridge) window.FlutterBridge.postMessage('haptic_' + type);
        },
        logout: function() {
          if (window.FlutterBridge) window.FlutterBridge.postMessage('logout');
        },
        navigate: function(path) {
          if (window.FlutterBridge) window.FlutterBridge.postMessage('navigate:' + path);
        },
        isNativeApp: true,
        platform: 'flutter',
      };

      // ---- Refresh auth if React already loaded ----
      if (window.__refreshAuth) window.__refreshAuth();

    } catch(e) { console.error('Flutter injection error:', e); }
  ''';
}

// ============================================================
// MainShell — Multi-WebView with native BottomNav
// ============================================================

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => MainShellState();
}

class MainShellState extends State<MainShell> {
  int _currentIndex = 0;
  late final List<_TabConfig> _tabs;
  late final List<WebViewController> _controllers;
  late final List<bool> _loaded;
  late final String _injectionScript;

  @override
  void initState() {
    super.initState();

    final auth = context.read<AuthProvider>();
    final authData = auth.authData;
    final roleName = auth.role?.name ?? 'student';
    _tabs = _navConfigs[roleName] ?? _navConfigs['student']!;

    // Build auth JSON matching web's iborcuha_auth format
    final authJson = authData != null
        ? jsonEncode({
            'userId': authData.userId,
            'role': authData.role.name,
            'studentId': authData.studentId,
            'user': authData.user.toJson(),
            'student': authData.studentData,
          })
        : '{}';

    _injectionScript = _buildInjectionScript(
      token: authData?.token ?? '',
      authJson: authJson,
    );

    // Create all WebViews at once (preload)
    _loaded = List.filled(_tabs.length, false);
    _controllers = List.generate(_tabs.length, _createController);
  }

  WebViewController _createController(int index) {
    final baseUrl = AppConfig.apiBaseUrl;
    final path = _tabs[index].path;
    final url = path == '/' ? baseUrl : '$baseUrl$path';

    final controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF0A0A0F))
      ..setUserAgent('iBorcuhaApp/1.0')
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            // Инжектируем скрипт как можно раньше
            _controllers[index].runJavaScript(_injectionScript);
          },
          onPageFinished: (_) {
            // Повторно инжектируем после полной загрузки (на всякий случай)
            _controllers[index].runJavaScript(_injectionScript);
            if (mounted && !_loaded[index]) {
              setState(() => _loaded[index] = true);
            }
          },
          onNavigationRequest: (request) {
            final reqUrl = request.url;
            // Внешние ссылки → системный браузер
            if (reqUrl.startsWith('https://wa.me/') ||
                reqUrl.startsWith('https://t.me/') ||
                reqUrl.startsWith('tel:') ||
                reqUrl.startsWith('mailto:')) {
              launchUrl(Uri.parse(reqUrl),
                  mode: LaunchMode.externalApplication);
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..addJavaScriptChannel(
        'FlutterBridge',
        onMessageReceived: (message) => _handleBridgeMessage(message.message),
      )
      ..loadRequest(Uri.parse(url));

    return controller;
  }

  // ---- JS Bridge: messages from React → Flutter ----
  void _handleBridgeMessage(String message) {
    // Deep link: "navigate:/tournaments/abc123"
    if (message.startsWith('navigate:')) {
      final path = message.substring('navigate:'.length);
      navigateToPath(path);
      return;
    }

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

  // ---- Deep linking: open specific page ----
  /// Navigate to a specific path (e.g., from push notification)
  /// If the path matches a tab root, switches to that tab.
  /// Otherwise navigates within the matching tab's WebView.
  void navigateToPath(String path) {
    // Find the matching tab
    int targetTab = -1;
    for (var i = 0; i < _tabs.length; i++) {
      if (_tabs[i].path == path) {
        targetTab = i;
        break;
      }
      // Match sub-routes (e.g., /tournaments/123 → tournaments tab)
      if (_tabs[i].path != '/' && path.startsWith(_tabs[i].path)) {
        targetTab = i;
        break;
      }
    }

    if (targetTab >= 0) {
      setState(() => _currentIndex = targetTab);
      // If it's a sub-route, navigate within that tab's WebView
      if (path != _tabs[targetTab].path) {
        final fullUrl = '${AppConfig.apiBaseUrl}$path';
        _controllers[targetTab].loadRequest(Uri.parse(fullUrl));
      }
    } else {
      // Unknown path — load in current tab
      final fullUrl = '${AppConfig.apiBaseUrl}$path';
      _controllers[_currentIndex].loadRequest(Uri.parse(fullUrl));
    }

    HapticFeedback.selectionClick();
  }

  /// Refresh the current tab's WebView
  void refreshCurrentTab() {
    _controllers[_currentIndex].reload();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    // Edge-to-edge display
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
          // ---- All WebViews live simultaneously ----
          IndexedStack(
            index: _currentIndex,
            children: [
              for (var i = 0; i < _tabs.length; i++)
                WebViewWidget(controller: _controllers[i]),
            ],
          ),

          // ---- Loading overlay (only for unloaded tabs) ----
          if (!_loaded[_currentIndex])
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

          // ---- Native BottomNav (glass morphism) ----
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
// Glass BottomNav — exact copy of BottomNav.jsx styling
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
                                    ? (isDark ? Colors.white : Colors.black87)
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
