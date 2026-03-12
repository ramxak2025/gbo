/// Нижняя навигация — копия BottomNav.jsx
///
/// Плавающая полупрозрачная таблетка rounded-[22px]
/// с backdrop-blur-3xl и role-adaptive навигацией.
library;

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import '../providers/auth_provider.dart';
import '../models/user.dart';

class NavItem {
  final IconData icon;
  final String label;
  const NavItem({required this.icon, required this.label});
}

class GlassBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const GlassBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  static List<NavItem> getItems(UserRole role) {
    switch (role) {
      case UserRole.superadmin:
        return const [
          NavItem(icon: LucideIcons.home, label: 'Главная'),
          NavItem(icon: LucideIcons.shield, label: 'Клубы'),
          NavItem(icon: LucideIcons.users, label: 'Люди'),
          NavItem(icon: LucideIcons.trophy, label: 'Турниры'),
          NavItem(icon: LucideIcons.user, label: 'Профиль'),
        ];
      case UserRole.trainer:
        return const [
          NavItem(icon: LucideIcons.home, label: 'Главная'),
          NavItem(icon: LucideIcons.wallet, label: 'Касса'),
          NavItem(icon: LucideIcons.users, label: 'Команда'),
          NavItem(icon: LucideIcons.trophy, label: 'Турниры'),
          NavItem(icon: LucideIcons.film, label: 'Материалы'),
        ];
      case UserRole.student:
        return const [
          NavItem(icon: LucideIcons.home, label: 'Главная'),
          NavItem(icon: LucideIcons.users, label: 'Команда'),
          NavItem(icon: LucideIcons.trophy, label: 'Турниры'),
          NavItem(icon: LucideIcons.sparkles, label: 'Автор'),
          NavItem(icon: LucideIcons.film, label: 'Материалы'),
        ];
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;
    final auth = context.watch<AuthProvider>();
    final role = auth.role ?? UserRole.student;
    final items = getItems(role);
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(16, 8, 16, bottomPadding + 10),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(22),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 40, sigmaY: 40),
          child: Container(
            height: 60,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(22),
              color: isDark
                  ? Colors.white.withValues(alpha: 0.08)
                  : Colors.white.withValues(alpha: 0.50),
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
            ),
            child: Row(
              children: List.generate(items.length, (index) {
                final item = items[index];
                final isActive = index == currentIndex;

                return Expanded(
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () {
                      HapticFeedback.selectionClick();
                      onTap(index);
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeOutCubic,
                      margin: const EdgeInsets.symmetric(horizontal: 2, vertical: 6),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        color: isActive
                            ? isDark
                                ? Colors.white.withValues(alpha: 0.12)
                                : Colors.black.withValues(alpha: 0.06)
                            : Colors.transparent,
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            item.icon,
                            size: 22,
                            color: isActive
                                ? isDark ? Colors.white : Colors.grey[900]
                                : isDark ? Colors.grey[600] : Colors.grey[400],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            item.label,
                            style: TextStyle(
                              fontSize: 9,
                              letterSpacing: 0.3,
                              fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                              color: isActive
                                  ? isDark ? Colors.white : Colors.grey[900]
                                  : isDark ? Colors.grey[600] : Colors.grey[400],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}
