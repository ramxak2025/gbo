/// Утилиты для работы с датами
///
/// Форматирование дат на русском языке.
/// Вычисление относительных дат.
library;

import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';

/// Инициализация русской локали
Future<void> initDateFormatting() async {
  await initializeDateFormatting('ru_RU', null);
}

/// Форматировать дату для отображения (1 января 2024)
String formatDate(String? dateStr) {
  if (dateStr == null) return '';
  final date = DateTime.tryParse(dateStr);
  if (date == null) return dateStr;
  return DateFormat('d MMMM yyyy', 'ru_RU').format(date);
}

/// Короткий формат даты (1 янв)
String formatDateShort(String? dateStr) {
  if (dateStr == null) return '';
  final date = DateTime.tryParse(dateStr);
  if (date == null) return dateStr;
  return DateFormat('d MMM', 'ru_RU').format(date);
}

/// Формат даты для API (2024-01-01)
String formatDateApi(DateTime date) {
  return DateFormat('yyyy-MM-dd').format(date);
}

/// Относительная дата (сегодня, вчера, 3 дня назад)
String relativeDate(String? dateStr) {
  if (dateStr == null) return '';
  final date = DateTime.tryParse(dateStr);
  if (date == null) return dateStr;

  final now = DateTime.now();
  final diff = now.difference(date);

  if (diff.inDays == 0) return 'Сегодня';
  if (diff.inDays == 1) return 'Вчера';
  if (diff.inDays < 7) return '${diff.inDays} дн. назад';
  return formatDate(dateStr);
}

/// Сколько дней до даты
int daysUntil(String? dateStr) {
  if (dateStr == null) return -1;
  final date = DateTime.tryParse(dateStr);
  if (date == null) return -1;
  return date.difference(DateTime.now()).inDays;
}

/// Подписка активна?
bool isSubscriptionActive(String? expiresAt) {
  if (expiresAt == null) return false;
  final date = DateTime.tryParse(expiresAt);
  if (date == null) return false;
  return date.isAfter(DateTime.now());
}
