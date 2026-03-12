/// Dashboard — точная копия Dashboard.jsx мобильной веб-версии
///
/// Адаптивный контент по ролям: статистика тренера,
/// подписка ученика, новости, турниры, заявки суперадмина.
/// Haptic feedback, staggered анимации, press-scale.
library;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
import '../utils/date_utils.dart' as date_utils;

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
        onRefresh: () async {
          HapticFeedback.mediumImpact();
          await data.reload();
        },
        color: LiquidGlassColors.accent,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(
            parent: BouncingScrollPhysics(),
          ),
          padding: const EdgeInsets.only(bottom: 120),
          children: [
            // === GREETING HEADER (как в Dashboard.jsx) ===
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
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.w900,
                              ),
                        ),
                        const SizedBox(height: 2),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: _roleColor(auth.role!).withValues(alpha: isDark ? 0.15 : 0.10),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            _roleLabel(auth.role!),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.5,
                              color: _roleColor(auth.role!),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Тема
                  GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      context.read<ThemeProvider>().toggleTheme();
                    },
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.08)
                            : Colors.black.withValues(alpha: 0.04),
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
            ).animate().fadeIn(duration: 350.ms).slideY(begin: -0.05),

            const SizedBox(height: 20),

            // === TRAINER STATS (3 карточки в ряд) ===
            if (auth.isTrainer || auth.isSuperadmin)
              _buildTrainerStats(context, auth, data, isDark),

            // === STUDENT SUBSCRIPTION ===
            if (auth.isStudent)
              _buildStudentSubscription(context, auth, data, isDark),

            const SizedBox(height: 16),

            // === NEWS ===
            _buildNewsSection(context, data, isDark),

            const SizedBox(height: 16),

            // === UPCOMING TOURNAMENTS ===
            _buildTournaments(context, data, isDark),

            // === PENDING REGISTRATIONS (superadmin) ===
            if (auth.isSuperadmin && data.pendingRegistrations.isNotEmpty)
              _buildPendingRegistrations(context, data, isDark),
          ],
        ),
      ),
    );
  }

  String _roleLabel(UserRole role) {
    switch (role) {
      case UserRole.superadmin: return 'АДМИН';
      case UserRole.trainer: return 'ТРЕНЕР';
      case UserRole.student: return 'СПОРТСМЕН';
    }
  }

  Color _roleColor(UserRole role) {
    switch (role) {
      case UserRole.superadmin: return LiquidGlassColors.purple;
      case UserRole.trainer: return LiquidGlassColors.blue500;
      case UserRole.student: return LiquidGlassColors.green500;
    }
  }

  /// Статистика тренера — 3 карточки (как в Dashboard.jsx)
  Widget _buildTrainerStats(BuildContext context, AuthProvider auth, DataProvider data, bool isDark) {
    final userId = auth.userId!;
    final myStudents = auth.isSuperadmin ? data.students : data.studentsForTrainer(userId);
    final myGroups = auth.isSuperadmin ? data.groups : data.groupsForTrainer(userId);
    final active = myStudents.where((s) => s.isSubscriptionActive).length;

    final stats = [
      _StatItem(icon: LucideIcons.users, value: '${myStudents.length}', label: 'Учеников', color: LiquidGlassColors.blue500, bgColor: isDark ? LiquidGlassColors.blue500.withValues(alpha: 0.15) : const Color(0xFFEFF6FF)),
      _StatItem(icon: LucideIcons.zap, value: '$active', label: 'Активных', color: LiquidGlassColors.success, bgColor: isDark ? LiquidGlassColors.success.withValues(alpha: 0.15) : const Color(0xFFF0FDF4)),
      _StatItem(icon: LucideIcons.dumbbell, value: '${myGroups.length}', label: 'Групп', color: LiquidGlassColors.purple, bgColor: isDark ? LiquidGlassColors.purple.withValues(alpha: 0.15) : const Color(0xFFF5F3FF)),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          color: isDark ? Colors.black.withValues(alpha: 0.3) : Colors.white.withValues(alpha: 0.5),
        ),
        child: Row(
          children: stats.asMap().entries.map((entry) {
            final stat = entry.value;
            final i = entry.key;
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(left: i > 0 ? 8 : 0),
                child: Column(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(10),
                        color: stat.bgColor,
                      ),
                      child: Icon(stat.icon, size: 15, color: stat.color),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      stat.value,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: isDark ? Colors.white : Colors.grey[900],
                      ),
                    ),
                    Text(
                      stat.label,
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                        color: isDark ? Colors.white.withValues(alpha: 0.25) : Colors.grey[400],
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: Duration(milliseconds: 100 * i), duration: 400.ms).slideY(begin: 0.2),
            );
          }).toList(),
        ),
      ),
    );
  }

  /// Подписка ученика (как в Dashboard.jsx — student info)
  Widget _buildStudentSubscription(BuildContext context, AuthProvider auth, DataProvider data, bool isDark) {
    final student = auth.studentId != null ? data.findStudent(auth.studentId!) : null;
    if (student == null) return const SizedBox.shrink();

    final isActive = student.isSubscriptionActive;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isActive
                ? isDark
                    ? [LiquidGlassColors.success.withValues(alpha: 0.15), Colors.white.withValues(alpha: 0.03)]
                    : [const Color(0xFFF0FDF4), Colors.white.withValues(alpha: 0.9)]
                : isDark
                    ? [LiquidGlassColors.danger.withValues(alpha: 0.15), Colors.white.withValues(alpha: 0.03)]
                    : [const Color(0xFFFEF2F2), Colors.white.withValues(alpha: 0.9)],
          ),
          border: Border.all(
            color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.white.withValues(alpha: 0.7),
          ),
        ),
        padding: const EdgeInsets.all(16),
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
                color: isActive ? LiquidGlassColors.success : LiquidGlassColors.danger,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isActive ? 'Подписка активна' : 'Подписка истекла',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
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

  /// Новости (как в Dashboard.jsx)
  Widget _buildNewsSection(BuildContext context, DataProvider data, bool isDark) {
    final myNews = data.news.take(3).toList();
    if (myNews.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(LucideIcons.newspaper, size: 14, color: isDark ? Colors.white.withValues(alpha: 0.5) : Colors.grey[500]),
              const SizedBox(width: 6),
              Text(
                'НОВОСТИ',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.5,
                  color: isDark ? Colors.white.withValues(alpha: 0.5) : Colors.grey[500],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ...myNews.asMap().entries.map((entry) {
            final news = entry.value;
            final i = entry.key;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: GlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      news.title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
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
                    const SizedBox(height: 6),
                    Text(
                      date_utils.relativeDate(news.date),
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? Colors.white.withValues(alpha: 0.25) : Colors.grey[400],
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: Duration(milliseconds: 200 + i * 80), duration: 350.ms).slideY(begin: 0.08),
            );
          }),
        ],
      ),
    );
  }

  /// Турниры (как в Dashboard.jsx)
  Widget _buildTournaments(BuildContext context, DataProvider data, bool isDark) {
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
          Row(
            children: [
              Icon(LucideIcons.calendar, size: 14, color: isDark ? Colors.white.withValues(alpha: 0.5) : Colors.grey[500]),
              const SizedBox(width: 6),
              Text(
                'БЛИЖАЙШИЕ ТУРНИРЫ',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.5,
                  color: isDark ? Colors.white.withValues(alpha: 0.5) : Colors.grey[500],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ...upcoming.asMap().entries.map((entry) {
            final tournament = entry.value;
            final i = entry.key;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: GlassCard(
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(14),
                        color: LiquidGlassColors.warning.withValues(alpha: 0.15),
                      ),
                      child: const Icon(
                        LucideIcons.trophy,
                        color: LiquidGlassColors.warning,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            tournament.title,
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              Icon(LucideIcons.calendar, size: 11, color: isDark ? Colors.white.withValues(alpha: 0.35) : Colors.grey[400]),
                              const SizedBox(width: 4),
                              Text(
                                date_utils.formatDate(tournament.date),
                                style: TextStyle(fontSize: 12, color: isDark ? Colors.white.withValues(alpha: 0.4) : Colors.grey[500]),
                              ),
                              if (tournament.location != null && tournament.location!.isNotEmpty) ...[
                                const SizedBox(width: 8),
                                Icon(LucideIcons.mapPin, size: 11, color: isDark ? Colors.white.withValues(alpha: 0.35) : Colors.grey[400]),
                                const SizedBox(width: 2),
                                Flexible(
                                  child: Text(
                                    tournament.location!,
                                    style: TextStyle(fontSize: 12, color: isDark ? Colors.white.withValues(alpha: 0.4) : Colors.grey[500]),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: Duration(milliseconds: 300 + i * 80), duration: 350.ms).slideY(begin: 0.08),
            );
          }),
        ],
      ),
    );
  }

  /// Ожидающие заявки
  Widget _buildPendingRegistrations(BuildContext context, DataProvider data, bool isDark) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isDark
                ? [LiquidGlassColors.warning.withValues(alpha: 0.12), Colors.white.withValues(alpha: 0.03)]
                : [const Color(0xFFFFF7ED), Colors.white.withValues(alpha: 0.9)],
          ),
          border: Border.all(
            color: isDark
                ? LiquidGlassColors.warning.withValues(alpha: 0.15)
                : const Color(0xFFFED7AA).withValues(alpha: 0.5),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                color: LiquidGlassColors.warning.withValues(alpha: 0.15),
              ),
              child: const Icon(LucideIcons.userPlus, size: 20, color: LiquidGlassColors.warning),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Ожидают одобрения',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  Text(
                    '${data.pendingRegistrations.length} заявок',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            Icon(LucideIcons.chevronRight, size: 18, color: isDark ? Colors.white.withValues(alpha: 0.2) : Colors.grey[300]),
          ],
        ),
      ).animate().fadeIn(delay: 500.ms).slideY(begin: 0.1),
    );
  }
}

class _StatItem {
  final IconData icon;
  final String value;
  final String label;
  final Color color;
  final Color bgColor;

  const _StatItem({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
    required this.bgColor,
  });
}
