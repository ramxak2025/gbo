import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/data_provider.dart';
import '../providers/theme_provider.dart';
import '../theme/app_theme.dart';
import '../models/models.dart';
import '../widgets/glass_card.dart';
import '../widgets/avatar_widget.dart';
import '../widgets/page_header.dart';
import '../widgets/section_title.dart';
import '../utils/sports.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final data = context.watch<DataProvider>();
    final tp = context.watch<ThemeProvider>();
    final t = tp.theme;
    final isDark = tp.isDark;

    // Find user data
    dynamic user;
    if (auth.role == 'student') {
      user = data.students.cast<Student?>().firstWhere((s) => s?.id == auth.studentId, orElse: () => null);
    } else {
      user = data.users.cast<User?>().firstWhere((u) => u?.id == auth.userId, orElse: () => null);
    }

    final userName = auth.role == 'student'
        ? (user as Student?)?.name ?? '—'
        : (user as User?)?.name ?? '—';
    final userAvatar = auth.role == 'student'
        ? (user as Student?)?.avatar
        : (user as User?)?.avatar;

    String roleLabel;
    switch (auth.role) {
      case 'superadmin':
        roleLabel = 'Администратор';
        break;
      case 'trainer':
        roleLabel = 'Тренер';
        break;
      default:
        roleLabel = 'Спортсмен';
    }

    // Trainer stats
    int? trainerStudents, trainerActive, trainerGroups;
    if (auth.role == 'trainer') {
      final myStudents = data.students.where((s) => s.trainerId == auth.userId).toList();
      trainerStudents = myStudents.length;
      trainerActive = myStudents.where((s) => !s.isExpired).length;
      trainerGroups = data.groups.where((g) => g.trainerId == auth.userId).length;
    }

    return Scaffold(
      backgroundColor: t.bg,
      body: Stack(
        children: [
          Positioned(top: -80, right: -40, child: _blob(AppColors.purple, 200)),

          SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                const PageHeader(title: 'Профиль'),

                // User card
                GlassCard(
                  child: Column(
                    children: [
                      // Gradient ring around avatar
                      Container(
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            colors: [AppColors.accent, AppColors.purple, AppColors.blue],
                          ),
                        ),
                        child: Container(
                          padding: const EdgeInsets.all(2),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isDark ? AppColors.darkBg : AppColors.lightBg,
                          ),
                          child: AvatarWidget(name: userName, src: userAvatar, size: 80),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(userName, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: t.text)),
                      const SizedBox(height: 4),
                      Text(roleLabel, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: t.accent)),
                    ],
                  ),
                ),

                // Trainer stats
                if (auth.role == 'trainer' && trainerStudents != null)
                  GlassCard(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _ProfileStat(value: trainerStudents.toString(), label: 'Учеников', color: t.accent),
                        Container(width: 1, height: 30, color: t.cardBorder),
                        _ProfileStat(value: trainerActive.toString(), label: 'Активных', color: t.green),
                        Container(width: 1, height: 30, color: t.cardBorder),
                        _ProfileStat(value: trainerGroups.toString(), label: 'Групп', color: AppColors.blue),
                      ],
                    ),
                  ),

                // Info card
                GlassCard(
                  child: Column(
                    children: [
                      if (auth.role == 'trainer' && user is User) ...[
                        if (user.phone.isNotEmpty) _InfoRow(icon: Icons.phone_outlined, text: user.phone, t: t),
                        if (user.clubName != null) _InfoRow(icon: Icons.business_outlined, text: user.clubName!, t: t),
                        if (user.sportType != null) _InfoRow(icon: Icons.fitness_center_outlined, text: getSportLabel(user.sportType), t: t),
                        if (user.city != null) _InfoRow(icon: Icons.location_on_outlined, text: user.city!, t: t),
                      ],
                      if (auth.role == 'student' && user is Student) ...[
                        if (user.phone != null) _InfoRow(icon: Icons.phone_outlined, text: user.phone!, t: t),
                        if (user.belt != null) _InfoRow(icon: Icons.military_tech_outlined, text: user.belt!, t: t),
                        if (user.weight != null) _InfoRow(icon: Icons.monitor_weight_outlined, text: '${user.weight} кг', t: t),
                      ],
                    ],
                  ),
                ),

                // Theme toggle
                GlassCard(
                  onTap: () => tp.toggle(),
                  child: Row(
                    children: [
                      Icon(
                        isDark ? Icons.wb_sunny_outlined : Icons.nightlight_round,
                        size: 18,
                        color: t.textMuted,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          isDark ? 'Светлая тема' : 'Тёмная тема',
                          style: TextStyle(fontSize: 14, color: t.text),
                        ),
                      ),
                      Icon(Icons.chevron_right, size: 16, color: t.textMuted),
                    ],
                  ),
                ),

                // Student: Group & subscription
                if (auth.role == 'student' && user is Student) ...[
                  _StudentGroupCard(student: user, data: data, t: t),
                  _StudentSubscriptionCard(student: user, t: t),
                ],

                const SizedBox(height: 16),

                // Logout
                GestureDetector(
                  onTap: () => _confirmLogout(context, auth),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(14),
                      color: AppColors.red.withOpacity(0.1),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.logout, size: 18, color: AppColors.red),
                        const SizedBox(width: 8),
                        const Text('Выйти', style: TextStyle(color: AppColors.red, fontWeight: FontWeight.w700, fontSize: 15)),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 120),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _blob(Color color, double size) => Container(
    width: size, height: size,
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      gradient: RadialGradient(colors: [color.withOpacity(0.12), Colors.transparent]),
    ),
  );

  void _confirmLogout(BuildContext context, AuthProvider auth) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Выход'),
        content: const Text('Вы уверены, что хотите выйти?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Отмена')),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              auth.logout();
            },
            child: const Text('Выйти', style: TextStyle(color: AppColors.red)),
          ),
        ],
      ),
    );
  }
}

class _ProfileStat extends StatelessWidget {
  final String value;
  final String label;
  final Color color;

  const _ProfileStat({required this.value, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: color)),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: color.withOpacity(0.7))),
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  final dynamic t;

  const _InfoRow({required this.icon, required this.text, required this.t});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 18, color: t.textMuted),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: TextStyle(fontSize: 14, color: t.text))),
        ],
      ),
    );
  }
}

class _StudentGroupCard extends StatelessWidget {
  final Student student;
  final DataProvider data;
  final dynamic t;

  const _StudentGroupCard({required this.student, required this.data, required this.t});

  @override
  Widget build(BuildContext context) {
    final group = student.groupId != null
        ? data.groups.cast<Group?>().firstWhere((g) => g?.id == student.groupId, orElse: () => null)
        : null;
    final trainer = student.trainerId != null
        ? data.users.cast<User?>().firstWhere((u) => u?.id == student.trainerId, orElse: () => null)
        : null;

    if (group == null) return const SizedBox.shrink();

    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.groups_outlined, size: 18, color: t.textMuted),
              const SizedBox(width: 8),
              Text(group.name, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: t.text)),
            ],
          ),
          if (group.schedule != null)
            Padding(
              padding: const EdgeInsets.only(top: 4, left: 26),
              child: Text(group.schedule!, style: TextStyle(fontSize: 12, color: t.textMuted)),
            ),
          if (trainer != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Row(
                children: [
                  AvatarWidget(name: trainer.name, src: trainer.avatar, size: 28),
                  const SizedBox(width: 8),
                  Text('Тренер: ${trainer.name}', style: TextStyle(fontSize: 13, color: t.textSecondary)),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _StudentSubscriptionCard extends StatelessWidget {
  final Student student;
  final dynamic t;

  const _StudentSubscriptionCard({required this.student, required this.t});

  @override
  Widget build(BuildContext context) {
    final expired = student.isExpired;
    return GlassCard(
      child: Row(
        children: [
          Icon(
            expired ? Icons.error_outline : Icons.check_circle,
            size: 18,
            color: expired ? AppColors.red : AppColors.green,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              expired ? 'Абонемент истёк' : 'Абонемент активен',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: t.text),
            ),
          ),
        ],
      ),
    );
  }
}
