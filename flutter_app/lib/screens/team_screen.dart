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
import 'student_detail_screen.dart';
import 'add_student_screen.dart';

class TeamScreen extends StatefulWidget {
  const TeamScreen({super.key});

  @override
  State<TeamScreen> createState() => _TeamScreenState();
}

class _TeamScreenState extends State<TeamScreen> {
  String _search = '';

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final data = context.watch<DataProvider>();
    final tp = context.watch<ThemeProvider>();
    final t = tp.theme;
    final isDark = tp.isDark;

    final isTrainer = auth.role == 'trainer';
    final isAdmin = auth.role == 'superadmin';

    List<Student> students;
    if (isAdmin) {
      students = data.students;
    } else if (isTrainer) {
      students = data.students.where((s) => s.trainerId == auth.userId).toList();
    } else {
      // Student sees teammates
      final myStudent = data.students.cast<Student?>().firstWhere((s) => s?.id == auth.studentId, orElse: () => null);
      if (myStudent?.groupId != null) {
        students = data.students.where((s) => s.groupId == myStudent!.groupId).toList();
      } else {
        students = [];
      }
    }

    if (_search.isNotEmpty) {
      students = students.where((s) => s.name.toLowerCase().contains(_search.toLowerCase())).toList();
    }

    // Group students by group
    final groups = isAdmin ? data.groups : data.groups.where((g) => g.trainerId == auth.userId).toList();
    final ungrouped = students.where((s) => s.groupId == null || !groups.any((g) => g.id == s.groupId)).toList();

    return Scaffold(
      backgroundColor: t.bg,
      body: Stack(
        children: [
          Positioned(top: -80, right: -60, child: _blob(AppColors.accent, 180)),

          CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      PageHeader(
                        title: isTrainer ? 'Команда' : 'Команда',
                        actions: isTrainer ? [
                          IconButton(
                            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AddStudentScreen())),
                            icon: Icon(Icons.person_add, size: 22, color: t.accent),
                          ),
                        ] : null,
                      ),

                      // Search
                      if (students.length > 5)
                        Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: t.input,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: t.inputBorder),
                          ),
                          child: TextField(
                            onChanged: (v) => setState(() => _search = v),
                            style: TextStyle(color: t.text, fontSize: 14),
                            decoration: InputDecoration(
                              hintText: 'Поиск...',
                              hintStyle: TextStyle(color: t.textMuted),
                              prefixIcon: Icon(Icons.search, size: 18, color: t.textMuted),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            ),
                          ),
                        ),

                      // Grouped students
                      ...groups.map((group) {
                        final groupStudents = students.where((s) => s.groupId == group.id).toList();
                        if (groupStudents.isEmpty) return const SizedBox.shrink();
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SectionTitle(title: '${group.name} (${groupStudents.length})'),
                            ...groupStudents.map((s) => _StudentCard(student: s, t: t, isDark: isDark, isTrainer: isTrainer)),
                            const SizedBox(height: 8),
                          ],
                        );
                      }),

                      // Ungrouped
                      if (ungrouped.isNotEmpty) ...[
                        SectionTitle(title: 'Без группы (${ungrouped.length})'),
                        ...ungrouped.map((s) => _StudentCard(student: s, t: t, isDark: isDark, isTrainer: isTrainer)),
                      ],

                      if (students.isEmpty)
                        Center(
                          child: Padding(
                            padding: const EdgeInsets.all(40),
                            child: Column(
                              children: [
                                Icon(Icons.people_outline, size: 48, color: t.textMuted),
                                const SizedBox(height: 12),
                                Text('Нет учеников', style: TextStyle(color: t.textMuted, fontSize: 15)),
                              ],
                            ),
                          ),
                        ),

                      const SizedBox(height: 120),
                    ],
                  ),
                ),
              ),
            ],
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
}

class _StudentCard extends StatelessWidget {
  final Student student;
  final dynamic t;
  final bool isDark;
  final bool isTrainer;

  const _StudentCard({required this.student, required this.t, required this.isDark, required this.isTrainer});

  @override
  Widget build(BuildContext context) {
    final expired = student.isExpired;
    final statusConfig = _getStatusConfig(student.status);

    return GlassCard(
      onTap: isTrainer ? () {
        Navigator.push(context, MaterialPageRoute(
          builder: (_) => StudentDetailScreen(studentId: student.id),
        ));
      } : null,
      child: Row(
        children: [
          Stack(
            children: [
              AvatarWidget(name: student.name, src: student.avatar, size: 44),
              // Subscription dot
              Positioned(
                right: 0,
                bottom: 0,
                child: Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: expired ? AppColors.red : AppColors.green,
                    border: Border.all(color: isDark ? AppColors.darkBg : AppColors.lightBg, width: 2),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(student.name, style: TextStyle(fontWeight: FontWeight.w700, color: t.text)),
                if (student.belt != null)
                  Text(student.belt!, style: TextStyle(fontSize: 12, color: t.accent, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
          if (statusConfig != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: statusConfig['color'].withOpacity(0.15),
                border: Border.all(color: statusConfig['color'].withOpacity(0.3)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(statusConfig['icon'], size: 12, color: statusConfig['color']),
                  const SizedBox(width: 4),
                  Text(statusConfig['label'], style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: statusConfig['color'])),
                ],
              ),
            ),
          if (isTrainer)
            Icon(Icons.chevron_right, size: 18, color: t.textMuted),
        ],
      ),
    );
  }

  Map<String, dynamic>? _getStatusConfig(String? status) {
    switch (status) {
      case 'sick':
        return {'label': 'Болеет', 'icon': Icons.thermostat, 'color': AppColors.yellow};
      case 'injury':
        return {'label': 'Травма', 'icon': Icons.heart_broken, 'color': AppColors.red};
      case 'skip':
        return {'label': 'Сачок', 'icon': Icons.flash_on, 'color': AppColors.purple};
      default:
        return null;
    }
  }
}
