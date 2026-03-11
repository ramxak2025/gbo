/// Экран деталей ученика
///
/// Полная информация об ученике: профиль, подписка,
/// группа, статистика посещаемости, действия.
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
import '../widgets/page_header.dart';
import '../widgets/glass_button.dart';
import '../widgets/glass_modal.dart';
import '../utils/date_utils.dart' as date_utils;

/// Экран деталей ученика
class StudentDetailScreen extends StatelessWidget {
  final String studentId;

  const StudentDetailScreen({super.key, required this.studentId});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;
    final auth = context.watch<AuthProvider>();
    final data = context.watch<DataProvider>();
    final student = data.findStudent(studentId);

    if (student == null) {
      return Scaffold(
        body: Container(
          decoration: BoxDecoration(
            gradient: LiquidGlassColors.backgroundGradient(isDark: isDark),
          ),
          child: SafeArea(
            child: Column(
              children: [
                const PageHeader(title: 'Ученик', showBack: true),
                const Expanded(
                  child: Center(child: Text('Ученик не найден')),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final group =
        student.groupId != null ? data.findGroup(student.groupId!) : null;
    final isTrainer = auth.isTrainer || auth.isSuperadmin;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LiquidGlassColors.backgroundGradient(isDark: isDark),
        ),
        child: SafeArea(
          child: Column(
            children: [
              PageHeader(
                title: student.name,
                showBack: true,
                actions: isTrainer
                    ? [
                        GestureDetector(
                          onTap: () => _showEditModal(context, data),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: LiquidGlassColors.primary
                                  .withValues(alpha: 0.15),
                            ),
                            child: const Icon(
                              LucideIcons.edit,
                              color: LiquidGlassColors.primary,
                              size: 18,
                            ),
                          ),
                        ),
                      ]
                    : null,
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                  children: [
                    // Аватар и имя
                    Center(
                      child: Column(
                        children: [
                          AvatarWidget(
                            name: student.name,
                            imageUrl: student.avatar,
                            size: 80,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            student.name,
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          Text(
                            student.phone,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    )
                        .animate()
                        .fadeIn(duration: 400.ms)
                        .slideY(begin: 0.1),

                    const SizedBox(height: 20),

                    // Подписка
                    GlassCard(
                      child: Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: student.isSubscriptionActive
                                  ? LiquidGlassColors.success
                                      .withValues(alpha: 0.15)
                                  : LiquidGlassColors.danger
                                      .withValues(alpha: 0.15),
                            ),
                            child: Icon(
                              student.isSubscriptionActive
                                  ? LucideIcons.checkCircle
                                  : LucideIcons.xCircle,
                              color: student.isSubscriptionActive
                                  ? LiquidGlassColors.success
                                  : LiquidGlassColors.danger,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Подписка',
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleMedium,
                                ),
                                Text(
                                  student.isSubscriptionActive
                                      ? 'Активна до ${date_utils.formatDate(student.subscriptionExpiresAt)}'
                                      : 'Не активна',
                                  style:
                                      Theme.of(context).textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ).animate().fadeIn(delay: 100.ms).slideX(begin: 0.05),

                    const SizedBox(height: 8),

                    // Информация
                    GlassCard(
                      child: Column(
                        children: [
                          if (group != null)
                            _InfoRow(
                              icon: LucideIcons.layers,
                              label: 'Группа',
                              value: group.name,
                            ),
                          if (student.belt != null && student.belt!.isNotEmpty)
                            _InfoRow(
                              icon: LucideIcons.award,
                              label: 'Пояс',
                              value: student.belt!,
                            ),
                          if (student.weight != null)
                            _InfoRow(
                              icon: LucideIcons.scale,
                              label: 'Вес',
                              value: '${student.weight} кг',
                            ),
                          if (student.birthDate != null)
                            _InfoRow(
                              icon: LucideIcons.cake,
                              label: 'Дата рождения',
                              value: date_utils.formatDate(
                                  student.birthDate),
                            ),
                          if (student.trainingStartDate != null)
                            _InfoRow(
                              icon: LucideIcons.calendar,
                              label: 'Начало тренировок',
                              value: date_utils.formatDate(
                                  student.trainingStartDate),
                            ),
                        ],
                      ),
                    ).animate().fadeIn(delay: 200.ms).slideX(begin: 0.05),

                    // Кнопка удаления (для тренера)
                    if (isTrainer) ...[
                      const SizedBox(height: 20),
                      GlassButton(
                        label: 'Удалить ученика',
                        icon: LucideIcons.trash2,
                        style: GlassButtonStyle.danger,
                        onTap: () => _confirmDelete(context, data),
                      ).animate().fadeIn(delay: 300.ms),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Модалка редактирования
  void _showEditModal(BuildContext context, DataProvider data) {
    final student = data.findStudent(studentId);
    if (student == null) return;

    final nameController = TextEditingController(text: student.name);
    final phoneController = TextEditingController(text: student.phone);
    final weightController =
        TextEditingController(text: student.weight?.toString() ?? '');
    final beltController =
        TextEditingController(text: student.belt ?? '');

    showGlassModal(
      context: context,
      title: 'Редактировать',
      child: Column(
        children: [
          TextField(
            controller: nameController,
            decoration: const InputDecoration(hintText: 'Имя'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: phoneController,
            decoration: const InputDecoration(hintText: 'Телефон'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: weightController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(hintText: 'Вес (кг)'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: beltController,
            decoration: const InputDecoration(hintText: 'Пояс'),
          ),
          const SizedBox(height: 20),
          GlassButton(
            label: 'Сохранить',
            onTap: () async {
              await data.updateStudent(studentId, {
                'name': nameController.text,
                'phone': phoneController.text,
                'weight': double.tryParse(weightController.text),
                'belt': beltController.text,
              });
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
        ],
      ),
    );
  }

  /// Подтверждение удаления
  void _confirmDelete(BuildContext context, DataProvider data) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Удалить ученика?'),
        content: const Text('Это действие нельзя отменить.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Отмена'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: TextButton.styleFrom(
              foregroundColor: LiquidGlassColors.danger,
            ),
            child: const Text('Удалить'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      await data.deleteStudent(studentId);
      if (context.mounted) Navigator.of(context).pop();
    }
  }
}

/// Строка информации
class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 18, color: LiquidGlassColors.primary),
          const SizedBox(width: 10),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const Spacer(),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}
