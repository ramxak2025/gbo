/// Экран команды — копия Team.jsx
///
/// Trainer: список учеников сгруппированный по группам,
/// Superadmin: табы Спортсмены/Тренеры,
/// Student: одногруппники с модалкой деталей.
library;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../providers/auth_provider.dart';
import '../providers/data_provider.dart';
import '../providers/theme_provider.dart';
import '../models/student.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import '../widgets/avatar_widget.dart';
import 'student_detail_screen.dart';
import 'add_student_screen.dart';

/// Belt color map matching web's BELT_COLORS
const Map<String, Color> _beltColors = {
  'Белый': Color(0xFFE5E5E5),
  'Синий': Color(0xFF3B82F6),
  'Фиолетовый': Color(0xFF8B5CF6),
  'Коричневый': Color(0xFF92400E),
  'Черный': Color(0xFF1A1A1A),
};

/// Status config matching web's STATUS_CONFIG
const Map<StudentStatus, _StatusCfg> _statusConfig = {
  StudentStatus.sick: _StatusCfg('Болеет', LucideIcons.thermometer, Color(0xFFFACC15), Color(0x26EAB308)),
  StudentStatus.injury: _StatusCfg('Травма', LucideIcons.heartCrack, Color(0xFFF87171), Color(0x26EF4444)),
  StudentStatus.skip: _StatusCfg('Сачок', LucideIcons.zap, Color(0xFFA78BFA), Color(0x268B5CF6)),
};

class _StatusCfg {
  final String label;
  final IconData icon;
  final Color color;
  final Color bg;
  const _StatusCfg(this.label, this.icon, this.color, this.bg);
}

class TeamScreen extends StatefulWidget {
  const TeamScreen({super.key});

  @override
  State<TeamScreen> createState() => _TeamScreenState();
}

class _TeamScreenState extends State<TeamScreen> {
  String _search = '';
  String _tab = 'students'; // for superadmin

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final data = context.watch<DataProvider>();
    final isDark = context.watch<ThemeProvider>().isDark;

    // Student view
    if (auth.isStudent) {
      return _StudentTeamView(auth: auth, data: data, isDark: isDark);
    }

    final isAdmin = auth.isSuperadmin;
    final userId = auth.userId!;

    final trainers = data.users.where((u) => u.role == UserRole.trainer).toList();
    final students = isAdmin ? data.students : data.studentsForTrainer(userId);
    final myGroups = isAdmin ? data.groups : data.groupsForTrainer(userId);

    final filteredTrainers = trainers.where((t) =>
      t.name.toLowerCase().contains(_search.toLowerCase()) ||
      (t.clubName?.toLowerCase().contains(_search.toLowerCase()) ?? false)
    ).toList();
    final filteredStudents = students.where((s) =>
      s.name.toLowerCase().contains(_search.toLowerCase())
    ).toList();

    // Group students by group for trainer view
    final studentsByGroup = myGroups.map((g) => (
      group: g,
      students: filteredStudents.where((s) => s.groupId == g.id).toList(),
    )).toList();
    final ungrouped = filteredStudents.where((s) =>
      s.groupId == null || !myGroups.any((g) => g.id == s.groupId)
    ).toList();

    return SafeArea(
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    isAdmin ? 'Люди' : 'Команда',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                ),
                if (auth.isTrainer)
                  GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => const AddStudentScreen(),
                        ),
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: LiquidGlassColors.primary.withValues(alpha: 0.15),
                      ),
                      child: const Icon(
                        LucideIcons.userPlus,
                        color: LiquidGlassColors.primary,
                        size: 20,
                      ),
                    ),
                  ),
                if (isAdmin)
                  GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      // TODO: Navigate to add trainer
                    },
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: LiquidGlassColors.primary.withValues(alpha: 0.15),
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
          ),

          const SizedBox(height: 12),

          // Search
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: _SearchField(
              isDark: isDark,
              hint: 'Поиск по имени...',
              onChanged: (v) => setState(() => _search = v),
            ),
          ),

          // Admin tabs
          if (isAdmin) ...[
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.06)
                      : Colors.white.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.06)
                        : Colors.white.withValues(alpha: 0.6),
                  ),
                ),
                child: Row(
                  children: [
                    _buildTabButton(
                      'Спортсмены (${filteredStudents.length})',
                      _tab == 'students',
                      isDark,
                      () => setState(() => _tab = 'students'),
                    ),
                    _buildTabButton(
                      'Тренеры (${filteredTrainers.length})',
                      _tab == 'trainers',
                      isDark,
                      () => setState(() => _tab = 'trainers'),
                    ),
                  ],
                ),
              ),
            ),
          ],

          const SizedBox(height: 12),

          // Content
          Expanded(
            child: isAdmin
                ? (_tab == 'trainers'
                    ? _buildTrainersList(context, filteredTrainers, data, isDark)
                    : _buildFlatStudentsList(context, filteredStudents, data, isDark))
                : _buildGroupedStudents(context, studentsByGroup, ungrouped, filteredStudents, isDark),
          ),
        ],
      ),
    );
  }

  Widget _buildTabButton(String label, bool active, bool isDark, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: active
                ? (isDark ? Colors.white.withValues(alpha: 0.12) : Colors.white)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            boxShadow: active && !isDark
                ? [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 4)]
                : null,
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: active
                  ? (isDark ? Colors.white : Colors.black87)
                  : (isDark ? Colors.white.withValues(alpha: 0.4) : Colors.grey),
            ),
          ),
        ),
      ),
    );
  }

  /// Admin trainers list
  Widget _buildTrainersList(BuildContext context, List trainers, DataProvider data, bool isDark) {
    if (trainers.isEmpty) {
      return Center(
        child: Text(
          _search.isNotEmpty ? 'Никого не найдено' : 'Список пуст',
          style: Theme.of(context).textTheme.bodySmall,
        ),
      );
    }

    return ListView.builder(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
      itemCount: trainers.length,
      itemBuilder: (context, index) {
        final person = trainers[index];
        final count = data.students.where((s) => s.trainerId == person.id).length;

        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: GlassCard(
            onTap: () {
              // TODO: Navigate to trainer detail
            },
            child: Row(
              children: [
                AvatarWidget(name: person.name, imageUrl: person.avatar, size: 44),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        person.name,
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        person.clubName ?? '',
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? Colors.white.withValues(alpha: 0.4) : Colors.grey,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  '$count чел.',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white.withValues(alpha: 0.3) : Colors.grey,
                  ),
                ),
              ],
            ),
          )
              .animate()
              .fadeIn(delay: Duration(milliseconds: index * 50))
              .slideX(begin: 0.05),
        );
      },
    );
  }

  /// Admin flat students list
  Widget _buildFlatStudentsList(BuildContext context, List<Student> students, DataProvider data, bool isDark) {
    if (students.isEmpty) {
      return Center(
        child: Text(
          _search.isNotEmpty ? 'Никого не найдено' : 'Список пуст',
          style: Theme.of(context).textTheme.bodySmall,
        ),
      );
    }

    return ListView.builder(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
      itemCount: students.length,
      itemBuilder: (context, index) {
        final person = students[index];
        final trainerClub = data.users
            .where((u) => u.id == person.trainerId)
            .map((u) => u.clubName)
            .firstOrNull;

        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: _StudentCardWidget(
            student: person,
            isDark: isDark,
            subtitle: trainerClub,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => StudentDetailScreen(studentId: person.id),
              ),
            ),
            index: index,
          ),
        );
      },
    );
  }

  /// Trainer grouped students
  Widget _buildGroupedStudents(
    BuildContext context,
    List<({dynamic group, List<Student> students})> studentsByGroup,
    List<Student> ungrouped,
    List<Student> allFiltered,
    bool isDark,
  ) {
    if (allFiltered.isEmpty) {
      return Center(
        child: Text(
          _search.isNotEmpty ? 'Никого не найдено' : 'Нет спортсменов',
          style: Theme.of(context).textTheme.bodySmall,
        ),
      );
    }

    return ListView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
      children: [
        for (final entry in studentsByGroup)
          if (entry.students.isNotEmpty) ...[
            // Group header
            Padding(
              padding: const EdgeInsets.only(bottom: 8, top: 8),
              child: Row(
                children: [
                  Text(
                    entry.group.name.toUpperCase(),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.5)
                          : Colors.grey,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    entry.group.schedule,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.3)
                          : Colors.grey,
                    ),
                  ),
                ],
              ),
            ),
            // Students in group
            for (var i = 0; i < entry.students.length; i++)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _StudentCardWidget(
                  student: entry.students[i],
                  isDark: isDark,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => StudentDetailScreen(studentId: entry.students[i].id),
                    ),
                  ),
                  index: i,
                ),
              ),
          ],
        // Ungrouped
        if (ungrouped.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.only(bottom: 8, top: 8),
            child: Text(
              'БЕЗ ГРУППЫ',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
                color: isDark
                    ? Colors.white.withValues(alpha: 0.5)
                    : Colors.grey,
              ),
            ),
          ),
          for (var i = 0; i < ungrouped.length; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _StudentCardWidget(
                student: ungrouped[i],
                isDark: isDark,
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => StudentDetailScreen(studentId: ungrouped[i].id),
                  ),
                ),
                index: i,
              ),
            ),
        ],
      ],
    );
  }
}

/// Student card matching web's StudentCard component
class _StudentCardWidget extends StatelessWidget {
  final Student student;
  final bool isDark;
  final String? subtitle;
  final VoidCallback onTap;
  final int index;

  const _StudentCardWidget({
    required this.student,
    required this.isDark,
    this.subtitle,
    required this.onTap,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    final expired = !student.isSubscriptionActive;
    final statusCfg = student.status != null ? _statusConfig[student.status!] : null;

    return GlassCard(
      onTap: onTap,
      child: Row(
        children: [
          AvatarWidget(name: student.name, imageUrl: student.avatar, size: 44),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        student.name,
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (statusCfg != null) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: statusCfg.bg,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(statusCfg.icon, size: 10, color: statusCfg.color),
                            const SizedBox(width: 3),
                            Text(
                              statusCfg.label.toUpperCase(),
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                color: statusCfg.color,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
                Text(
                  subtitle ?? student.belt ?? '—',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white.withValues(alpha: 0.4) : Colors.grey,
                  ),
                ),
              ],
            ),
          ),
          // Belt color dot
          if (student.belt != null && student.belt!.isNotEmpty)
            Container(
              width: 16,
              height: 8,
              margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                color: _beltColors[student.belt] ?? const Color(0xFF888888),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
              ),
            ),
          // Subscription status dot
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: expired ? const Color(0xFFEF4444) : const Color(0xFF22C55E),
            ),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: Duration(milliseconds: index * 30))
        .slideX(begin: 0.05);
  }
}

/// Student team view — see teammates
class _StudentTeamView extends StatefulWidget {
  final AuthProvider auth;
  final DataProvider data;
  final bool isDark;

  const _StudentTeamView({
    required this.auth,
    required this.data,
    required this.isDark,
  });

  @override
  State<_StudentTeamView> createState() => _StudentTeamViewState();
}

class _StudentTeamViewState extends State<_StudentTeamView> {
  String _search = '';
  Student? _selected;

  @override
  Widget build(BuildContext context) {
    final student = widget.data.findStudent(widget.auth.studentId ?? '');
    final teammates = widget.data.students
        .where((s) => s.groupId == student?.groupId && s.id != widget.auth.studentId)
        .toList();
    final group = student?.groupId != null ? widget.data.findGroup(student!.groupId!) : null;

    final filtered = teammates
        .where((s) => s.name.toLowerCase().contains(_search.toLowerCase()))
        .toList();

    return SafeArea(
      child: Stack(
        children: [
          Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'Моя команда',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                ),
              ),

              const SizedBox(height: 12),

              // Group info card
              if (group != null)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          group.name,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        Text(
                          group.schedule,
                          style: TextStyle(
                            fontSize: 12,
                            color: widget.isDark
                                ? Colors.white.withValues(alpha: 0.4)
                                : Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              const SizedBox(height: 12),

              // Search
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: _SearchField(
                  isDark: widget.isDark,
                  hint: 'Поиск...',
                  onChanged: (v) => setState(() => _search = v),
                ),
              ),

              const SizedBox(height: 12),

              // Teammates list
              Expanded(
                child: filtered.isEmpty
                    ? Center(
                        child: Text(
                          'Нет одногруппников',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      )
                    : ListView.builder(
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final s = filtered[index];
                          final statusCfg = s.status != null ? _statusConfig[s.status!] : null;

                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: GlassCard(
                              onTap: () {
                                HapticFeedback.lightImpact();
                                setState(() => _selected = s);
                              },
                              child: Row(
                                children: [
                                  AvatarWidget(name: s.name, imageUrl: s.avatar, size: 48),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          s.name,
                                          style: const TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        Text(
                                          s.belt ?? '—',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: widget.isDark
                                                ? Colors.white.withValues(alpha: 0.4)
                                                : Colors.grey,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (statusCfg != null)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: statusCfg.bg,
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(statusCfg.icon, size: 10, color: statusCfg.color),
                                          const SizedBox(width: 3),
                                          Text(
                                            statusCfg.label.toUpperCase(),
                                            style: TextStyle(
                                              fontSize: 9,
                                              fontWeight: FontWeight.bold,
                                              color: statusCfg.color,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                ],
                              ),
                            )
                                .animate()
                                .fadeIn(delay: Duration(milliseconds: index * 50))
                                .slideX(begin: 0.05),
                          );
                        },
                      ),
              ),
            ],
          ),

          // Teammate detail modal
          if (_selected != null) _buildTeammateModal(context),
        ],
      ),
    );
  }

  Widget _buildTeammateModal(BuildContext context) {
    final s = _selected!;
    final statusCfg = s.status != null ? _statusConfig[s.status!] : null;

    return GestureDetector(
      onTap: () => setState(() => _selected = null),
      child: Container(
        color: Colors.black.withValues(alpha: 0.6),
        child: Center(
          child: GestureDetector(
            onTap: () {}, // prevent dismiss
            child: Container(
              width: MediaQuery.of(context).size.width * 0.85,
              constraints: const BoxConstraints(maxWidth: 320),
              decoration: BoxDecoration(
                color: widget.isDark
                    ? const Color(0xFF1E1E2E).withValues(alpha: 0.95)
                    : Colors.white.withValues(alpha: 0.9),
                borderRadius: BorderRadius.circular(28),
                border: Border.all(
                  color: widget.isDark
                      ? Colors.white.withValues(alpha: 0.07)
                      : Colors.white.withValues(alpha: 0.6),
                ),
                boxShadow: widget.isDark
                    ? null
                    : [BoxShadow(color: Colors.black.withValues(alpha: 0.15), blurRadius: 30)],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Avatar
                  Padding(
                    padding: const EdgeInsets.only(top: 24, bottom: 16),
                    child: AvatarWidget(name: s.name, imageUrl: s.avatar, size: 120),
                  ),
                  // Info
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      children: [
                        Text(
                          s.name,
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          s.belt ?? '—',
                          style: TextStyle(
                            fontSize: 14,
                            color: widget.isDark
                                ? Colors.white.withValues(alpha: 0.4)
                                : Colors.grey,
                          ),
                        ),
                        if (statusCfg != null) ...[
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: statusCfg.bg,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(statusCfg.icon, size: 12, color: statusCfg.color),
                                const SizedBox(width: 4),
                                Text(
                                  statusCfg.label.toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: statusCfg.color,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                        if (s.phone.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                LucideIcons.phone,
                                size: 14,
                                color: widget.isDark
                                    ? Colors.white.withValues(alpha: 0.6)
                                    : Colors.grey,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                s.phone,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: widget.isDark
                                      ? Colors.white.withValues(alpha: 0.6)
                                      : Colors.grey,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Action buttons
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                    child: Row(
                      children: [
                        if (s.phone.isNotEmpty)
                          Expanded(
                            child: GestureDetector(
                              onTap: () {
                                HapticFeedback.mediumImpact();
                                final cleanPhone = s.phone.replaceAll(RegExp(r'[^\d+]'), '');
                                launchUrl(Uri.parse('https://wa.me/$cleanPhone'));
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF16A34A),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(LucideIcons.messageCircle, size: 16, color: Colors.white),
                                    SizedBox(width: 6),
                                    Text(
                                      'WhatsApp',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        if (s.phone.isNotEmpty) const SizedBox(width: 8),
                        Expanded(
                          child: GestureDetector(
                            onTap: () => setState(() => _selected = null),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: widget.isDark
                                    ? Colors.white.withValues(alpha: 0.08)
                                    : Colors.white.withValues(alpha: 0.7),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: widget.isDark
                                      ? Colors.white.withValues(alpha: 0.08)
                                      : Colors.white.withValues(alpha: 0.6),
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(LucideIcons.x, size: 16,
                                    color: widget.isDark ? Colors.white : Colors.black87,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Закрыть',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: widget.isDark ? Colors.white : Colors.black87,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            )
                .animate()
                .fadeIn(duration: 200.ms)
                .scale(begin: const Offset(0.9, 0.9), end: const Offset(1, 1)),
          ),
        ),
      ),
    );
  }
}

/// Search field matching web's input style
class _SearchField extends StatelessWidget {
  final bool isDark;
  final String hint;
  final ValueChanged<String> onChanged;

  const _SearchField({
    required this.isDark,
    required this.hint,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: isDark
            ? Colors.white.withValues(alpha: 0.07)
            : Colors.white.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.08)
              : Colors.white.withValues(alpha: 0.6),
        ),
        boxShadow: isDark
            ? null
            : [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 4)],
      ),
      child: TextField(
        onChanged: onChanged,
        style: TextStyle(
          fontSize: 14,
          color: isDark ? Colors.white : Colors.grey.shade900,
        ),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(
            fontSize: 14,
            color: isDark
                ? Colors.white.withValues(alpha: 0.25)
                : Colors.grey,
          ),
          prefixIcon: Icon(
            LucideIcons.search,
            size: 16,
            color: isDark
                ? Colors.white.withValues(alpha: 0.3)
                : Colors.grey,
          ),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        ),
      ),
    );
  }
}
