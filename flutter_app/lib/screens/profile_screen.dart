/// Экран профиля пользователя
///
/// Отображает информацию о пользователе,
/// позволяет редактировать профиль, менять тему,
/// переходить к настройкам уведомлений и выходить.
library;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/data_provider.dart';
import '../providers/theme_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import '../widgets/avatar_widget.dart';
import '../widgets/glass_button.dart';
import '../utils/sports.dart';
import 'groups_screen.dart';
import 'materials_screen.dart';

/// Экран профиля
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;
    final auth = context.watch<AuthProvider>();
    final data = context.watch<DataProvider>();
    final user = auth.currentUser;

    if (user == null) return const SizedBox.shrink();

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.only(bottom: 100),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Text(
              'Профиль',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
          ),

          const SizedBox(height: 20),

          // Карточка профиля
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: GlassCard(
              child: Column(
                children: [
                  AvatarWidget(
                    name: user.name,
                    imageUrl: user.avatar,
                    size: 80,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    user.name,
                    style: Theme.of(context).textTheme.titleLarge,
                    textAlign: TextAlign.center,
                  ),
                  Text(
                    user.phone,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  if (user.clubName != null && user.clubName!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        user.clubName!,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                  if (user.city != null && user.city!.isNotEmpty)
                    Text(
                      user.city!,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  if (user.sportTypes.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      alignment: WrapAlignment.center,
                      children: user.sportTypes.map((s) {
                        final sport = findSport(s);
                        return Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: LiquidGlassColors.primary
                                .withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            sport != null
                                ? '${sport.emoji} ${sport.name}'
                                : s,
                            style: const TextStyle(
                              fontSize: 12,
                              color: LiquidGlassColors.primary,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ],
              ),
            ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1),
          ),

          const SizedBox(height: 16),

          // Меню
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                // Группы (тренер)
                if (auth.isTrainer)
                  _MenuCard(
                    icon: LucideIcons.layers,
                    label: 'Группы',
                    color: LiquidGlassColors.purple,
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => const GroupsScreen(),
                      ),
                    ),
                    delay: 100,
                  ),

                // Материалы
                _MenuCard(
                  icon: LucideIcons.video,
                  label: 'Материалы',
                  color: LiquidGlassColors.teal,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => const MaterialsScreen(),
                    ),
                  ),
                  delay: 200,
                ),

                // Тема
                _MenuCard(
                  icon: isDark ? LucideIcons.sun : LucideIcons.moon,
                  label: isDark ? 'Светлая тема' : 'Тёмная тема',
                  color: LiquidGlassColors.warning,
                  onTap: () =>
                      context.read<ThemeProvider>().toggleTheme(),
                  delay: 300,
                ),

                const SizedBox(height: 20),

                // Выход
                GlassButton(
                  label: 'Выйти',
                  icon: LucideIcons.logOut,
                  style: GlassButtonStyle.danger,
                  onTap: () async {
                    final confirmed = await showDialog<bool>(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Выход'),
                        content:
                            const Text('Вы уверены, что хотите выйти?'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.of(ctx).pop(false),
                            child: const Text('Отмена'),
                          ),
                          TextButton(
                            onPressed: () => Navigator.of(ctx).pop(true),
                            child: const Text('Выйти'),
                          ),
                        ],
                      ),
                    );
                    if (confirmed == true && context.mounted) {
                      await context.read<AuthProvider>().logout();
                    }
                  },
                ).animate().fadeIn(delay: 400.ms),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Карточка меню
class _MenuCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  final int delay;

  const _MenuCard({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
    required this.delay,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GlassCard(
        onTap: onTap,
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: color.withValues(alpha: 0.15),
              ),
              child: Icon(icon, size: 20, color: color),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ),
            const Icon(LucideIcons.chevronRight, size: 18),
          ],
        ),
      )
          .animate()
          .fadeIn(delay: Duration(milliseconds: delay))
          .slideX(begin: 0.05),
    );
  }
}
