import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import '../theme/app_theme.dart';

class PageHeader extends StatelessWidget {
  final String title;
  final bool showBack;
  final bool logo;
  final VoidCallback? onBack;
  final List<Widget>? actions;

  const PageHeader({
    super.key,
    required this.title,
    this.showBack = false,
    this.logo = false,
    this.onBack,
    this.actions,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.watch<ThemeProvider>().theme;
    final isDark = context.watch<ThemeProvider>().isDark;
    final tp = context.read<ThemeProvider>();

    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(4, 8, 4, 12),
        child: Row(
          children: [
            if (showBack)
              IconButton(
                onPressed: onBack ?? () => Navigator.pop(context),
                icon: Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: t.text),
              ),
            if (logo)
              ShaderMask(
                shaderCallback: (bounds) => const LinearGradient(
                  colors: [AppColors.purple, Color(0xFF7C3AED), Color(0xFF6366F1)],
                ).createShader(bounds),
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
                ),
              )
            else
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: t.text,
                  ),
                ),
              ),
            if (!logo) const Spacer(),
            ...?actions,
            IconButton(
              onPressed: () => tp.toggle(),
              icon: Icon(
                isDark ? Icons.wb_sunny_outlined : Icons.nightlight_round,
                size: 20,
                color: t.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
