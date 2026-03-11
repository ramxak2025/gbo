/// Модальное окно в стиле Liquid Glass
///
/// Полупрозрачное модальное окно с размытием фона.
/// Используется для форм, подтверждений и деталей.
library;

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';

/// Показать стеклянное модальное окно
Future<T?> showGlassModal<T>({
  required BuildContext context,
  required Widget child,
  String? title,
  bool isDismissible = true,
}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    isDismissible: isDismissible,
    backgroundColor: Colors.transparent,
    builder: (context) => GlassModal(
      title: title,
      child: child,
    ),
  );
}

/// Стеклянное модальное окно
class GlassModal extends StatelessWidget {
  final String? title;
  final Widget child;

  const GlassModal({
    super.key,
    this.title,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;

    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
        child: Container(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.9,
          ),
          padding: EdgeInsets.only(bottom: bottomPadding),
          decoration: BoxDecoration(
            color: isDark
                ? const Color(0xFF1C1C1E).withValues(alpha: 0.95)
                : Colors.white.withValues(alpha: 0.95),
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(20)),
            border: Border(
              top: BorderSide(
                color: isDark
                    ? Colors.white.withValues(alpha: 0.1)
                    : Colors.black.withValues(alpha: 0.05),
              ),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Индикатор перетаскивания
              Container(
                width: 36,
                height: 5,
                margin: const EdgeInsets.only(top: 8),
                decoration: BoxDecoration(
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.3)
                      : Colors.black.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
              // Заголовок
              if (title != null)
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 8, 0),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          title!,
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.of(context).pop(),
                        icon: Icon(
                          LucideIcons.x,
                          color: isDark
                              ? Colors.white.withValues(alpha: 0.5)
                              : Colors.black.withValues(alpha: 0.3),
                        ),
                      ),
                    ],
                  ),
                ),
              // Содержимое
              Flexible(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: child,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
