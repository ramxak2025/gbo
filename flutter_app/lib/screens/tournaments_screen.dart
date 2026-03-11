/// Экран турниров
///
/// Список внешних и внутренних турниров.
/// Суперадмин может создавать внешние турниры,
/// тренер — внутренние (с турнирной сеткой).
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
import '../utils/date_utils.dart' as date_utils;

/// Экран турниров
class TournamentsScreen extends StatefulWidget {
  const TournamentsScreen({super.key});

  @override
  State<TournamentsScreen> createState() => _TournamentsScreenState();
}

class _TournamentsScreenState extends State<TournamentsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;
    final auth = context.watch<AuthProvider>();
    final data = context.watch<DataProvider>();

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
                    'Турниры',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                ),
                if (auth.isSuperadmin)
                  GestureDetector(
                    onTap: () {
                      // TODO: Навигация к добавлению турнира
                    },
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
          ),

          const SizedBox(height: 12),

          // Табы
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: isDark
                  ? Colors.white.withValues(alpha: 0.05)
                  : Colors.black.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(12),
            ),
            child: TabBar(
              controller: _tabController,
              indicator: BoxDecoration(
                color: LiquidGlassColors.primary,
                borderRadius: BorderRadius.circular(10),
              ),
              indicatorSize: TabBarIndicatorSize.tab,
              labelColor: Colors.white,
              unselectedLabelColor: isDark
                  ? Colors.white.withValues(alpha: 0.5)
                  : Colors.black.withValues(alpha: 0.5),
              labelStyle: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
              dividerColor: Colors.transparent,
              tabs: const [
                Tab(text: 'Внешние'),
                Tab(text: 'Внутренние'),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Содержимое табов
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // Внешние турниры
                _buildExternalTournaments(context, data, auth),
                // Внутренние турниры
                _buildInternalTournaments(context, data, auth),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Список внешних турниров
  Widget _buildExternalTournaments(
      BuildContext context, DataProvider data, AuthProvider auth) {
    final tournaments = data.tournaments;
    if (tournaments.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              LucideIcons.trophy,
              size: 48,
              color: Colors.grey.withValues(alpha: 0.3),
            ),
            const SizedBox(height: 12),
            Text(
              'Нет турниров',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
      itemCount: tournaments.length,
      itemBuilder: (context, index) {
        final tournament = tournaments[index];
        final regs = data.registrationsForTournament(tournament.id);

        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Обложка
                if (tournament.coverImage != null &&
                    tournament.coverImage!.isNotEmpty)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(
                      tournament.coverImage!,
                      height: 140,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                    ),
                  ),
                if (tournament.coverImage != null &&
                    tournament.coverImage!.isNotEmpty)
                  const SizedBox(height: 12),

                Text(
                  tournament.title,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      LucideIcons.calendar,
                      size: 14,
                      color: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.color,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      date_utils.formatDate(tournament.date),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    if (tournament.location != null &&
                        tournament.location!.isNotEmpty) ...[
                      const SizedBox(width: 12),
                      Icon(
                        LucideIcons.mapPin,
                        size: 14,
                        color: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.color,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          tournament.location!,
                          style: Theme.of(context).textTheme.bodySmall,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ],
                ),
                if (regs.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      'Зарегистрировано: ${regs.length}',
                      style: TextStyle(
                        color: LiquidGlassColors.primary,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
              ],
            ),
          )
              .animate()
              .fadeIn(delay: Duration(milliseconds: index * 80))
              .slideY(begin: 0.05),
        );
      },
    );
  }

  /// Список внутренних турниров
  Widget _buildInternalTournaments(
      BuildContext context, DataProvider data, AuthProvider auth) {
    final tournaments = data.internalTournaments;
    if (tournaments.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              LucideIcons.swords,
              size: 48,
              color: Colors.grey.withValues(alpha: 0.3),
            ),
            const SizedBox(height: 12),
            Text(
              'Нет внутренних турниров',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
      itemCount: tournaments.length,
      itemBuilder: (context, index) {
        final tournament = tournaments[index];
        final isActive = tournament.status == 'active';

        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: GlassCard(
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    color: isActive
                        ? LiquidGlassColors.purple.withValues(alpha: 0.15)
                        : Colors.grey.withValues(alpha: 0.15),
                  ),
                  child: Icon(
                    LucideIcons.swords,
                    color: isActive
                        ? LiquidGlassColors.purple
                        : Colors.grey,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tournament.title,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Row(
                        children: [
                          if (tournament.date != null)
                            Text(
                              date_utils.formatDate(tournament.date),
                              style:
                                  Theme.of(context).textTheme.bodySmall,
                            ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: isActive
                                  ? LiquidGlassColors.success
                                      .withValues(alpha: 0.15)
                                  : Colors.grey.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              isActive ? 'Активен' : 'Завершён',
                              style: TextStyle(
                                fontSize: 11,
                                color: isActive
                                    ? LiquidGlassColors.success
                                    : Colors.grey,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const Icon(LucideIcons.chevronRight, size: 18),
              ],
            ),
          )
              .animate()
              .fadeIn(delay: Duration(milliseconds: index * 80))
              .slideX(begin: 0.05),
        );
      },
    );
  }
}
