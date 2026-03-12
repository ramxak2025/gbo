/// Основная оболочка — Single WebView + нативный BottomNav
///
/// Один WebView загружает веб-приложение.
/// Переключение вкладок через JS навигацию React Router.
/// Состояние сохраняется — React SPA не перезагружается.
///
/// Архитектура:
/// - 1 WebView (единый localStorage, cookies, auth)
/// - Нативный BottomNav вызывает JS navigate()
/// - Веб-BottomNav скрыт через CSS
/// - Deep linking через navigateToPath()
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
  const _TabConfig({required this.path, required this.icon, required this.label});
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
// MainShell — Single WebView + native BottomNav
// ============================================================

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => MainShellState();
}

class MainShellState extends State<MainShell> {
  int _currentIndex = 0;
  late final List<_TabConfig> _tabs;
  late final WebViewController _controller;
  late final String _injectionScript;
  bool _isLoading = true;
  bool _webReady = false; // React app fully loaded

  @override
  void initState() {
    super.initState();

    final auth = context.read<AuthProvider>();
    final authData = auth.authData;
    final roleName = auth.role?.name ?? 'student';
    _tabs = _navConfigs[roleName] ?? _navConfigs['student']!;

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
        // Auth — correct keys matching web's api.js and AuthContext.jsx
        localStorage.setItem('iborcuha_token', '$safeToken');
        localStorage.setItem('iborcuha_auth', '$safeAuth');

        // Fake standalone — hide InstallPrompt
        if (!window.__standalonePatched) {
          Object.defineProperty(window.navigator, 'standalone', {
            get: function() { return true; },
            configurable: true
          });
          window.__standalonePatched = true;
        }
        localStorage.setItem('iborcuha_install_dismissed', Date.now().toString());

        // Hide web BottomNav (native replaces it)
        if (!document.getElementById('__flutter_hide_nav')) {
          var s = document.createElement('style');
          s.id = '__flutter_hide_nav';
          s.textContent = 'div.fixed.bottom-0 { display: none !important; }';
          document.head.appendChild(s);
        }

        // Bridge for React to call native functions
        window.__flutterNative = {
          haptic: function(t) { if(window.FlutterBridge) FlutterBridge.postMessage('haptic_'+t); },
          logout: function() { if(window.FlutterBridge) FlutterBridge.postMessage('logout'); },
          navigate: function(p) { if(window.FlutterBridge) FlutterBridge.postMessage('navigate:'+p); },
          isNativeApp: true,
          platform: 'flutter',
        };

        // Signal that injection is done
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
            // Inject ASAP (before React initializes)
            _controller.runJavaScript(_injectionScript);
          },
          onPageFinished: (_) {
            // Re-inject after full load
            _controller.runJavaScript(_injectionScript);
            if (mounted) {
              setState(() {
                _isLoading = false;
                _webReady = true;
              });
            }
          },
          onNavigationRequest: (request) {
            final url = request.url;
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
        onMessageReceived: (msg) => _handleBridgeMessage(msg.message),
      )
      ..loadRequest(Uri.parse(AppConfig.apiBaseUrl));
  }

  /// Navigate to path via React Router (no page reload!)
  void _navigateInWebView(String path) {
    // Use React Router's navigate function via history API
    // React Router v6 listens to popstate events
    _controller.runJavaScript('''
      try {
        // Method 1: Direct React Router navigate (if exposed)
        if (window.__navigate) {
          window.__navigate('$path');
        } else {
          // Method 2: pushState + popstate event (works with React Router)
          window.history.pushState({}, '', '$path');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      } catch(e) {
        // Fallback: reload the page at the new path
        window.location.href = '$path';
      }
    ''');
  }

  void _handleBridgeMessage(String message) {
    if (message.startsWith('navigate:')) {
      navigateToPath(message.substring('navigate:'.length));
      return;
    }
    if (message.startsWith('route_changed:')) {
      // Web notifies us about route changes → sync bottom nav
      final path = message.substring('route_changed:'.length);
      _syncTabFromPath(path);
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

  /// Sync native tab highlight from current web path
  void _syncTabFromPath(String path) {
    for (var i = 0; i < _tabs.length; i++) {
      if (_tabs[i].path == path ||
          (_tabs[i].path != '/' && path.startsWith(_tabs[i].path))) {
        if (i != _currentIndex && mounted) {
          setState(() => _currentIndex = i);
        }
        return;
      }
    }
  }

  /// Deep link — called from push notifications or JS bridge
  void navigateToPath(String path) {
    // Update native tab
    _syncTabFromPath(path);
    // Navigate in WebView
    _navigateInWebView(path);
    HapticFeedback.selectionClick();
  }

  void refreshCurrentTab() {
    _controller.reload();
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
          // Single WebView
          WebViewWidget(controller: _controller),

          // Loading overlay
          if (_isLoading)
            Container(
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
                // Navigate React Router to this tab's path
                _navigateInWebView(_tabs[index].path);
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================
// Glass BottomNav — exact copy of BottomNav.jsx
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
