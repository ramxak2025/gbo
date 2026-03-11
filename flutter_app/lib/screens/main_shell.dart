/// Основная оболочка приложения с нижней навигацией
///
/// Содержит навигацию между основными экранами.
/// Загружает данные при первом входе.
/// Адаптируется под роль пользователя.
library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/data_provider.dart';
import '../providers/theme_provider.dart';
import '../models/user.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_bottom_nav.dart';

import 'dashboard_screen.dart';
import 'cash_screen.dart';
import 'team_screen.dart';
import 'tournaments_screen.dart';
import 'profile_screen.dart';

/// Основная оболочка с навигацией
class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    // Загружаем данные при входе
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DataProvider>().loadData();
    });
  }

  /// Экраны в зависимости от роли
  List<Widget> _buildScreens(UserRole role) {
    final screens = <Widget>[
      const DashboardScreen(),
    ];

    if (role == UserRole.trainer) {
      screens.add(const CashScreen());
    }

    screens.addAll(const [
      TeamScreen(),
      TournamentsScreen(),
      ProfileScreen(),
    ]);

    return screens;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;
    final auth = context.watch<AuthProvider>();
    final role = auth.role ?? UserRole.student;
    final screens = _buildScreens(role);

    // Корректируем индекс если экранов стало меньше
    if (_currentIndex >= screens.length) {
      _currentIndex = 0;
    }

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LiquidGlassColors.backgroundGradient(isDark: isDark),
        ),
        child: Stack(
          children: [
            // Текущий экран
            IndexedStack(
              index: _currentIndex,
              children: screens,
            ),
            // Нижняя навигация
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: GlassBottomNav(
                currentIndex: _currentIndex,
                onTap: (index) {
                  setState(() => _currentIndex = index);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
