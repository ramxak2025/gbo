/// Экран турниров — копия Tournaments.jsx
///
/// Клубные турниры (активные + архив с toggle),
/// Официальные турниры с обложками.
/// Role-adaptive: тренер может создавать внутренние,
/// суперадмин — внешние.
library;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/data_provider.dart';
import '../providers/theme_provider.dart';
import '../models/internal_tournament.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import '../utils/date_utils.dart' as date_utils;

class TournamentsScreen extends StatefulWidget {
  const TournamentsScreen({super.key});

  @override
  State<TournamentsScreen> createState() => _TournamentsScreenState();
}

class _TournamentsScreenState extends State<TournamentsScreen> {
  bool _showArchive = false;

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;
    final auth = context.watch<AuthProvider>();
    final data = context.watch<DataProvider>();

    // Internal tournaments — filtered by role
    final allInternal = data.internalTournaments.where((t) {
      if (auth.isTrainer) return t.trainerId == auth.userId;
      if (auth.isStudent) {
        final student = data.findStudent(auth.studentId ?? '');
        return student != null && t.trainerId == student.trainerId;
      }
      return true; // superadmin sees all
    }).toList()
      ..sort((a, b) {
        final dateA = DateTime.tryParse(a.date ?? '') ?? DateTime(2000);
        final dateB = DateTime.tryParse(b.date ?? '') ?? DateTime(2000);
        return dateB.compareTo(dateA);
      });

    // Split active vs archived
    final thirtyDaysAgo = DateTime.now().subtract(const Duration(days: 30));
    final activeInternal = allInternal.where((t) => t.status != 'completed').toList();
    final archivedInternal = allInternal.where((t) {
      if (t.status != 'completed') return false;
      final tournDate = DateTime.tryParse(t.date ?? '') ?? DateTime(2000);
      return tournDate.isAfter(thirtyDaysAgo);
    }).toList();

    // Official tournaments sorted by date
    final sorted = [...data.tournaments]
      ..sort((a, b) {
        final dateA = DateTime.tryParse(a.date ?? '') ?? DateTime(2000);
        final dateB = DateTime.tryParse(b.date ?? '') ?? DateTime(2000);
        return dateA.compareTo(dateB);
      });

    final hasInternal = activeInternal.isNotEmpty || archivedInternal.isNotEmpty;

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
                    'Турниры',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                ),
                if (auth.isTrainer)
                  GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      // TODO: Navigate to create internal tournament
                    },
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: LiquidGlassColors.primary.withValues(alpha: 0.15),
                      ),
                      child: const Icon(
                        LucideIcons.swords,
                        color: LiquidGlassColors.primary,
                        size: 20,
                      ),
                    ),
                  ),
                if (auth.isSuperadmin)
                  GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      // TODO: Navigate to add tournament
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

          // Content
          Expanded(
            child: (sorted.isEmpty && allInternal.isEmpty)
                ? _buildEmptyState(context, auth, isDark)
                : ListView(
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                    children: [
                      // Active internal tournaments
                      if (activeInternal.isNotEmpty) ...[
                        _buildSectionHeader(
                          context,
                          icon: LucideIcons.swords,
                          iconColor: LiquidGlassColors.primary,
                          title: 'Клубные турниры',
                          isDark: isDark,
                        ),
                        const SizedBox(height: 8),
                        for (var i = 0; i < activeInternal.length; i++)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: _buildInternalCard(context, activeInternal[i], isDark, i),
                          ),
                      ],

                      // Archived internal tournaments
                      if (archivedInternal.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        GestureDetector(
                          onTap: () {
                            HapticFeedback.selectionClick();
                            setState(() => _showArchive = !_showArchive);
                          },
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: Row(
                              children: [
                                Icon(
                                  LucideIcons.archive,
                                  size: 14,
                                  color: isDark
                                      ? Colors.white.withValues(alpha: 0.3)
                                      : Colors.grey,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'АРХИВ (${archivedInternal.length})',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.5,
                                    color: isDark
                                        ? Colors.white.withValues(alpha: 0.4)
                                        : Colors.grey,
                                  ),
                                ),
                                const Spacer(),
                                Icon(
                                  _showArchive ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                                  size: 16,
                                  color: isDark
                                      ? Colors.white.withValues(alpha: 0.4)
                                      : Colors.grey,
                                ),
                              ],
                            ),
                          ),
                        ),
                        if (_showArchive) ...[
                          const SizedBox(height: 4),
                          for (var i = 0; i < archivedInternal.length; i++)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: _buildInternalCard(context, archivedInternal[i], isDark, i),
                            ),
                        ],
                      ],

                      // Official tournaments
                      if (sorted.isNotEmpty) ...[
                        if (hasInternal) ...[
                          const SizedBox(height: 12),
                          _buildSectionHeader(
                            context,
                            icon: LucideIcons.trophy,
                            iconColor: const Color(0xFFFB923C),
                            title: 'Официальные турниры',
                            isDark: isDark,
                          ),
                          const SizedBox(height: 8),
                        ],
                        for (var i = 0; i < sorted.length; i++)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _buildOfficialCard(context, sorted[i], isDark, i),
                          ),
                      ],
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String title,
    required bool isDark,
  }) {
    return Row(
      children: [
        Icon(icon, size: 14, color: iconColor),
        const SizedBox(width: 8),
        Text(
          title.toUpperCase(),
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
            color: isDark ? Colors.white.withValues(alpha: 0.5) : Colors.grey,
          ),
        ),
      ],
    );
  }

  Widget _buildInternalCard(BuildContext context, InternalTournament t, bool isDark, int index) {
    final isCompleted = t.status == 'completed';
    final cats = (t.brackets['categories'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final isLegacy = cats.isEmpty && t.brackets.containsKey('rounds');
    final totalParticipants = isLegacy
        ? (t.brackets['participants'] as List?)?.length ?? 0
        : cats.fold<int>(0, (s, c) => s + ((c['participants'] as List?)?.length ?? 0));
    final catCount = isLegacy ? 1 : cats.length;

    final catWord = catCount == 1 ? 'весовая' : 'весовых';

    return GlassCard(
      onTap: () {
        // TODO: Navigate to internal tournament detail
      },
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        t.title,
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (isCompleted) ...[
                      const SizedBox(width: 8),
                      Container(
                        width: 20,
                        height: 20,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0xFF22C55E).withValues(alpha: 0.2),
                        ),
                        child: const Icon(
                          LucideIcons.check,
                          size: 12,
                          color: Color(0xFF4ADE80),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      LucideIcons.calendar,
                      size: 11,
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.4)
                          : Colors.grey,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      date_utils.formatDate(t.date),
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.4)
                            : Colors.grey,
                      ),
                    ),
                    _dot(isDark),
                    Text(
                      '$catCount $catWord',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.4)
                            : Colors.grey,
                      ),
                    ),
                    _dot(isDark),
                    Text(
                      '$totalParticipants чел.',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.4)
                            : Colors.grey,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: Duration(milliseconds: index * 60))
        .slideX(begin: 0.05);
  }

  Widget _dot(bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6),
      child: Text(
        '•',
        style: TextStyle(
          fontSize: 12,
          color: isDark ? Colors.white.withValues(alpha: 0.4) : Colors.grey,
        ),
      ),
    );
  }

  Widget _buildOfficialCard(BuildContext context, dynamic tournament, bool isDark, int index) {
    final isPast = (DateTime.tryParse(tournament.date ?? '') ?? DateTime.now()).isBefore(DateTime.now());
    final hasCover = tournament.coverImage != null && tournament.coverImage!.isNotEmpty;

    return GlassCard(
      onTap: () {
        // TODO: Navigate to tournament detail
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Cover image or placeholder
          if (hasCover)
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.network(
                tournament.coverImage!,
                height: 144,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => _buildCoverPlaceholder(isDark),
              ),
            )
          else
            _buildCoverPlaceholder(isDark),

          const SizedBox(height: 12),

          // Title and info
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      tournament.title,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          LucideIcons.calendar,
                          size: 12,
                          color: isDark
                              ? Colors.white.withValues(alpha: 0.4)
                              : Colors.grey,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          date_utils.formatDate(tournament.date),
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark
                                ? Colors.white.withValues(alpha: 0.4)
                                : Colors.grey,
                          ),
                        ),
                      ],
                    ),
                    if (tournament.location != null && tournament.location!.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Icon(
                            LucideIcons.mapPin,
                            size: 12,
                            color: isDark
                                ? Colors.white.withValues(alpha: 0.4)
                                : Colors.grey,
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              tournament.location!,
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark
                                    ? Colors.white.withValues(alpha: 0.4)
                                    : Colors.grey,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              if (isPast)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.08)
                        : Colors.white.withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(20),
                    border: isDark
                        ? null
                        : Border.all(color: Colors.white.withValues(alpha: 0.6)),
                  ),
                  child: Text(
                    'ПРОШЁЛ',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.4)
                          : Colors.grey,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: Duration(milliseconds: index * 80))
        .slideY(begin: 0.05);
  }

  Widget _buildCoverPlaceholder(bool isDark) {
    return Container(
      height: 112,
      width: double.infinity,
      decoration: BoxDecoration(
        color: isDark
            ? Colors.white.withValues(alpha: 0.05)
            : Colors.white.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
      ),
      alignment: Alignment.center,
      child: Text(
        'BJJ',
        style: TextStyle(
          fontSize: 36,
          fontWeight: FontWeight.w900,
          fontStyle: FontStyle.italic,
          color: LiquidGlassColors.primary.withValues(alpha: 0.3),
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context, AuthProvider auth, bool isDark) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            LucideIcons.swords,
            size: 48,
            color: isDark
                ? Colors.white.withValues(alpha: 0.1)
                : Colors.grey.withValues(alpha: 0.2),
          ),
          const SizedBox(height: 12),
          Text(
            'Нет турниров',
            style: TextStyle(
              fontSize: 14,
              color: isDark
                  ? Colors.white.withValues(alpha: 0.3)
                  : Colors.grey,
            ),
          ),
          if (auth.isTrainer) ...[
            const SizedBox(height: 12),
            GestureDetector(
              onTap: () {
                HapticFeedback.lightImpact();
                // TODO: Navigate to create internal tournament
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                decoration: BoxDecoration(
                  color: LiquidGlassColors.primary,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Создать клубный турнир',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
