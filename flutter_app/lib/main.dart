import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'providers/auth_provider.dart';
import 'providers/data_provider.dart';
import 'providers/theme_provider.dart';
import 'theme/app_theme.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/team_screen.dart';
import 'screens/cash_screen.dart';
import 'screens/tournaments_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/groups_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('ru', null);

  final themeProvider = ThemeProvider();
  await themeProvider.init();

  final authProvider = AuthProvider();
  await authProvider.init();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: themeProvider),
        ChangeNotifierProvider.value(value: authProvider),
        ChangeNotifierProvider(create: (_) => DataProvider()),
      ],
      child: const IBorcuhaApp(),
    ),
  );
}

class IBorcuhaApp extends StatelessWidget {
  const IBorcuhaApp({super.key});

  @override
  Widget build(BuildContext context) {
    final tp = context.watch<ThemeProvider>();
    final auth = context.watch<AuthProvider>();

    // System UI overlay
    SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle(
      statusBarBrightness: tp.isDark ? Brightness.dark : Brightness.light,
      statusBarIconBrightness: tp.isDark ? Brightness.light : Brightness.dark,
      systemNavigationBarColor: tp.theme.bg,
    ));

    return MaterialApp(
      title: 'iBorcuha',
      debugShowCheckedModeBanner: false,
      theme: tp.theme.themeData,
      home: auth.isLoading
          ? _SplashScreen(tp: tp)
          : auth.isLoggedIn
              ? const MainNavigator()
              : const LoginScreen(),
    );
  }
}

class _SplashScreen extends StatelessWidget {
  final ThemeProvider tp;
  const _SplashScreen({required this.tp});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: tp.theme.bg,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ShaderMask(
              shaderCallback: (bounds) => const LinearGradient(
                colors: [AppColors.purple, Color(0xFF7C3AED), Color(0xFF6366F1)],
              ).createShader(bounds),
              child: const Text(
                'iBorcuha',
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white),
              ),
            ),
            const SizedBox(height: 20),
            CircularProgressIndicator(color: tp.theme.accent, strokeWidth: 2),
          ],
        ),
      ),
    );
  }
}

class MainNavigator extends StatefulWidget {
  const MainNavigator({super.key});

  @override
  State<MainNavigator> createState() => _MainNavigatorState();
}

class _MainNavigatorState extends State<MainNavigator> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    // Load data on first navigation
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DataProvider>().loadData();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final tp = context.watch<ThemeProvider>();
    final t = tp.theme;
    final isDark = tp.isDark;

    final tabs = _getTabs(auth.role);
    if (_currentIndex >= tabs.length) _currentIndex = 0;

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: tabs.map((tab) => tab['screen'] as Widget).toList(),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: isDark ? Colors.black.withOpacity(0.5) : Colors.white.withOpacity(0.8),
          border: Border(
            top: BorderSide(color: t.cardBorder, width: 0.5),
          ),
        ),
        child: ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
            child: SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: tabs.asMap().entries.map((entry) {
                    final i = entry.key;
                    final tab = entry.value;
                    final active = i == _currentIndex;

                    return GestureDetector(
                      onTap: () => setState(() => _currentIndex = i),
                      behavior: HitTestBehavior.opaque,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(14),
                          color: active
                              ? t.accent.withOpacity(0.12)
                              : Colors.transparent,
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              tab['icon'] as IconData,
                              size: 22,
                              color: active ? t.accent : t.textMuted,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              tab['label'] as String,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                                color: active ? t.accent : t.textMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  List<Map<String, dynamic>> _getTabs(String role) {
    switch (role) {
      case 'superadmin':
        return [
          {'icon': Icons.dashboard_rounded, 'label': 'Панель', 'screen': const DashboardScreen()},
          {'icon': Icons.people_rounded, 'label': 'Команда', 'screen': const TeamScreen()},
          {'icon': Icons.emoji_events_rounded, 'label': 'Турниры', 'screen': const TournamentsScreen()},
          {'icon': Icons.person_rounded, 'label': 'Профиль', 'screen': const ProfileScreen()},
        ];
      case 'trainer':
        return [
          {'icon': Icons.dashboard_rounded, 'label': 'Главная', 'screen': const DashboardScreen()},
          {'icon': Icons.people_rounded, 'label': 'Команда', 'screen': const TeamScreen()},
          {'icon': Icons.emoji_events_rounded, 'label': 'Турниры', 'screen': const TournamentsScreen()},
          {'icon': Icons.account_balance_wallet_rounded, 'label': 'Финансы', 'screen': const CashScreen()},
          {'icon': Icons.person_rounded, 'label': 'Профиль', 'screen': const ProfileScreen()},
        ];
      default: // student
        return [
          {'icon': Icons.dashboard_rounded, 'label': 'Главная', 'screen': const DashboardScreen()},
          {'icon': Icons.people_rounded, 'label': 'Команда', 'screen': const TeamScreen()},
          {'icon': Icons.emoji_events_rounded, 'label': 'Турниры', 'screen': const TournamentsScreen()},
          {'icon': Icons.person_rounded, 'label': 'Профиль', 'screen': const ProfileScreen()},
        ];
    }
  }
}
