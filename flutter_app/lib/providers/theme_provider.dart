/// Провайдер темы — управление тёмной/светлой темой
///
/// Сохраняет выбор пользователя в SharedPreferences.
/// По умолчанию следует системной теме устройства.
library;

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Провайдер управления темой приложения
class ThemeProvider extends ChangeNotifier {
  static const String _themeKey = 'iborcuha_dark_mode';

  bool _isDark = false;
  bool _isInitialized = false;

  /// Тёмная тема включена
  bool get isDark => _isDark;

  /// Инициализирован ли провайдер
  bool get isInitialized => _isInitialized;

  /// Текущий режим яркости
  Brightness get brightness => _isDark ? Brightness.dark : Brightness.light;

  /// Инициализация — загрузка сохранённой темы
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _isDark = prefs.getBool(_themeKey) ?? false;
    _isInitialized = true;
    notifyListeners();
  }

  /// Переключить тему
  Future<void> toggleTheme() async {
    _isDark = !_isDark;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_themeKey, _isDark);
  }

  /// Установить конкретную тему
  Future<void> setDark(bool dark) async {
    if (_isDark == dark) return;
    _isDark = dark;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_themeKey, _isDark);
  }
}
