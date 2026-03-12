/// Основная оболочка — копия Layout.jsx
///
/// Animated atmospheric gradient blobs + GlassBottomNav + IndexedStack.
/// Role-adaptive экраны с нативными переходами.
/// Живой фон с плавными анимациями для вау-эффекта.
library;

import 'dart:math' as math;
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
import 'materials_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> with TickerProviderStateMixin {
  int _currentIndex = 0;

  late final AnimationController _blobController1;
  late final AnimationController _blobController2;
  late final AnimationController _blobController3;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DataProvider>().loadData();
    });

    // Slow breathing animations for blobs
    _blobController1 = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    )..repeat(reverse: true);

    _blobController2 = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 12),
    )..repeat(reverse: true);

    _blobController3 = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _blobController1.dispose();
    _blobController2.dispose();
    _blobController3.dispose();
    super.dispose();
  }

  List<Widget> _buildScreens(UserRole role) {
    switch (role) {
      case UserRole.superadmin:
        return const [
          DashboardScreen(),
          _PlaceholderScreen(title: 'Клубы'),
          TeamScreen(),
          TournamentsScreen(),
          ProfileScreen(),
        ];
      case UserRole.trainer:
        return const [
          DashboardScreen(),
          CashScreen(),
          TeamScreen(),
          TournamentsScreen(),
          MaterialsScreen(),
        ];
      case UserRole.student:
        return const [
          DashboardScreen(),
          TeamScreen(),
          TournamentsScreen(),
          _PlaceholderScreen(title: 'Автор'),
          MaterialsScreen(),
        ];
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;
    final auth = context.watch<AuthProvider>();
    final role = auth.role ?? UserRole.student;
    final screens = _buildScreens(role);
    final size = MediaQuery.of(context).size;

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
            // Animated atmospheric blobs — живой фон
            // Blob 1: Purple (top-left) — breathing + drifting
            AnimatedBuilder(
              animation: _blobController1,
              builder: (context, child) {
                final t = _blobController1.value;
                return Positioned(
                  top: -size.height * (0.25 + t * 0.08),
                  left: -size.width * (0.15 + t * 0.05),
                  child: Container(
                    width: size.width * (0.55 + t * 0.1),
                    height: size.height * (0.55 + t * 0.1),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: isDark
                              ? Color.lerp(
                                  const Color(0xFF581C87).withValues(alpha: 0.15),
                                  const Color(0xFF7C3AED).withValues(alpha: 0.25),
                                  t,
                                )!
                              : Color.lerp(
                                  const Color(0xFFE9D5FF).withValues(alpha: 0.25),
                                  const Color(0xFFD8B4FE).withValues(alpha: 0.40),
                                  t,
                                )!,
                          blurRadius: 120 + t * 40,
                          spreadRadius: 40 + t * 20,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),

            // Blob 2: Rose/Red (bottom-right) — counter-breathing
            AnimatedBuilder(
              animation: _blobController2,
              builder: (context, child) {
                final t = _blobController2.value;
                return Positioned(
                  bottom: -size.height * (0.18 + t * 0.06),
                  right: -size.width * (0.12 + t * 0.05),
                  child: Container(
                    width: size.width * (0.5 + t * 0.08),
                    height: size.height * (0.5 + t * 0.08),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: isDark
                              ? Color.lerp(
                                  const Color(0xFF7F1D1D).withValues(alpha: 0.12),
                                  const Color(0xFFBE123C).withValues(alpha: 0.20),
                                  t,
                                )!
                              : Color.lerp(
                                  const Color(0xFFFECACA).withValues(alpha: 0.18),
                                  const Color(0xFFFDA4AF).withValues(alpha: 0.30),
                                  t,
                                )!,
                          blurRadius: 100 + t * 30,
                          spreadRadius: 30 + t * 15,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),

            // Blob 3: Teal/Cyan (center-right) — subtle accent
            AnimatedBuilder(
              animation: _blobController3,
              builder: (context, child) {
                final t = _blobController3.value;
                return Positioned(
                  top: size.height * (0.35 + t * 0.05),
                  right: -size.width * (0.25 + t * 0.03),
                  child: Container(
                    width: size.width * (0.35 + t * 0.06),
                    height: size.height * (0.35 + t * 0.06),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: isDark
                              ? Color.lerp(
                                  const Color(0xFF164E63).withValues(alpha: 0.08),
                                  const Color(0xFF0E7490).withValues(alpha: 0.14),
                                  t,
                                )!
                              : Color.lerp(
                                  const Color(0xFFCFFAFE).withValues(alpha: 0.15),
                                  const Color(0xFF67E8F9).withValues(alpha: 0.22),
                                  t,
                                )!,
                          blurRadius: 80 + t * 25,
                          spreadRadius: 20 + t * 10,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),

            // Screens
            IndexedStack(
              index: _currentIndex,
              children: screens,
            ),
            // Bottom navigation
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

class _PlaceholderScreen extends StatelessWidget {
  final String title;
  const _PlaceholderScreen({required this.title});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Center(
        child: Text(
          title,
          style: Theme.of(context).textTheme.headlineMedium,
        ),
      ),
    );
  }
}
