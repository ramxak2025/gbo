/// Тема приложения — синхронизирована с мобильной веб-версией
///
/// Цвета, градиенты, типографика и эффекты
/// точно соответствуют index.css веб-версии.
library;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Цвета — синхронизированы с веб-версией (index.css @theme)
class LiquidGlassColors {
  // === Тёмная тема (из веб @theme) ===
  static const Color dark900 = Color(0xFF050505);
  static const Color dark800 = Color(0xFF09090B);
  static const Color dark700 = Color(0xFF111113);
  static const Color dark600 = Color(0xFF1A1A1F);
  static const Color dark500 = Color(0xFF27272A);

  // Акцент (красный — как в вебе)
  static const Color accent = Color(0xFFDC2626);
  static const Color accentDark = Color(0xFFB91C1C);
  static const Color accentLight = Color(0xFFEF4444);

  // === Светлая тема ===
  static const Color lightBackground = Color(0xFFF5F5F7);
  static const Color lightSurface = Color(0xB3FFFFFF);
  static const Color lightBorder = Color(0x99FFFFFF);
  static const Color lightShadow = Color(0x0A000000);
  static const Color lightText = Color(0xFF1C1C1E);
  static const Color lightSecondaryText = Color(0xFF8E8E93);

  // === Тёмная тема ===
  static const Color darkBackground = Color(0xFF050505);
  static const Color darkSurface = Color(0x0DFFFFFF);
  static const Color darkBorder = Color(0x12FFFFFF);
  static const Color darkText = Color(0xFFFFFFFF);
  static const Color darkSecondaryText = Color(0xFF8E8E93);

  // Glass эффекты
  static const Color glassDark = Color(0x0DFFFFFF);
  static const Color glassBorderDark = Color(0x1AFFFFFF);
  static const Color glassLight = Color(0x08000000);
  static const Color glassBorderLight = Color(0x14000000);

  // === Акцентные цвета (iOS стиль) ===
  static const Color primary = Color(0xFF007AFF);
  static const Color success = Color(0xFF34C759);
  static const Color warning = Color(0xFFFF9500);
  static const Color danger = Color(0xFFFF3B30);
  static const Color purple = Color(0xFFAF52DE);
  static const Color teal = Color(0xFF5AC8FA);
  static const Color pink = Color(0xFFFF2D55);

  // Дополнительные цвета из веб-версии
  static const Color blue500 = Color(0xFF3B82F6);
  static const Color green500 = Color(0xFF22C55E);
  static const Color indigo500 = Color(0xFF6366F1);
  static const Color violet500 = Color(0xFF8B5CF6);
  static const Color amber500 = Color(0xFFF59E0B);
  static const Color rose500 = Color(0xFFF43F5E);

  /// Градиент фона (как Layout.jsx — atmospheric gradient blobs)
  static LinearGradient backgroundGradient({required bool isDark}) {
    if (isDark) {
      return const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          Color(0xFF0A0A1A),
          Color(0xFF1A0A2E),
          Color(0xFF0A1628),
        ],
      );
    }
    return const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [
        Color(0xFFE8EAF6),
        Color(0xFFF3E5F5),
        Color(0xFFE0F7FA),
      ],
    );
  }

  // Радиусы из веб-версии
  static const double radiusSquircle = 24.0;
  static const double radiusCard = 20.0;
  static const double radiusButton = 16.0;
}

class AppTheme {
  static ThemeData light() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: Colors.transparent,
      colorScheme: const ColorScheme.light(
        primary: LiquidGlassColors.primary,
        onPrimary: Colors.white,
        secondary: LiquidGlassColors.accent,
        surface: LiquidGlassColors.lightSurface,
        onSurface: LiquidGlassColors.lightText,
        error: LiquidGlassColors.danger,
      ),
      fontFamily: 'SF Pro Display',
      textTheme: const TextTheme(
        headlineLarge: TextStyle(fontSize: 34, fontWeight: FontWeight.w700, letterSpacing: -0.5, color: LiquidGlassColors.lightText),
        headlineMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, letterSpacing: -0.3, color: LiquidGlassColors.lightText),
        titleLarge: TextStyle(fontSize: 22, fontWeight: FontWeight.w600, color: LiquidGlassColors.lightText),
        titleMedium: TextStyle(fontSize: 17, fontWeight: FontWeight.w600, color: LiquidGlassColors.lightText),
        bodyLarge: TextStyle(fontSize: 17, fontWeight: FontWeight.w400, color: LiquidGlassColors.lightText),
        bodyMedium: TextStyle(fontSize: 15, fontWeight: FontWeight.w400, color: LiquidGlassColors.lightText),
        bodySmall: TextStyle(fontSize: 13, fontWeight: FontWeight.w400, color: LiquidGlassColors.lightSecondaryText),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle.dark,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: LiquidGlassColors.lightSurface,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: LiquidGlassColors.lightBorder)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: LiquidGlassColors.lightBorder)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: LiquidGlassColors.primary, width: 1.5)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: LiquidGlassColors.primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          elevation: 0,
        ),
      ),
    );
  }

  static ThemeData dark() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: Colors.transparent,
      colorScheme: const ColorScheme.dark(
        primary: LiquidGlassColors.primary,
        onPrimary: Colors.white,
        secondary: LiquidGlassColors.accent,
        surface: LiquidGlassColors.darkSurface,
        onSurface: LiquidGlassColors.darkText,
        error: LiquidGlassColors.danger,
      ),
      fontFamily: 'SF Pro Display',
      textTheme: const TextTheme(
        headlineLarge: TextStyle(fontSize: 34, fontWeight: FontWeight.w700, letterSpacing: -0.5, color: LiquidGlassColors.darkText),
        headlineMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, letterSpacing: -0.3, color: LiquidGlassColors.darkText),
        titleLarge: TextStyle(fontSize: 22, fontWeight: FontWeight.w600, color: LiquidGlassColors.darkText),
        titleMedium: TextStyle(fontSize: 17, fontWeight: FontWeight.w600, color: LiquidGlassColors.darkText),
        bodyLarge: TextStyle(fontSize: 17, fontWeight: FontWeight.w400, color: LiquidGlassColors.darkText),
        bodyMedium: TextStyle(fontSize: 15, fontWeight: FontWeight.w400, color: LiquidGlassColors.darkText),
        bodySmall: TextStyle(fontSize: 13, fontWeight: FontWeight.w400, color: LiquidGlassColors.darkSecondaryText),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle.light,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: LiquidGlassColors.darkSurface,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: LiquidGlassColors.darkBorder)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: LiquidGlassColors.darkBorder)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: LiquidGlassColors.primary, width: 1.5)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: LiquidGlassColors.primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          elevation: 0,
        ),
      ),
    );
  }
}
