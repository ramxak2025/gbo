/// Виджет заголовка страницы
///
/// Большой заголовок в стиле iOS с кнопкой назад
/// и опциональными действиями справа.
library;

import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import '../theme/app_theme.dart';

/// Заголовок страницы в стиле iOS Large Title
class PageHeader extends StatelessWidget {
  final String title;
  final bool showBack;
  final VoidCallback? onBack;
  final List<Widget>? actions;

  const PageHeader({
    super.key,
    required this.title,
    this.showBack = false,
    this.onBack,
    this.actions,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      child: Row(
        children: [
          if (showBack)
            GestureDetector(
              onTap: onBack ?? () => Navigator.of(context).pop(),
              child: Container(
                padding: const EdgeInsets.all(8),
                margin: const EdgeInsets.only(right: 12),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.1)
                      : Colors.black.withValues(alpha: 0.05),
                ),
                child: Icon(
                  LucideIcons.chevronLeft,
                  size: 20,
                  color: LiquidGlassColors.primary,
                ),
              ),
            ),
          Expanded(
            child: Text(
              title,
              style: Theme.of(context).textTheme.headlineMedium,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (actions != null) ...actions!,
        ],
      ),
    );
  }
}
