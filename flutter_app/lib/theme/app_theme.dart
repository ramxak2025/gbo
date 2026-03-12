import 'package:flutter/material.dart';
import 'dart:ui';

class AppColors {
  // Dark theme
  static const darkBg = Color(0xFF0A0A1A);
  static const darkCard = Color(0x0FFFFFFF); // white 6%
  static const darkCardBorder = Color(0x14FFFFFF); // white 8%
  static const darkText = Color(0xFFFFFFFF);
  static const darkTextSecondary = Color(0x80FFFFFF); // white 50%
  static const darkTextMuted = Color(0x4DFFFFFF); // white 30%
  static const darkInput = Color(0x12FFFFFF); // white 7%
  static const darkInputBorder = Color(0x14FFFFFF);
  static const darkNavBg = Color(0x14FFFFFF);
  static const darkTabActive = Color(0x1FFFFFFF);

  // Light theme
  static const lightBg = Color(0xFFF5F5F7);
  static const lightCard = Color(0xCCFFFFFF); // white 80%
  static const lightCardBorder = Color(0x99FFFFFF); // white 60%
  static const lightText = Color(0xFF111827);
  static const lightTextSecondary = Color(0xFF6B7280);
  static const lightTextMuted = Color(0xFF9CA3AF);
  static const lightInput = Color(0xB3FFFFFF);
  static const lightInputBorder = Color(0x99FFFFFF);
  static const lightNavBg = Color(0x80FFFFFF);

  // Shared accent colors
  static const accent = Color(0xFF8B5CF6);
  static const accentDark = Color(0xFF7C3AED);
  static const accentLight = Color(0xFFA78BFA);
  static const red = Color(0xFFEF4444);
  static const redDark = Color(0xFFDC2626);
  static const green = Color(0xFF22C55E);
  static const greenDark = Color(0xFF16A34A);
  static const yellow = Color(0xFFEAB308);
  static const blue = Color(0xFF3B82F6);
  static const cyan = Color(0xFF06B6D4);
  static const orange = Color(0xFFF97316);
  static const purple = Color(0xFF8B5CF6);
  static const rose = Color(0xFFF43F5E);
}

class AppTheme {
  final bool isDark;

  const AppTheme({required this.isDark});

  Color get bg => isDark ? AppColors.darkBg : AppColors.lightBg;
  Color get card => isDark ? AppColors.darkCard : AppColors.lightCard;
  Color get cardBorder => isDark ? AppColors.darkCardBorder : AppColors.lightCardBorder;
  Color get text => isDark ? AppColors.darkText : AppColors.lightText;
  Color get textSecondary => isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
  Color get textMuted => isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted;
  Color get input => isDark ? AppColors.darkInput : AppColors.lightInput;
  Color get inputBorder => isDark ? AppColors.darkInputBorder : AppColors.lightInputBorder;
  Color get navBg => isDark ? AppColors.darkNavBg : AppColors.lightNavBg;
  Color get accent => isDark ? AppColors.accent : AppColors.accentDark;
  Color get green => AppColors.green;
  Color get red => AppColors.red;
  Color get yellow => AppColors.yellow;

  // Gradient helpers
  LinearGradient get accentGradient => const LinearGradient(
    colors: [AppColors.accent, AppColors.rose],
  );

  LinearGradient get greenGradient => const LinearGradient(
    colors: [AppColors.green, Color(0xFF10B981)],
  );

  LinearGradient get blueGradient => const LinearGradient(
    colors: [AppColors.blue, AppColors.cyan],
  );

  LinearGradient get purpleGradient => const LinearGradient(
    colors: [AppColors.purple, Color(0xFF7C3AED)],
  );

  ThemeData get themeData => ThemeData(
    brightness: isDark ? Brightness.dark : Brightness.light,
    scaffoldBackgroundColor: bg,
    fontFamily: 'SF Pro Display',
    colorScheme: ColorScheme(
      brightness: isDark ? Brightness.dark : Brightness.light,
      primary: accent,
      onPrimary: Colors.white,
      secondary: AppColors.accent,
      onSecondary: Colors.white,
      error: AppColors.red,
      onError: Colors.white,
      surface: card,
      onSurface: text,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      titleTextStyle: TextStyle(
        color: text,
        fontSize: 20,
        fontWeight: FontWeight.w800,
      ),
    ),
  );
}
