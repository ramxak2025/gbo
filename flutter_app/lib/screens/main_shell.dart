/// Основная оболочка — Multi-WebView с нативным BottomNav
///
/// Каждая вкладка = свой WebView. Переключение не уничтожает WebView,
/// состояние (скролл, открытый турнир, форма) сохраняется.
///
/// Загрузка:
/// 1. Первый WebView (главная) загружается и инжектирует auth в localStorage
/// 2. После готовности auth — остальные WebView загружаются
/// 3. iOS WKWebView разделяет localStorage между WebView одного домена
///
/// На Android localStorage может НЕ делиться — auth инжектируется
/// через cookie как запасной вариант.
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
// Tab config — exact copy of BottomNav.jsx navConfigs
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

class MainShellState extends State<MainShell> {
  int _currentIndex = 0;
  late final List<_TabConfig> _tabs;
  late final String _injectionScript;

  // WebView controllers — created lazily
  final Map<int, WebViewController> _controllers = {};
  final Set<int> _loadedTabs = {};
  bool _authReady = false; // true after first WebView injected auth

  @override
  void initState() {
    super.initState();

    final auth = context.read<AuthProvider>();
    final authData = auth.authData;
    final roleName = auth.role?.name ?? 'student';
    _tabs = _navConfigs[roleName] ?? _navConfigs['student']!;

    // Build injection script
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
        if (!document.getElementById('__fhn')) {
          var s = document.createElement('style');
          s.id = '__fhn';
          s.textContent = 'div.fixed.bottom-0 { display:none!important; }';
          document.head.appendChild(s);
        }
        window.__flutterNative = {
          haptic: function(t) { if(window.FlutterBridge) FlutterBridge.postMessage('haptic_'+t); },
          logout: function() { if(window.FlutterBridge) FlutterBridge.postMessage('logout'); },
          isNativeApp: true
        };
        if (window.__refreshAuth) window.__refreshAuth();
      } catch(e) {}
    ''';

    // Load first tab immediately
    _getOrCreateController(0);
  }

  WebViewController _getOrCreateController(int index) {
    if (_controllers.containsKey(index)) return _controllers[index]!;

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
            _controllers[index]?.runJavaScript(_injectionScript);
          },
          onPageFinished: (_) {
            _controllers[index]?.runJavaScript(_injectionScript);
            if (mounted) {
              setState(() {
                _loadedTabs.add(index);
                if (index == 0 && !_authReady) {
                  _authReady = true;
                  // Auth is now in localStorage — preload other tabs
                  _preloadRemainingTabs();
                }
              });
            }
          },
          onNavigationRequest: (request) {
            final reqUrl = request.url;
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
        onMessageReceived: (msg) => _handleBridgeMessage(msg.message),
      )
      ..loadRequest(Uri.parse(url));

    _controllers[index] = controller;
    return controller;
  }

  /// After first tab loads and injects auth, preload all other tabs
  void _preloadRemainingTabs() {
    for (var i = 1; i < _tabs.length; i++) {
      _getOrCreateController(i);
    }
  }

  void _handleBridgeMessage(String message) {
    if (message.startsWith('navigate:')) {
      navigateToPath(message.substring('navigate:'.length));
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

  /// Deep link: find matching tab and navigate within it
  void navigateToPath(String path) {
    for (var i = 0; i < _tabs.length; i++) {
      if (_tabs[i].path == path ||
          (_tabs[i].path != '/' && path.startsWith(_tabs[i].path))) {
        setState(() => _currentIndex = i);
        if (path != _tabs[i].path) {
          // Sub-route: navigate within the tab's WebView
          final fullUrl = '${AppConfig.apiBaseUrl}$path';
          _controllers[i]?.loadRequest(Uri.parse(fullUrl));
        }
        HapticFeedback.selectionClick();
        return;
      }
    }
    // Unknown path: navigate in current tab
    final fullUrl = '${AppConfig.apiBaseUrl}$path';
    _controllers[_currentIndex]?.loadRequest(Uri.parse(fullUrl));
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
          // All created WebViews stacked — only current one visible
          // Using Offstage instead of IndexedStack to keep ALL alive
          for (var i = 0; i < _tabs.length; i++)
            if (_controllers.containsKey(i))
              Offstage(
                offstage: i != _currentIndex,
                child: WebViewWidget(controller: _controllers[i]!),
              ),

          // Loading overlay
          if (!_loadedTabs.contains(_currentIndex))
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
                // Ensure controller exists when tapping a tab
                _getOrCreateController(index);
              },
            ),
          ),
        ],
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
