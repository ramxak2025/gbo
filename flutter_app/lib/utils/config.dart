/// Конфигурация приложения
///
/// URL бэкенда и другие настройки.
/// В production нужно заменить на реальный URL.
library;

/// Конфигурация API
class AppConfig {
  /// URL бэкенда (общий с веб-версией)
  /// Для разработки: http://10.0.2.2:3000 (Android эмулятор)
  /// Для production: https://your-domain.com
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  /// Название приложения
  static const String appName = 'iBorcuha';

  /// Версия приложения
  static const String appVersion = '1.0.0';
}
