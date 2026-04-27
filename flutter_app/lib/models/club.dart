/// Модель клуба
///
/// Организационная единица, объединяющая тренеров.
/// Управляется суперадмином.
library;

import 'dart:convert';

/// Модель клуба
class Club {
  final String id;
  final String name;
  final String city;
  final List<String> sportTypes;
  final String? headTrainerId;
  final String? createdAt;

  const Club({
    required this.id,
    required this.name,
    this.city = '',
    this.sportTypes = const [],
    this.headTrainerId,
    this.createdAt,
  });

  /// Создание из JSON ответа API
  factory Club.fromJson(Map<String, dynamic> json) {
    return Club(
      id: json['id'] as String,
      name: json['name'] as String,
      city: json['city'] as String? ?? '',
      sportTypes: _parseStringList(json['sportTypes']),
      headTrainerId: json['headTrainerId'] as String?,
      createdAt: json['createdAt'] as String?,
    );
  }

  /// Конвертация в JSON
  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'city': city,
      'sportTypes': sportTypes,
      'headTrainerId': headTrainerId,
    };
  }

  static List<String> _parseStringList(dynamic value) {
    if (value == null) return [];
    if (value is List) return value.cast<String>();
    if (value is String) {
      try {
        final decoded = jsonDecode(value);
        if (decoded is List) return decoded.cast<String>();
      } catch (_) {
        // Игнорируем ошибки
      }
    }
    return [];
  }
}
