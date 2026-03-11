/// Экран команды
///
/// Список учеников тренера или участников команды.
/// Позволяет искать, фильтровать по группе,
/// переходить к деталям ученика.
library;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/data_provider.dart';
import '../providers/theme_provider.dart';
import '../models/student.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import '../widgets/avatar_widget.dart';
import '../utils/date_utils.dart' as date_utils;
import 'student_detail_screen.dart';
import 'add_student_screen.dart';

/// Экран команды (список учеников)
class TeamScreen extends StatefulWidget {
  const TeamScreen({super.key});

  @override
  State<TeamScreen> createState() => _TeamScreenState();
}

class _TeamScreenState extends State<TeamScreen> {
  String _search = '';
  String? _groupFilter;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final data = context.watch<DataProvider>();
    final userId = auth.userId!;

    final allStudents = auth.isSuperadmin
        ? data.students
        : data.studentsForTrainer(userId);
    final groups = auth.isSuperadmin
        ? data.groups
        : data.groupsForTrainer(userId);

    // Фильтрация
    var filtered = allStudents;
    if (_search.isNotEmpty) {
      final query = _search.toLowerCase();
      filtered = filtered
          .where((s) => s.name.toLowerCase().contains(query))
          .toList();
    }
    if (_groupFilter != null) {
      filtered =
          filtered.where((s) => s.groupId == _groupFilter).toList();
    }

    return SafeArea(
      child: Column(
        children: [
          // Заголовок
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'Команда',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                ),
                if (auth.isTrainer)
                  GestureDetector(
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => const AddStudentScreen(),
                      ),
                    ),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color:
                            LiquidGlassColors.primary.withValues(alpha: 0.15),
                      ),
                      child: const Icon(
                        LucideIcons.userPlus,
                        color: LiquidGlassColors.primary,
                        size: 20,
                      ),
                    ),
                  ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Поиск
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              onChanged: (v) => setState(() => _search = v),
              decoration: InputDecoration(
                hintText: 'Поиск учеников...',
                prefixIcon: Icon(
                  LucideIcons.search,
                  size: 18,
                  color: context.watch<ThemeProvider>().isDark
                      ? Colors.white.withValues(alpha: 0.5)
                      : Colors.black.withValues(alpha: 0.4),
                ),
              ),
            ),
          ),

          // Фильтр по группе
          if (groups.isNotEmpty) ...[
            const SizedBox(height: 8),
            SizedBox(
              height: 36,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  _buildGroupChip(context, 'Все', null),
                  ...groups.map((g) => _buildGroupChip(context, g.name, g.id)),
                ],
              ),
            ),
          ],

          const SizedBox(height: 12),

          // Список учеников
          Expanded(
            child: filtered.isEmpty
                ? Center(
                    child: Text(
                      'Нет учеников',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final student = filtered[index];
                      final group = student.groupId != null
                          ? data.findGroup(student.groupId!)
                          : null;

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: GlassCard(
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) => StudentDetailScreen(
                                studentId: student.id,
                              ),
                            ),
                          ),
                          child: Row(
                            children: [
                              AvatarWidget(
                                name: student.name,
                                imageUrl: student.avatar,
                                size: 44,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      student.name,
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleMedium,
                                    ),
                                    Row(
                                      children: [
                                        if (group != null)
                                          Text(
                                            group.name,
                                            style: Theme.of(context)
                                                .textTheme
                                                .bodySmall,
                                          ),
                                        if (student.belt != null &&
                                            student.belt!.isNotEmpty) ...[
                                          if (group != null)
                                            Text(
                                              ' \u2022 ',
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall,
                                            ),
                                          Text(
                                            student.belt!,
                                            style: Theme.of(context)
                                                .textTheme
                                                .bodySmall,
                                          ),
                                        ],
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              // Индикатор подписки
                              Container(
                                width: 10,
                                height: 10,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: student.isSubscriptionActive
                                      ? LiquidGlassColors.success
                                      : LiquidGlassColors.danger
                                          .withValues(alpha: 0.5),
                                ),
                              ),
                            ],
                          ),
                        )
                            .animate()
                            .fadeIn(
                                delay: Duration(milliseconds: index * 30))
                            .slideX(begin: 0.05),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildGroupChip(BuildContext context, String label, String? id) {
    final isActive = _groupFilter == id;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () => setState(() => _groupFilter = id),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: isActive
                ? LiquidGlassColors.primary
                : Colors.transparent,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isActive
                  ? LiquidGlassColors.primary
                  : LiquidGlassColors.primary.withValues(alpha: 0.3),
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: isActive ? Colors.white : LiquidGlassColors.primary,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }
}
