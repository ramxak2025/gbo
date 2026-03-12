import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../providers/data_provider.dart';
import '../providers/theme_provider.dart';
import '../theme/app_theme.dart';
import '../models/models.dart';
import '../widgets/glass_card.dart';
import '../widgets/page_header.dart';
import '../widgets/section_title.dart';

class TournamentsScreen extends StatelessWidget {
  const TournamentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final data = context.watch<DataProvider>();
    final tp = context.watch<ThemeProvider>();
    final t = tp.theme;
    final isDark = tp.isDark;

    final now = DateTime.now();
    final upcoming = data.tournaments.where((tour) {
      if (tour.date == null) return false;
      return DateTime.parse(tour.date!).isAfter(now);
    }).toList()
      ..sort((a, b) => DateTime.parse(a.date!).compareTo(DateTime.parse(b.date!)));

    final past = data.tournaments.where((tour) {
      if (tour.date == null) return true;
      return DateTime.parse(tour.date!).isBefore(now);
    }).toList()
      ..sort((a, b) => (b.date ?? '').compareTo(a.date ?? ''));

    return Scaffold(
      backgroundColor: t.bg,
      body: Stack(
        children: [
          Positioned(top: -80, left: -60, child: _blob(AppColors.orange, 180)),

          SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const PageHeader(title: 'Турниры'),

                if (upcoming.isNotEmpty) ...[
                  SectionTitle(title: 'Предстоящие'),
                  ...upcoming.map((tour) => _TournamentCard(tour: tour, t: t, isDark: isDark, isUpcoming: true)),
                ],

                if (past.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  SectionTitle(title: 'Прошедшие'),
                  ...past.take(10).map((tour) => _TournamentCard(tour: tour, t: t, isDark: isDark, isUpcoming: false)),
                ],

                if (upcoming.isEmpty && past.isEmpty)
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.all(40),
                      child: Column(
                        children: [
                          Icon(Icons.emoji_events_outlined, size: 48, color: t.textMuted),
                          const SizedBox(height: 12),
                          Text('Нет турниров', style: TextStyle(color: t.textMuted)),
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
}

class _TournamentCard extends StatelessWidget {
  final Tournament tour;
  final dynamic t;
  final bool isDark;
  final bool isUpcoming;

  const _TournamentCard({required this.tour, required this.t, required this.isDark, required this.isUpcoming});

  int get _daysUntil {
    if (tour.date == null) return 0;
    return DateTime.parse(tour.date!).difference(DateTime.now()).inDays;
  }

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: LinearGradient(
                colors: isUpcoming
                    ? [AppColors.accent.withOpacity(isDark ? 0.2 : 0.1), AppColors.orange.withOpacity(isDark ? 0.2 : 0.1)]
                    : [Colors.grey.withOpacity(0.15), Colors.grey.withOpacity(0.1)],
              ),
            ),
            child: Icon(
              Icons.emoji_events,
              size: 22,
              color: isUpcoming ? t.accent : t.textMuted,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tour.title,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: isUpcoming ? t.text : t.textSecondary,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.calendar_today_outlined, size: 11, color: t.textMuted),
                    const SizedBox(width: 4),
                    Text(
                      tour.date != null
                          ? DateFormat('d MMMM yyyy', 'ru').format(DateTime.parse(tour.date!))
                          : '—',
                      style: TextStyle(fontSize: 12, color: t.textMuted),
                    ),
                  ],
                ),
                if (tour.location != null) ...[
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Icon(Icons.location_on_outlined, size: 11, color: t.textMuted),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(tour.location!, style: TextStyle(fontSize: 12, color: t.textMuted), overflow: TextOverflow.ellipsis),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          if (isUpcoming && _daysUntil >= 0)
            Column(
              children: [
                Text(
                  _daysUntil.toString(),
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: t.accent),
                ),
                Text('дн.', style: TextStyle(fontSize: 9, color: t.textMuted)),
              ],
            ),
        ],
      ),
    );
  }
}
