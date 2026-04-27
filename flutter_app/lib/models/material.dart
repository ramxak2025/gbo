/// Модель учебного материала (видео)
///
/// Тренеры загружают видео и привязывают их к группам.
/// Поддерживается категоризация и закрепление материалов.
library;

import 'dart:convert';

/// Модель учебного материала
class TrainingMaterial {
  final String id;
  final String trainerId;
  final String title;
  final String description;
  final String videoUrl;
  final List<String> groupIds;
  final String category;
  final String customThumb;
  final String? createdAt;

  const TrainingMaterial({
    required this.id,
    required this.trainerId,
    required this.title,
    this.description = '',
    required this.videoUrl,
    this.groupIds = const [],
    this.category = 'other',
    this.customThumb = '',
    this.createdAt,
  });

  /// Создание из JSON ответа API
  factory TrainingMaterial.fromJson(Map<String, dynamic> json) {
    return TrainingMaterial(
      id: json['id'] as String,
      trainerId: json['trainerId'] as String,
      title: json['title'] as String,
      description: json['description'] as String? ?? '',
      videoUrl: json['videoUrl'] as String,
      groupIds: _parseStringList(json['groupIds']),
      category: json['category'] as String? ?? 'other',
      customThumb: json['customThumb'] as String? ?? '',
      createdAt: json['createdAt'] as String?,
    );
  }

  /// Конвертация в JSON
  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'description': description,
      'videoUrl': videoUrl,
      'groupIds': groupIds,
      'category': category,
      'customThumb': customThumb,
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
