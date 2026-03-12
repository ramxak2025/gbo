/// Профиль — точная копия Profile.jsx мобильной веб-версии
///
/// Hero card с gradient background, аватар с ring эффектом,
/// role badges, trainer stats bar, student info cards,
/// head trainer club management, notifications, logout.
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
import '../utils/sports.dart';
import '../utils/date_utils.dart' as date_utils;
import 'groups_screen.dart';
import 'materials_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;
    final auth = context.watch<AuthProvider>();
    final data = context.watch<DataProvider>();
    final user = auth.currentUser;

    if (user == null) return const SizedBox.shrink();

    final student = auth.isStudent && auth.studentId != null
        ? data.findStudent(auth.studentId!)
        : null;
    final trainer = auth.isStudent && student != null
        ? data.users.where((u) => u.id == student.trainerId).firstOrNull
        : null;
    final displayName = auth.isStudent ? (student?.name ?? user.name) : user.name;

    final myStudents = auth.isTrainer ? data.studentsForTrainer(auth.userId!) : <dynamic>[];
    final myGroups = auth.isTrainer ? data.groupsForTrainer(auth.userId!) : <dynamic>[];
    final activeStudents = myStudents.where((s) => s.isSubscriptionActive).length;

    final group = student?.groupId != null ? data.findGroup(student!.groupId!) : null;
    final expired = student != null ? !student.isSubscriptionActive : false;
    final sportLabel = _getSportLabel(auth.isStudent ? trainer?.sportTypes : user.sportTypes);

    return SafeArea(
      child: ListView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.only(bottom: 120),
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Text('Профиль', style: Theme.of(context).textTheme.headlineMedium),
          ),
          const SizedBox(height: 16),

          // === HERO PROFILE CARD (как в Profile.jsx) ===
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Container(
              clipBehavior: Clip.antiAlias,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(28),
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: isDark
                      ? [
                          LiquidGlassColors.purple.withValues(alpha: 0.20),
                          Colors.white.withValues(alpha: 0.03),
                          LiquidGlassColors.blue500.withValues(alpha: 0.15),
                        ]
                      : [
                          const Color(0xFFF3E8FF).withValues(alpha: 0.8),
                          Colors.white.withValues(alpha: 0.9),
                          const Color(0xFFDBEAFE).withValues(alpha: 0.8),
                        ],
                ),
                border: Border.all(
                  color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.white.withValues(alpha: 0.7),
                ),
                boxShadow: isDark
                    ? null
                    : [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 40, offset: const Offset(0, 8))],
              ),
              child: Stack(
                children: [
                  // Decorative blobs
                  Positioned(
                    top: -40, right: -40,
                    child: Container(
                      width: 100, height: 100,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isDark ? LiquidGlassColors.purple.withValues(alpha: 0.10) : const Color(0xFFE9D5FF).withValues(alpha: 0.4),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: -30, left: -30,
                    child: Container(
                      width: 80, height: 80,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isDark ? LiquidGlassColors.blue500.withValues(alpha: 0.08) : const Color(0xFFDBEAFE).withValues(alpha: 0.5),
                      ),
                    ),
                  ),
                  // Content
                  Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Avatar with ring
                            Container(
                              padding: const EdgeInsets.all(3),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: LinearGradient(
                                  colors: auth.isTrainer
                                      ? [LiquidGlassColors.purple, LiquidGlassColors.blue500, LiquidGlassColors.teal]
                                      : auth.isSuperadmin
                                          ? [LiquidGlassColors.amber500, LiquidGlassColors.warning]
                                          : [LiquidGlassColors.success, const Color(0xFF10B981), LiquidGlassColors.teal],
                                ),
                              ),
                              child: Container(
                                padding: const EdgeInsets.all(2),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: isDark ? const Color(0xFF0A0A12) : Colors.white,
                                ),
                                child: AvatarWidget(name: displayName, imageUrl: auth.isStudent ? student?.avatar : user.avatar, size: 72),
                              ),
                            ),
                            const SizedBox(width: 16),
                            // Info
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SizedBox(height: 4),
                                  Text(
                                    displayName,
                                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 6),
                                  Wrap(
                                    spacing: 6,
                                    runSpacing: 4,
                                    children: [
                                      _RoleBadge(role: auth.role!, isDark: isDark),
                                      if (sportLabel != null)
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: isDark ? LiquidGlassColors.accent.withValues(alpha: 0.15) : const Color(0xFFFEF2F2),
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                          child: Text(
                                            sportLabel,
                                            style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w700,
                                              color: isDark ? LiquidGlassColors.accentLight : LiquidGlassColors.accent,
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  // Club & City
                                  Row(
                                    children: [
                                      if ((auth.isTrainer ? user.clubName : trainer?.clubName) != null) ...[
                                        Icon(LucideIcons.shield, size: 10, color: isDark ? Colors.white.withValues(alpha: 0.35) : Colors.grey[400]),
                                        const SizedBox(width: 3),
                                        Flexible(
                                          child: Text(
                                            (auth.isTrainer ? user.clubName : trainer?.clubName) ?? '',
                                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: isDark ? Colors.white.withValues(alpha: 0.35) : Colors.grey[400]),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                      ],
                                      if ((auth.isTrainer ? user.city : trainer?.city) != null) ...[
                                        Icon(LucideIcons.mapPin, size: 10, color: isDark ? Colors.white.withValues(alpha: 0.35) : Colors.grey[400]),
                                        const SizedBox(width: 3),
                                        Text(
                                          (auth.isTrainer ? user.city : trainer?.city) ?? '',
                                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: isDark ? Colors.white.withValues(alpha: 0.35) : Colors.grey[400]),
                                        ),
                                      ],
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),

                        // Trainer stats bar
                        if (auth.isTrainer) ...[
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(18),
                              color: isDark ? Colors.black.withValues(alpha: 0.3) : Colors.white.withValues(alpha: 0.5),
                            ),
                            child: Row(
                              children: [
                                _QuickStat(icon: LucideIcons.users, value: '${myStudents.length}', label: 'Учеников', color: LiquidGlassColors.blue500, isDark: isDark),
                                _QuickStat(icon: LucideIcons.zap, value: '$activeStudents', label: 'Активных', color: LiquidGlassColors.success, isDark: isDark),
                                _QuickStat(icon: LucideIcons.dumbbell, value: '${myGroups.length}', label: 'Групп', color: LiquidGlassColors.purple, isDark: isDark),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.05),
          ),

          const SizedBox(height: 16),

          // === STUDENT INFO CARDS ===
          if (auth.isStudent && student != null) ...[
            // Grid: Group + Subscription
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Expanded(
                    child: _InfoTile(
                      label: 'Группа',
                      icon: LucideIcons.users,
                      iconColor: LiquidGlassColors.purple,
                      value: group?.name ?? 'Без группы',
                      isDark: isDark,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _InfoTile(
                      label: 'Абонемент',
                      icon: LucideIcons.creditCard,
                      iconColor: expired ? LiquidGlassColors.danger : LiquidGlassColors.success,
                      value: expired ? 'Истёк' : date_utils.formatDate(student.subscriptionExpiresAt),
                      isDark: isDark,
                      valueColor: expired ? LiquidGlassColors.danger : null,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 8),

            // Detail list: belt, weight, birthday, training start
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white.withValues(alpha: 0.7),
                  border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.07) : Colors.white.withValues(alpha: 0.6)),
                  boxShadow: isDark ? null : [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 12, offset: const Offset(0, 2))],
                ),
                child: Column(
                  children: [
                    _DetailRow(icon: LucideIcons.award, label: 'Пояс', value: student.belt ?? '—', color: LiquidGlassColors.accent, isDark: isDark, showBorder: false),
                    _DetailRow(icon: LucideIcons.scale, label: 'Вес', value: student.weight != null ? '${student.weight} кг' : '—', color: LiquidGlassColors.blue500, isDark: isDark),
                    _DetailRow(icon: LucideIcons.calendar, label: 'Дата рождения', value: date_utils.formatDate(student.birthDate), color: LiquidGlassColors.purple, isDark: isDark),
                    _DetailRow(icon: LucideIcons.dumbbell, label: 'Тренируется с', value: date_utils.formatDate(student.createdAt), color: LiquidGlassColors.success, isDark: isDark),
                  ],
                ),
              ),
            ),

            // Trainer info
            if (trainer != null) ...[
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white.withValues(alpha: 0.7),
                    border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.07) : Colors.white.withValues(alpha: 0.6)),
                  ),
                  child: Row(
                    children: [
                      AvatarWidget(name: trainer.name, imageUrl: trainer.avatar, size: 44),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Мой тренер', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: isDark ? Colors.white.withValues(alpha: 0.3) : Colors.grey[400])),
                            Text(trainer.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ),
                      Icon(LucideIcons.shield, size: 18, color: isDark ? Colors.white.withValues(alpha: 0.15) : Colors.grey[200]),
                    ],
                  ),
                ),
              ),
            ],
          ],

          // Phone
          if (user.phone.isNotEmpty) ...[
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white.withValues(alpha: 0.7),
                  border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.07) : Colors.white.withValues(alpha: 0.6)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 32, height: 32,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(10),
                        color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.black.withValues(alpha: 0.03),
                      ),
                      child: const Icon(LucideIcons.phone, size: 15, color: LiquidGlassColors.accent),
                    ),
                    const SizedBox(width: 12),
                    Text('Телефон', style: TextStyle(fontSize: 14, color: isDark ? Colors.white.withValues(alpha: 0.5) : Colors.grey[500])),
                    const Spacer(),
                    Text(user.phone, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ),
          ],

          const SizedBox(height: 12),

          // === ACTION BUTTONS ===
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                // Notifications
                _ActionButton(
                  icon: LucideIcons.bell,
                  label: 'Уведомления',
                  iconColor: LiquidGlassColors.blue500,
                  isDark: isDark,
                  onTap: () => HapticFeedback.lightImpact(),
                ),
                const SizedBox(height: 8),
                // Theme toggle
                _ActionButton(
                  icon: isDark ? LucideIcons.sun : LucideIcons.moon,
                  label: isDark ? 'Светлая тема' : 'Тёмная тема',
                  iconColor: LiquidGlassColors.warning,
                  isDark: isDark,
                  onTap: () {
                    HapticFeedback.lightImpact();
                    context.read<ThemeProvider>().toggleTheme();
                  },
                ),
                const SizedBox(height: 8),
                // Logout
                _ActionButton(
                  icon: LucideIcons.logOut,
                  label: 'Выйти из аккаунта',
                  iconColor: LiquidGlassColors.danger,
                  isDark: isDark,
                  isDanger: true,
                  onTap: () async {
                    HapticFeedback.mediumImpact();
                    final confirmed = await showDialog<bool>(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Выход'),
                        content: const Text('Вы уверены, что хотите выйти?'),
                        actions: [
                          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Отмена')),
                          TextButton(onPressed: () => Navigator.of(ctx).pop(true), child: const Text('Выйти')),
                        ],
                      ),
                    );
                    if (confirmed == true && context.mounted) {
                      await context.read<AuthProvider>().logout();
                    }
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String? _getSportLabel(List<String>? sportTypes) {
    if (sportTypes == null || sportTypes.isEmpty) return null;
    final sport = findSport(sportTypes.first);
    return sport?.name ?? sportTypes.first;
  }
}

class _RoleBadge extends StatelessWidget {
  final UserRole role;
  final bool isDark;

  const _RoleBadge({required this.role, required this.isDark});

  @override
  Widget build(BuildContext context) {
    Color color;
    String label;
    switch (role) {
      case UserRole.superadmin:
        color = LiquidGlassColors.purple;
        label = 'АДМИН';
      case UserRole.trainer:
        color = LiquidGlassColors.blue500;
        label = 'ТРЕНЕР';
      case UserRole.student:
        color = LiquidGlassColors.green500;
        label = 'СПОРТСМЕН';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: isDark ? 0.20 : 0.10),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.5,
          color: color,
        ),
      ),
    );
  }
}

class _QuickStat extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color color;
  final bool isDark;

  const _QuickStat({required this.icon, required this.value, required this.label, required this.color, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              color: isDark ? color.withValues(alpha: 0.15) : color.withValues(alpha: 0.08),
            ),
            child: Icon(icon, size: 15, color: color),
          ),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
          Text(label, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600, letterSpacing: 0.3, color: isDark ? Colors.white.withValues(alpha: 0.25) : Colors.grey[400])),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color iconColor;
  final String value;
  final bool isDark;
  final Color? valueColor;

  const _InfoTile({required this.label, required this.icon, required this.iconColor, required this.value, required this.isDark, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white.withValues(alpha: 0.7),
        border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.07) : Colors.white.withValues(alpha: 0.6)),
        boxShadow: isDark ? null : [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 12, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: isDark ? Colors.white.withValues(alpha: 0.3) : Colors.grey[400])),
          const SizedBox(height: 6),
          Row(
            children: [
              Icon(icon, size: 16, color: iconColor),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  value,
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: valueColor),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  final bool isDark;
  final bool showBorder;

  const _DetailRow({required this.icon, required this.label, required this.value, required this.color, required this.isDark, this.showBorder = true});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        border: showBorder
            ? Border(top: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.04)))
            : null,
      ),
      child: Row(
        children: [
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.black.withValues(alpha: 0.03),
            ),
            child: Icon(icon, size: 15, color: color),
          ),
          const SizedBox(width: 12),
          Text(label, style: TextStyle(fontSize: 14, color: isDark ? Colors.white.withValues(alpha: 0.5) : Colors.grey[500])),
          const Spacer(),
          Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color iconColor;
  final bool isDark;
  final bool isDanger;
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.iconColor,
    required this.isDark,
    this.isDanger = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          color: isDanger
              ? isDark ? LiquidGlassColors.danger.withValues(alpha: 0.08) : const Color(0xFFFEF2F2).withValues(alpha: 0.7)
              : isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white.withValues(alpha: 0.7),
          border: Border.all(
            color: isDanger
                ? isDark ? LiquidGlassColors.danger.withValues(alpha: 0.15) : const Color(0xFFFECACA)
                : isDark ? Colors.white.withValues(alpha: 0.07) : Colors.white.withValues(alpha: 0.6),
          ),
          boxShadow: isDark ? null : [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 12, offset: const Offset(0, 2))],
        ),
        child: Row(
          children: [
            Container(
              width: 36, height: 36,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                color: isDanger
                    ? isDark ? LiquidGlassColors.danger.withValues(alpha: 0.15) : const Color(0xFFFEE2E2).withValues(alpha: 0.6)
                    : isDark ? iconColor.withValues(alpha: 0.15) : iconColor.withValues(alpha: 0.08),
              ),
              child: Icon(icon, size: 17, color: isDanger ? LiquidGlassColors.danger : iconColor),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: isDanger ? LiquidGlassColors.danger : null,
                ),
              ),
            ),
            if (!isDanger)
              Icon(LucideIcons.chevronRight, size: 16, color: isDark ? Colors.white.withValues(alpha: 0.15) : Colors.grey[300]),
          ],
        ),
      ),
    );
  }
}
