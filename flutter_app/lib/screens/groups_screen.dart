/// Экран групп
///
/// Список тренировочных групп тренера.
/// Позволяет создавать, редактировать, удалять группы.
/// Доступен только тренерам.
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
import '../widgets/glass_button.dart';
import '../widgets/glass_modal.dart';
import '../widgets/page_header.dart';
import '../utils/sports.dart';

/// Экран управления группами
class GroupsScreen extends StatelessWidget {
  const GroupsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;
    final auth = context.watch<AuthProvider>();
    final data = context.watch<DataProvider>();
    final groups = data.groupsForTrainer(auth.userId!);

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LiquidGlassColors.backgroundGradient(isDark: isDark),
        ),
        child: SafeArea(
          child: Column(
            children: [
              PageHeader(
                title: 'Группы',
                showBack: true,
                actions: [
                  GestureDetector(
                    onTap: () => _showAddGroup(context),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color:
                            LiquidGlassColors.primary.withValues(alpha: 0.15),
                      ),
                      child: const Icon(
                        LucideIcons.plus,
                        color: LiquidGlassColors.primary,
                        size: 20,
                      ),
                    ),
                  ),
                ],
              ),
              Expanded(
                child: groups.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              LucideIcons.layers,
                              size: 48,
                              color: Colors.grey.withValues(alpha: 0.3),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Нет групп',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                        itemCount: groups.length,
                        itemBuilder: (context, index) {
                          final group = groups[index];
                          final students = data.studentsInGroup(group.id);

                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: GlassCard(
                              child: Column(
                                crossAxisAlignment:
                                    CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        width: 44,
                                        height: 44,
                                        decoration: BoxDecoration(
                                          borderRadius:
                                              BorderRadius.circular(12),
                                          color: LiquidGlassColors.purple
                                              .withValues(alpha: 0.15),
                                        ),
                                        child: const Icon(
                                          LucideIcons.layers,
                                          color: LiquidGlassColors.purple,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              group.name,
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .titleMedium,
                                            ),
                                            Text(
                                              '${students.length} учеников',
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall,
                                            ),
                                          ],
                                        ),
                                      ),
                                      // Действия
                                      PopupMenuButton<String>(
                                        onSelected: (action) {
                                          if (action == 'delete') {
                                            _confirmDelete(
                                                context, data, group.id);
                                          }
                                        },
                                        itemBuilder: (_) => [
                                          const PopupMenuItem<String>(
                                            value: 'delete',
                                            child: Text('Удалить'),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                  if (group.schedule.isNotEmpty) ...[
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        Icon(
                                          LucideIcons.clock,
                                          size: 14,
                                          color: Theme.of(context)
                                              .textTheme
                                              .bodySmall
                                              ?.color,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          group.schedule,
                                          style: Theme.of(context)
                                              .textTheme
                                              .bodySmall,
                                        ),
                                      ],
                                    ),
                                  ],
                                  if (group.subscriptionCost > 0) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      '${group.subscriptionCost} \u20BD/мес',
                                      style: TextStyle(
                                        color: LiquidGlassColors.success,
                                        fontSize: 13,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                  if (group.sportType != null)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 4),
                                      child: Text(
                                        sportName(group.sportType),
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodySmall,
                                      ),
                                    ),
                                ],
                              ),
                            )
                                .animate()
                                .fadeIn(
                                    delay:
                                        Duration(milliseconds: index * 80))
                                .slideX(begin: 0.05),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showAddGroup(BuildContext context) {
    final nameController = TextEditingController();
    final scheduleController = TextEditingController();
    final costController = TextEditingController();

    showGlassModal(
      context: context,
      title: 'Новая группа',
      child: Column(
        children: [
          TextField(
            controller: nameController,
            decoration: const InputDecoration(hintText: 'Название группы'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: scheduleController,
            decoration:
                const InputDecoration(hintText: 'Расписание'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: costController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              hintText: 'Стоимость подписки (руб/мес)',
            ),
          ),
          const SizedBox(height: 20),
          GlassButton(
            label: 'Создать',
            onTap: () async {
              if (nameController.text.trim().isEmpty) return;
              await context.read<DataProvider>().addGroup({
                'name': nameController.text.trim(),
                'schedule': scheduleController.text.trim(),
                'subscriptionCost':
                    int.tryParse(costController.text) ?? 0,
              });
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
        ],
      ),
    );
  }

  void _confirmDelete(
      BuildContext context, DataProvider data, String groupId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Удалить группу?'),
        content: const Text(
            'Ученики группы не будут удалены, но останутся без группы.'),
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
      await data.deleteGroup(groupId);
    }
  }
}
