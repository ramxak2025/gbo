/// Основная оболочка — Multi-WebView с нативным BottomNav
///
/// Каждая вкладка имеет свой WebView, который не уничтожается
/// при переключении. IndexedStack сохраняет состояние всех WebView
/// (скролл, формы, React-состояние).
///
/// Нативный BottomNav с glass-morphism повторяет дизайн веб-версии.
/// Веб-версия BottomNav скрывается через CSS-инжект.
library;

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

/// Конфигурация вкладки нижнего меню
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

/// Конфигурация вкладок по ролям (точная копия BottomNav.jsx navConfigs)
Map<String, List<_TabConfig>> _navConfigs = {
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
    _TabConfig(
        path: '/author', icon: LucideIcons.sparkles, label: 'Автор'),
    _TabConfig(
        path: '/materials', icon: LucideIcons.film, label: 'Материалы'),
  ],
};

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;
  late final List<_TabConfig> _tabs;
  late final List<WebViewController> _controllers;
  late final List<bool> _loaded; // Отслеживаем загрузку каждой вкладки
  late final String _token;

  @override
  void initState() {
    super.initState();

    final auth = context.read<AuthProvider>();
    _token = auth.authData?.token ?? '';
    final roleName = auth.role?.name ?? 'student';
    _tabs = _navConfigs[roleName] ?? _navConfigs['student']!;

    _loaded = List.filled(_tabs.length, false);
    _controllers = List.generate(_tabs.length, (i) => _createController(i));
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
          onPageFinished: (_) {
            // Инжектируем токен + скрываем веб-BottomNav + фейк standalone
            _controllers[index].runJavaScript('''
              try {
                // Auth
                localStorage.setItem('token', '$_token');

                // Fake standalone — скрывает InstallPrompt
                Object.defineProperty(window.navigator, 'standalone', {
                  get: function() { return true; },
                  configurable: true
                });
                localStorage.setItem('iborcuha_install_dismissed', Date.now().toString());

                // Скрываем веб-BottomNav (нативный заменяет его)
                var style = document.createElement('style');
                style.textContent = `
                  .fixed.bottom-0 { display: none !important; }
                  [class*="fixed"][class*="bottom-0"][class*="z-50"] { display: none !important; }
                `;
                document.head.appendChild(style);

                // Обновляем auth
                if (window.__refreshAuth) window.__refreshAuth();
              } catch(e) {}
            ''');
            if (mounted) {
              setState(() => _loaded[index] = true);
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
        onMessageReceived: (message) {
          _handleBridgeMessage(message.message);
        },
      )
      ..loadRequest(Uri.parse(url));

    return controller;
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

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    // Edge-to-edge
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
          // IndexedStack — все WebView живут одновременно
          IndexedStack(
            index: _currentIndex,
            children: [
              for (var i = 0; i < _tabs.length; i++)
                WebViewWidget(controller: _controllers[i]),
            ],
          ),

          // Loading overlay для текущей вкладки
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

          // Нативный BottomNav — точная копия BottomNav.jsx
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

/// Нативный BottomNav с glass-morphism
/// Точная копия BottomNav.jsx
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
      // px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2
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
              // inset border effect
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
