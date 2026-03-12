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

class StudentDetailScreen extends StatelessWidget {
  final int studentId;

  const StudentDetailScreen({super.key, required this.studentId});

  String _formatDate(String? iso) {
    if (iso == null) return '—';
    try {
      return DateFormat('d MMMM yyyy', 'ru').format(DateTime.parse(iso));
    } catch (_) {
      return '—';
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final data = context.watch<DataProvider>();
    final tp = context.watch<ThemeProvider>();
    final t = tp.theme;
    final isDark = tp.isDark;

    final student = data.students.cast<Student?>().firstWhere((s) => s?.id == studentId, orElse: () => null);
    if (student == null) {
      return Scaffold(
        backgroundColor: t.bg,
        body: Center(child: Text('Ученик не найден', style: TextStyle(color: t.text))),
      );
    }

    final group = student.groupId != null
        ? data.groups.cast<Group?>().firstWhere((g) => g?.id == student.groupId, orElse: () => null)
        : null;

    final expired = student.isExpired;

    return Scaffold(
      backgroundColor: t.bg,
      body: Stack(
        children: [
          Positioned(top: -80, right: -60, child: Container(
            width: 200, height: 200,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(colors: [AppColors.accent.withOpacity(0.12), Colors.transparent]),
            ),
          )),

          SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                PageHeader(title: student.name, showBack: true),

                // Avatar
                GlassCard(
                  child: Column(
                    children: [
                      AvatarWidget(name: student.name, src: student.avatar, size: 80),
                      const SizedBox(height: 10),
                      Text(student.name, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: t.text)),
                      if (student.belt != null) ...[
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(20),
                            color: t.accent.withOpacity(0.15),
                          ),
                          child: Text(student.belt!, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: t.accent)),
                        ),
                      ],
                    ],
                  ),
                ),

                // Info grid
                Row(
                  children: [
                    Expanded(child: _InfoCard(icon: Icons.military_tech, label: 'Пояс', value: student.belt ?? '—', t: t, isDark: isDark)),
                    const SizedBox(width: 8),
                    Expanded(child: _InfoCard(icon: Icons.monitor_weight, label: 'Вес', value: student.weight != null ? '${student.weight} кг' : '—', t: t, isDark: isDark)),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(child: _InfoCard(icon: Icons.cake, label: 'Дата рожд.', value: _formatDate(student.birthDate), t: t, isDark: isDark)),
                    const SizedBox(width: 8),
                    Expanded(child: _InfoCard(icon: Icons.phone, label: 'Телефон', value: student.phone ?? '—', t: t, isDark: isDark)),
                  ],
                ),

                const SizedBox(height: 8),

                // Subscription
                GlassCard(
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          color: (expired ? AppColors.red : AppColors.green).withOpacity(0.15),
                        ),
                        child: Icon(
                          expired ? Icons.error_outline : Icons.check_circle,
                          size: 20,
                          color: expired ? AppColors.red : AppColors.green,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              expired ? 'Абонемент истёк' : 'Абонемент активен',
                              style: TextStyle(fontWeight: FontWeight.w600, color: t.text),
                            ),
                            Text(
                              'до ${_formatDate(student.subscriptionExpiresAt)}',
                              style: TextStyle(fontSize: 12, color: t.textMuted),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Group
                if (group != null)
                  GlassCard(
                    child: Row(
                      children: [
                        Icon(Icons.groups_outlined, size: 18, color: t.textMuted),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(group.name, style: TextStyle(fontWeight: FontWeight.w600, color: t.text)),
                              if (group.schedule != null)
                                Text(group.schedule!, style: TextStyle(fontSize: 12, color: t.textMuted)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                // Training dates
                GlassCard(
                  child: Column(
                    children: [
                      _DateRow(icon: Icons.play_arrow, label: 'Начало тренировок', value: _formatDate(student.trainingStartDate), t: t),
                      const SizedBox(height: 8),
                      _DateRow(icon: Icons.event, label: 'Абонемент до', value: _formatDate(student.subscriptionExpiresAt), t: t),
                    ],
                  ),
                ),

                // Status
                if (student.status != null && student.status!.isNotEmpty)
                  GlassCard(
                    child: Row(
                      children: [
                        Icon(
                          student.status == 'sick' ? Icons.thermostat : student.status == 'injury' ? Icons.heart_broken : Icons.flash_on,
                          size: 18,
                          color: student.status == 'sick' ? AppColors.yellow : student.status == 'injury' ? AppColors.red : AppColors.purple,
                        ),
                        const SizedBox(width: 10),
                        Text(
                          student.status == 'sick' ? 'Болеет' : student.status == 'injury' ? 'Травма' : 'Пропускает',
                          style: TextStyle(fontWeight: FontWeight.w600, color: t.text),
                        ),
                      ],
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
}

class _InfoCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final dynamic t;
  final bool isDark;

  const _InfoCard({required this.icon, required this.label, required this.value, required this.t, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: t.textMuted),
          const SizedBox(height: 6),
          Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: t.text)),
          Text(label, style: TextStyle(fontSize: 10, color: t.textMuted)),
        ],
      ),
    );
  }
}

class _DateRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final dynamic t;

  const _DateRow({required this.icon, required this.label, required this.value, required this.t});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: t.textMuted),
        const SizedBox(width: 8),
        Expanded(child: Text(label, style: TextStyle(fontSize: 13, color: t.textSecondary))),
        Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: t.text)),
      ],
    );
  }
}
