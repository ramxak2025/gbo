/// Конфигурация приложения
///
/// URL бэкенда — общий с веб-версией (iborcuha.ru).
library;

/// Конфигурация API
class AppConfig {
  /// URL бэкенда (VDS сервер)
  /// Переопределить: flutter run --dart-define=API_BASE_URL=http://localhost:3000
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://iborcuha.ru',
  );

  /// Название приложения
  static const String appName = 'iBorcuha';

  /// Версия приложения
  static const String appVersion = '1.0.0';
}
