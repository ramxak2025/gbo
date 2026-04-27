/// Экран главной страницы (Dashboard)
///
/// Обзор для пользователя: статистика, последние новости,
/// предстоящие турниры, быстрые действия.
/// Контент адаптируется под роль (тренер/ученик/админ).
library;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/data_provider.dart';
import '../providers/theme_provider.dart';
import '../models/user.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import '../widgets/avatar_widget.dart';
import '../widgets/page_header.dart';
import '../utils/date_utils.dart' as date_utils;

/// Главный экран — Dashboard
class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;
    final auth = context.watch<AuthProvider>();
    final data = context.watch<DataProvider>();
    final user = auth.currentUser;

    if (user == null) return const SizedBox.shrink();

    return SafeArea(
      child: RefreshIndicator(
        onRefresh: () => data.reload(),
        color: LiquidGlassColors.primary,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 100),
          children: [
            // Приветствие
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Row(
                children: [
                  AvatarWidget(
                    name: user.name,
                    imageUrl: user.avatar,
                    size: 48,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Привет, ${user.name.split(' ').first}!',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        Text(
                          _roleLabel(auth.role!),
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  // Переключатель темы
                  GestureDetector(
                    onTap: () => context.read<ThemeProvider>().toggleTheme(),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.1)
                            : Colors.black.withValues(alpha: 0.05),
                      ),
                      child: Icon(
                        isDark ? LucideIcons.sun : LucideIcons.moon,
                        size: 20,
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.7)
                            : Colors.black.withValues(alpha: 0.5),
                      ),
                    ),
                  ),
                ],
              ),
            )
                .animate()
                .fadeIn(duration: 400.ms)
                .slideX(begin: -0.1),

            const SizedBox(height: 20),

            // Статистика
            if (auth.isTrainer || auth.isSuperadmin) ...[
              _buildStatsSection(context, auth, data),
            ],

            // Ученик — информация о подписке
            if (auth.isStudent) _buildStudentInfo(context, auth, data),

            const SizedBox(height: 16),

            // Последние новости
            _buildNewsSection(context, data, auth),

            const SizedBox(height: 16),

            // Предстоящие турниры
            _buildUpcomingTournaments(context, data),

            // Ожидающие заявки (суперадмин)
            if (auth.isSuperadmin && data.pendingRegistrations.isNotEmpty)
              _buildPendingRegistrations(context, data),
          ],
        ),
      ),
    );
  }

  String _roleLabel(UserRole role) {
    switch (role) {
      case UserRole.superadmin:
        return 'Администратор';
      case UserRole.trainer:
        return 'Тренер';
      case UserRole.student:
        return 'Ученик';
    }
  }

  /// Секция статистики для тренера
  Widget _buildStatsSection(
      BuildContext context, AuthProvider auth, DataProvider data) {
    final userId = auth.userId!;
    final myStudents = auth.isSuperadmin
        ? data.students
        : data.studentsForTrainer(userId);
    final myGroups = auth.isSuperadmin
        ? data.groups
        : data.groupsForTrainer(userId);

    final activeSubscriptions =
        myStudents.where((s) => s.isSubscriptionActive).length;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Expanded(
            child: _StatCard(
              icon: LucideIcons.users,
              label: 'Учеников',
              value: '${myStudents.length}',
              color: LiquidGlassColors.primary,
              delay: 0,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _StatCard(
              icon: LucideIcons.userCheck,
              label: 'Подписки',
              value: '$activeSubscriptions',
              color: LiquidGlassColors.success,
              delay: 100,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _StatCard(
              icon: LucideIcons.layers,
              label: 'Группы',
              value: '${myGroups.length}',
              color: LiquidGlassColors.purple,
              delay: 200,
            ),
          ),
        ],
      ),
    );
  }

  /// Информация об ученике
  Widget _buildStudentInfo(
      BuildContext context, AuthProvider auth, DataProvider data) {
    final student = auth.studentId != null
        ? data.findStudent(auth.studentId!)
        : null;
    if (student == null) return const SizedBox.shrink();

    final isActive = student.isSubscriptionActive;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GlassCard(
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isActive
                    ? LiquidGlassColors.success.withValues(alpha: 0.15)
                    : LiquidGlassColors.danger.withValues(alpha: 0.15),
              ),
              child: Icon(
                isActive ? LucideIcons.checkCircle : LucideIcons.alertCircle,
                color:
                    isActive ? LiquidGlassColors.success : LiquidGlassColors.danger,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isActive ? 'Подписка активна' : 'Подписка истекла',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  if (student.subscriptionExpiresAt != null)
                    Text(
                      isActive
                          ? 'до ${date_utils.formatDate(student.subscriptionExpiresAt)}'
                          : 'Обратитесь к тренеру',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                ],
              ),
            ),
          ],
        ),
      ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1),
    );
  }

  /// Секция новостей
  Widget _buildNewsSection(
      BuildContext context, DataProvider data, AuthProvider auth) {
    final myNews = data.news.take(3).toList();
    if (myNews.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Новости',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          ...myNews.asMap().entries.map((entry) {
            final news = entry.value;
            final index = entry.key;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: GlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      news.title,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    if (news.content.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        news.content,
                        style: Theme.of(context).textTheme.bodySmall,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 4),
                    Text(
                      date_utils.relativeDate(news.date),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            fontSize: 12,
                          ),
                    ),
                  ],
                ),
              )
                  .animate()
                  .fadeIn(delay: Duration(milliseconds: 200 + index * 100))
                  .slideX(begin: 0.1),
            );
          }),
        ],
      ),
    );
  }

  /// Предстоящие турниры
  Widget _buildUpcomingTournaments(
      BuildContext context, DataProvider data) {
    final upcoming = data.tournaments
        .where((t) => date_utils.daysUntil(t.date) >= 0)
        .take(3)
        .toList();
    if (upcoming.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Ближайшие турниры',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          ...upcoming.asMap().entries.map((entry) {
            final tournament = entry.value;
            final index = entry.key;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: GlassCard(
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        color:
                            LiquidGlassColors.warning.withValues(alpha: 0.15),
                      ),
                      child: const Icon(
                        LucideIcons.trophy,
                        color: LiquidGlassColors.warning,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            tournament.title,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          Text(
                            '${date_utils.formatDate(tournament.date)} ${tournament.location ?? ''}',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              )
                  .animate()
                  .fadeIn(delay: Duration(milliseconds: 300 + index * 100))
                  .slideX(begin: 0.1),
            );
          }),
        ],
      ),
    );
  }

  /// Ожидающие заявки (суперадмин)
  Widget _buildPendingRegistrations(
      BuildContext context, DataProvider data) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: GlassCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  LucideIcons.userPlus,
                  size: 20,
                  color: LiquidGlassColors.warning,
                ),
                const SizedBox(width: 8),
                Text(
                  'Ожидают одобрения: ${data.pendingRegistrations.length}',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ],
            ),
          ],
        ),
      ).animate().fadeIn(delay: 500.ms).slideY(begin: 0.1),
    );
  }
}

/// Карточка статистики
class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  final int delay;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
    required this.delay,
  });

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: color.withValues(alpha: 0.15),
            ),
            child: Icon(icon, size: 18, color: color),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: Duration(milliseconds: delay), duration: 400.ms)
        .slideY(begin: 0.2);
  }
}
