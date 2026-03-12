import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/data_provider.dart';
import '../providers/theme_provider.dart';
import '../theme/app_theme.dart';
import '../models/models.dart';
import '../widgets/glass_card.dart';
import '../widgets/avatar_widget.dart';
import '../widgets/page_header.dart';
import '../widgets/stat_card.dart';
import '../widgets/section_title.dart';
import '../utils/sports.dart';

String _formatDate(String? iso) {
  if (iso == null) return '—';
  try {
    return DateFormat('d MMM', 'ru').format(DateTime.parse(iso));
  } catch (_) {
    return '—';
  }
}

bool _isExpired(String? dateStr) {
  if (dateStr == null) return true;
  return DateTime.parse(dateStr).isBefore(DateTime.now());
}

int _daysUntil(String? dateStr) {
  if (dateStr == null) return 0;
  final diff = DateTime.parse(dateStr).difference(DateTime.now()).inDays;
  return diff < 0 ? 0 : diff;
}

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final data = context.watch<DataProvider>();
    final tp = context.watch<ThemeProvider>();

    if (data.isLoading) {
      return Scaffold(
        backgroundColor: tp.theme.bg,
        body: Center(
          child: CircularProgressIndicator(color: tp.theme.accent),
        ),
      );
    }

    if (auth.role == 'superadmin') {
      return _SuperAdminDash(data: data, tp: tp);
    }
    if (auth.role == 'trainer') {
      return _TrainerDash(auth: auth, data: data, tp: tp);
    }
    return _StudentDash(auth: auth, data: data, tp: tp);
  }
}

// ===================== TRAINER DASHBOARD =====================
class _TrainerDash extends StatelessWidget {
  final AuthProvider auth;
  final DataProvider data;
  final ThemeProvider tp;

  const _TrainerDash({required this.auth, required this.data, required this.tp});

  @override
  Widget build(BuildContext context) {
    final t = tp.theme;
    final isDark = tp.isDark;

    final myStudents = data.students.where((s) => s.trainerId == auth.userId).toList();
    final myGroups = data.groups.where((g) => g.trainerId == auth.userId).toList();

    final now = DateTime.now();
    final monthTx = data.transactions.where((tx) {
      if (tx.date == null) return false;
      final d = DateTime.parse(tx.date!);
      return d.month == now.month && d.year == now.year;
    }).toList();

    final income = monthTx.where((tx) => tx.type == 'income').fold(0.0, (s, tx) => s + tx.amount);
    final expense = monthTx.where((tx) => tx.type == 'expense').fold(0.0, (s, tx) => s + tx.amount);
    final expired = myStudents.where((s) => _isExpired(s.subscriptionExpiresAt)).length;
    final active = myStudents.length - expired;
    final sick = myStudents.where((s) => s.status == 'sick' || s.status == 'injury').length;

    final upcomingTournaments = data.tournaments
        .where((t) => t.date != null && DateTime.parse(t.date!).isAfter(DateTime.now()))
        .toList()
      ..sort((a, b) => DateTime.parse(a.date!).compareTo(DateTime.parse(b.date!)));

    final recentNews = data.news.take(3).toList();

    // Students needing attention (expiring soon or sick/injured)
    final alertStudents = myStudents.where((s) {
      if (s.status == 'sick' || s.status == 'injury') return true;
      if (s.subscriptionExpiresAt != null) {
        final days = _daysUntil(s.subscriptionExpiresAt);
        return days <= 3 && days >= 0;
      }
      return false;
    }).toList();

    return Scaffold(
      backgroundColor: t.bg,
      body: Stack(
        children: [
          // Background blobs
          Positioned(top: -80, right: -60, child: _Blob(color: AppColors.purple, size: 200)),
          Positioned(bottom: 100, left: -80, child: _Blob(color: AppColors.red, size: 180)),

          RefreshIndicator(
            color: t.accent,
            onRefresh: () => data.reload(),
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const PageHeader(title: 'Главная'),

                        // Stats grid
                        Row(
                          children: [
                            Expanded(
                              child: StatCard(
                                icon: Icons.people,
                                value: myStudents.length.toString(),
                                label: 'Всего',
                                gradientColors: const [AppColors.accent, AppColors.rose],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: StatCard(
                                icon: Icons.check_circle,
                                value: active.toString(),
                                label: 'Активных',
                                gradientColors: const [AppColors.green, Color(0xFF10B981)],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: StatCard(
                                icon: Icons.warning_amber_rounded,
                                value: expired.toString(),
                                label: 'Просрочено',
                                gradientColors: const [AppColors.red, AppColors.orange],
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 16),

                        // Finance card
                        GlassCard(
                          onTap: () => _navigateToTab(context, 3), // Cash tab
                          child: Column(
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceAround,
                                children: [
                                  Row(
                                    children: [
                                      Icon(Icons.trending_up, size: 18, color: t.green),
                                      const SizedBox(width: 6),
                                      Text(
                                        '+${NumberFormat('#,###', 'ru').format(income)}',
                                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: t.green),
                                      ),
                                    ],
                                  ),
                                  Row(
                                    children: [
                                      Icon(Icons.trending_down, size: 18, color: t.red),
                                      const SizedBox(width: 6),
                                      Text(
                                        '-${NumberFormat('#,###', 'ru').format(expense)}',
                                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: t.red),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                'Финансы за месяц',
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: t.textMuted),
                              ),
                            ],
                          ),
                        ),

                        // Alerts
                        if (alertStudents.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          SectionTitle(title: 'Требуют внимания'),
                          ...alertStudents.take(3).map((s) => _AlertStudentCard(student: s, t: t, isDark: isDark)),
                        ],

                        // Groups
                        if (myGroups.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          SectionTitle(title: 'Группы'),
                          ...myGroups.map((g) {
                            final count = myStudents.where((s) => s.groupId == g.id).length;
                            return GlassCard(
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(g.name, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: t.text)),
                                        const SizedBox(height: 2),
                                        Text(g.schedule ?? '—', style: TextStyle(fontSize: 12, color: t.textMuted)),
                                      ],
                                    ),
                                  ),
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.people_outline, size: 14, color: t.textSecondary),
                                      const SizedBox(width: 4),
                                      Text(count.toString(), style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: t.textSecondary)),
                                    ],
                                  ),
                                ],
                              ),
                            );
                          }),
                        ],

                        // Upcoming tournaments
                        if (upcomingTournaments.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          SectionTitle(title: 'Ближайшие турниры'),
                          ...upcomingTournaments.take(3).map((tour) => GlassCard(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(tour.title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: t.text)),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Icon(Icons.calendar_today_outlined, size: 12, color: t.textMuted),
                                    const SizedBox(width: 4),
                                    Text(_formatDate(tour.date), style: TextStyle(fontSize: 12, color: t.textMuted)),
                                    if (tour.location != null) ...[
                                      const SizedBox(width: 8),
                                      Icon(Icons.location_on_outlined, size: 12, color: t.textMuted),
                                      const SizedBox(width: 2),
                                      Expanded(
                                        child: Text(tour.location!, style: TextStyle(fontSize: 12, color: t.textMuted), overflow: TextOverflow.ellipsis),
                                      ),
                                    ],
                                  ],
                                ),
                              ],
                            ),
                          )),
                        ],

                        // Recent news
                        if (recentNews.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          SectionTitle(title: 'Новости'),
                          ...recentNews.map((n) => GlassCard(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(n.title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: t.text)),
                                if (n.content != null) ...[
                                  const SizedBox(height: 4),
                                  Text(n.content!, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: t.textSecondary)),
                                ],
                              ],
                            ),
                          )),
                        ],

                        const SizedBox(height: 120),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ===================== STUDENT DASHBOARD =====================
class _StudentDash extends StatelessWidget {
  final AuthProvider auth;
  final DataProvider data;
  final ThemeProvider tp;

  const _StudentDash({required this.auth, required this.data, required this.tp});

  @override
  Widget build(BuildContext context) {
    final t = tp.theme;
    final isDark = tp.isDark;

    final student = data.students.cast<Student?>().firstWhere(
      (s) => s?.id == auth.studentId,
      orElse: () => null,
    );
    final group = student?.groupId != null
        ? data.groups.cast<Group?>().firstWhere((g) => g?.id == student!.groupId, orElse: () => null)
        : null;
    final trainer = student?.trainerId != null
        ? data.users.cast<User?>().firstWhere((u) => u?.id == student!.trainerId, orElse: () => null)
        : null;

    final upcomingTournaments = data.tournaments
        .where((t) => t.date != null && DateTime.parse(t.date!).isAfter(DateTime.now()))
        .toList()
      ..sort((a, b) => DateTime.parse(a.date!).compareTo(DateTime.parse(b.date!)));

    return Scaffold(
      backgroundColor: t.bg,
      body: Stack(
        children: [
          Positioned(top: -80, right: -60, child: _Blob(color: AppColors.purple, size: 200)),
          Positioned(bottom: 100, left: -80, child: _Blob(color: AppColors.accent, size: 160)),

          RefreshIndicator(
            color: t.accent,
            onRefresh: () => data.reload(),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: [
                  const PageHeader(title: 'Главная'),

                  // Student info card
                  GlassCard(
                    child: Column(
                      children: [
                        AvatarWidget(name: student?.name, src: student?.avatar, size: 72),
                        const SizedBox(height: 8),
                        Text(
                          student?.name ?? '—',
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: t.text),
                        ),
                        if (student?.belt != null) ...[
                          const SizedBox(height: 4),
                          Text(student!.belt!, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: t.accent)),
                        ],
                      ],
                    ),
                  ),

                  // Subscription status
                  if (student != null)
                    GlassCard(
                      child: Row(
                        children: [
                          Icon(
                            _isExpired(student.subscriptionExpiresAt) ? Icons.error_outline : Icons.check_circle,
                            size: 20,
                            color: _isExpired(student.subscriptionExpiresAt) ? t.red : t.green,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _isExpired(student.subscriptionExpiresAt) ? 'Абонемент истёк' : 'Абонемент активен',
                                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: t.text),
                                ),
                                Text(
                                  'до ${_formatDate(student.subscriptionExpiresAt)}',
                                  style: TextStyle(fontSize: 12, color: t.textMuted),
                                ),
                              ],
                            ),
                          ),
                          if (!_isExpired(student.subscriptionExpiresAt))
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(20),
                                color: t.green.withOpacity(0.15),
                              ),
                              child: Text(
                                '${_daysUntil(student.subscriptionExpiresAt)} дн.',
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: t.green),
                              ),
                            ),
                        ],
                      ),
                    ),

                  // Group & trainer
                  if (group != null)
                    GlassCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(group.name, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: t.text)),
                          const SizedBox(height: 2),
                          Text(group.schedule ?? '—', style: TextStyle(fontSize: 12, color: t.textMuted)),
                          if (trainer != null) ...[
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                AvatarWidget(name: trainer.name, src: trainer.avatar, size: 28),
                                const SizedBox(width: 8),
                                Text('Тренер: ${trainer.name}', style: TextStyle(fontSize: 13, color: t.textSecondary)),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),

                  // Upcoming tournaments
                  if (upcomingTournaments.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    SectionTitle(title: 'Ближайшие турниры'),
                    ...upcomingTournaments.take(3).map((tour) => GlassCard(
                      child: Row(
                        children: [
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(14),
                              gradient: LinearGradient(
                                colors: [
                                  AppColors.accent.withOpacity(isDark ? 0.2 : 0.1),
                                  AppColors.orange.withOpacity(isDark ? 0.2 : 0.1),
                                ],
                              ),
                            ),
                            child: Icon(Icons.emoji_events, size: 18, color: t.accent),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(tour.title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: t.text)),
                                const SizedBox(height: 2),
                                Row(
                                  children: [
                                    Icon(Icons.calendar_today_outlined, size: 11, color: t.textMuted),
                                    const SizedBox(width: 4),
                                    Text(_formatDate(tour.date), style: TextStyle(fontSize: 12, color: t.textMuted)),
                                    if (tour.location != null) ...[
                                      Text(' — ${tour.location}', style: TextStyle(fontSize: 12, color: t.textMuted), overflow: TextOverflow.ellipsis),
                                    ],
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    )),
                  ],

                  const SizedBox(height: 120),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ===================== SUPER ADMIN DASHBOARD =====================
class _SuperAdminDash extends StatelessWidget {
  final DataProvider data;
  final ThemeProvider tp;

  const _SuperAdminDash({required this.data, required this.tp});

  @override
  Widget build(BuildContext context) {
    final t = tp.theme;
    final isDark = tp.isDark;

    final trainers = data.users.where((u) => u.role == 'trainer' && u.isDemo != true).toList();
    final allStudents = data.students.where((s) => s.isDemo != true).toList();
    final activeStudents = allStudents.where((s) => !_isExpired(s.subscriptionExpiresAt)).toList();
    final clubs = data.clubs;

    return Scaffold(
      backgroundColor: t.bg,
      body: Stack(
        children: [
          Positioned(top: -80, right: -60, child: _Blob(color: AppColors.purple, size: 200)),
          Positioned(bottom: 100, left: -80, child: _Blob(color: AppColors.red, size: 180)),

          RefreshIndicator(
            color: t.accent,
            onRefresh: () => data.reload(),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const PageHeader(title: 'iBorcuha', logo: true),

                  // Stats
                  Row(
                    children: [
                      Expanded(child: StatCard(
                        icon: Icons.shield,
                        value: trainers.length.toString(),
                        label: 'Тренеры',
                        gradientColors: const [AppColors.blue, AppColors.cyan],
                      )),
                      const SizedBox(width: 8),
                      Expanded(child: StatCard(
                        icon: Icons.people,
                        value: allStudents.length.toString(),
                        label: 'Спортсмены',
                        gradientColors: const [AppColors.accent, AppColors.rose],
                      )),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(child: StatCard(
                        icon: Icons.show_chart,
                        value: activeStudents.length.toString(),
                        label: 'Активных',
                        gradientColors: const [AppColors.green, Color(0xFF10B981)],
                      )),
                      const SizedBox(width: 8),
                      Expanded(child: StatCard(
                        icon: Icons.emoji_events,
                        value: clubs.length.toString(),
                        label: 'Клубы',
                        gradientColors: const [AppColors.purple, Color(0xFF7C3AED)],
                      )),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Clubs
                  if (clubs.isNotEmpty) ...[
                    SectionTitle(title: 'Клубы'),
                    ...clubs.take(3).map((club) {
                      final clubTrainers = data.users.where((u) => u.role == 'trainer' && u.clubId == club.id).toList();
                      final headT = clubTrainers.where((t) => t.isHeadTrainer == true).firstOrNull;
                      final clubStudents = data.students.where((s) => clubTrainers.any((t) => t.id == s.trainerId)).toList();
                      return GlassCard(
                        child: Row(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(16),
                                gradient: LinearGradient(
                                  colors: [
                                    AppColors.blue.withOpacity(isDark ? 0.2 : 0.15),
                                    AppColors.cyan.withOpacity(isDark ? 0.2 : 0.1),
                                  ],
                                ),
                              ),
                              child: Icon(Icons.shield, size: 20, color: isDark ? AppColors.blue : const Color(0xFF2563EB)),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(club.name, style: TextStyle(fontWeight: FontWeight.w700, color: t.text)),
                                  Row(
                                    children: [
                                      if (headT != null) Text(headT.name, style: TextStyle(fontSize: 12, color: t.textMuted)),
                                      if (club.city != null) ...[
                                        Text(' • ', style: TextStyle(color: t.textMuted)),
                                        Icon(Icons.location_on, size: 10, color: t.textMuted),
                                        Text(club.city!, style: TextStyle(fontSize: 12, color: t.textMuted)),
                                      ],
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              children: [
                                Text(clubTrainers.length.toString(), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: t.text)),
                                Text('трен.', style: TextStyle(fontSize: 8, color: t.textMuted)),
                              ],
                            ),
                            const SizedBox(width: 12),
                            Column(
                              children: [
                                Text(clubStudents.length.toString(), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: t.text)),
                                Text('учен.', style: TextStyle(fontSize: 8, color: t.textMuted)),
                              ],
                            ),
                          ],
                        ),
                      );
                    }),
                  ],

                  // Trainers
                  const SizedBox(height: 8),
                  SectionTitle(title: 'Тренеры'),
                  ...trainers.map((trainer) {
                    final count = data.students.where((s) => s.trainerId == trainer.id && s.isDemo != true).length;
                    final activeCount = data.students.where((s) => s.trainerId == trainer.id && s.isDemo != true && !_isExpired(s.subscriptionExpiresAt)).length;
                    return GlassCard(
                      child: Row(
                        children: [
                          AvatarWidget(name: trainer.name, src: trainer.avatar, size: 44),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(trainer.clubName ?? trainer.name, style: TextStyle(fontWeight: FontWeight.w700, color: t.text)),
                                Row(
                                  children: [
                                    Text(trainer.name, style: TextStyle(fontSize: 12, color: t.textMuted)),
                                    if (trainer.city != null) ...[
                                      Text(' • ', style: TextStyle(color: t.textMuted)),
                                      Icon(Icons.location_on, size: 10, color: t.textMuted),
                                      Text(trainer.city!, style: TextStyle(fontSize: 12, color: t.textMuted)),
                                    ],
                                    if (trainer.sportType != null) ...[
                                      Text(' • ', style: TextStyle(color: t.textMuted)),
                                      Text(getSportLabel(trainer.sportType), style: TextStyle(fontSize: 12, color: t.textMuted)),
                                    ],
                                  ],
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(20),
                              color: AppColors.blue.withOpacity(0.15),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.people, size: 11, color: isDark ? AppColors.blue : const Color(0xFF2563EB)),
                                const SizedBox(width: 4),
                                Text(count.toString(), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: isDark ? AppColors.blue : const Color(0xFF2563EB))),
                              ],
                            ),
                          ),
                          if (activeCount > 0) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(20),
                                color: AppColors.green.withOpacity(0.15),
                              ),
                              child: Text(
                                '$activeCount акт.',
                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: isDark ? AppColors.green : const Color(0xFF16A34A)),
                              ),
                            ),
                          ],
                        ],
                      ),
                    );
                  }),

                  const SizedBox(height: 120),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ===================== HELPER WIDGETS =====================
class _Blob extends StatelessWidget {
  final Color color;
  final double size;
  const _Blob({required this.color, required this.size});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          colors: [color.withOpacity(0.15), Colors.transparent],
        ),
      ),
    );
  }
}

class _AlertStudentCard extends StatelessWidget {
  final Student student;
  final dynamic t;
  final bool isDark;

  const _AlertStudentCard({required this.student, required this.t, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final isSick = student.status == 'sick' || student.status == 'injury';
    final isExp = _isExpired(student.subscriptionExpiresAt);

    Color badgeColor;
    IconData badgeIcon;
    String badgeLabel;

    if (student.status == 'sick') {
      badgeColor = AppColors.yellow;
      badgeIcon = Icons.thermostat;
      badgeLabel = 'Болеет';
    } else if (student.status == 'injury') {
      badgeColor = AppColors.red;
      badgeIcon = Icons.heart_broken;
      badgeLabel = 'Травма';
    } else {
      badgeColor = AppColors.orange;
      badgeIcon = Icons.access_time;
      badgeLabel = '${_daysUntil(student.subscriptionExpiresAt)} дн.';
    }

    return GlassCard(
      child: Row(
        children: [
          AvatarWidget(name: student.name, src: student.avatar, size: 36),
          const SizedBox(width: 10),
          Expanded(
            child: Text(student.name, style: TextStyle(fontWeight: FontWeight.w600, color: t.text)),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              color: badgeColor.withOpacity(0.15),
              border: Border.all(color: badgeColor.withOpacity(0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(badgeIcon, size: 12, color: badgeColor),
                const SizedBox(width: 4),
                Text(badgeLabel, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: badgeColor)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

void _navigateToTab(BuildContext context, int index) {
  // This will be handled by the bottom nav
}
