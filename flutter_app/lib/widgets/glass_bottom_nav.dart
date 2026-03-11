/// Нижняя навигация в стиле Liquid Glass
///
/// Полупрозрачная панель навигации с размытием фона.
/// Адаптируется под роль пользователя (тренер/ученик/админ).
library;

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import '../providers/auth_provider.dart';
import '../models/user.dart';
import '../theme/app_theme.dart';

/// Элемент навигации
class NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final String route;

  const NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.route,
  });
}

/// Стеклянная нижняя навигация
class GlassBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const GlassBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  /// Элементы навигации в зависимости от роли
  static List<NavItem> getItems(UserRole role) {
    final items = <NavItem>[
      const NavItem(
        icon: LucideIcons.layoutDashboard,
        activeIcon: LucideIcons.layoutDashboard,
        label: 'Главная',
        route: '/',
      ),
    ];

    if (role == UserRole.trainer) {
      items.add(const NavItem(
        icon: LucideIcons.wallet,
        activeIcon: LucideIcons.wallet,
        label: 'Касса',
        route: '/cash',
      ));
    }

    items.add(const NavItem(
      icon: LucideIcons.users,
      activeIcon: LucideIcons.users,
      label: 'Команда',
      route: '/team',
    ));

    items.add(const NavItem(
      icon: LucideIcons.trophy,
      activeIcon: LucideIcons.trophy,
      label: 'Турниры',
      route: '/tournaments',
    ));

    items.add(const NavItem(
      icon: LucideIcons.user,
      activeIcon: LucideIcons.user,
      label: 'Профиль',
      route: '/profile',
    ));

    return items;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;
    final auth = context.watch<AuthProvider>();
    final role = auth.role ?? UserRole.student;
    final items = getItems(role);

    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
        child: Container(
          height: 84 + MediaQuery.of(context).padding.bottom,
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).padding.bottom,
          ),
          decoration: BoxDecoration(
            color: isDark
                ? Colors.black.withValues(alpha: 0.6)
                : Colors.white.withValues(alpha: 0.8),
            border: Border(
              top: BorderSide(
                color: isDark
                    ? Colors.white.withValues(alpha: 0.1)
                    : Colors.black.withValues(alpha: 0.05),
              ),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(items.length, (index) {
              final item = items[index];
              final isActive = index == currentIndex;

              return Expanded(
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () => onTap(index),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        AnimatedSwitcher(
                          duration: const Duration(milliseconds: 200),
                          child: Icon(
                            isActive ? item.activeIcon : item.icon,
                            key: ValueKey<bool>(isActive),
                            size: 24,
                            color: isActive
                                ? LiquidGlassColors.primary
                                : isDark
                                    ? Colors.white.withValues(alpha: 0.5)
                                    : Colors.black.withValues(alpha: 0.4),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item.label,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight:
                                isActive ? FontWeight.w600 : FontWeight.w400,
                            color: isActive
                                ? LiquidGlassColors.primary
                                : isDark
                                    ? Colors.white.withValues(alpha: 0.5)
                                    : Colors.black.withValues(alpha: 0.4),
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
    );
  }
}
