/// Модель пользователя (тренер / суперадмин)
///
/// Содержит все поля пользователя из API.
/// Используется для аутентификации и отображения профиля.
library;

import 'dart:convert';

/// Роль пользователя в системе
enum UserRole {
  superadmin,
  trainer,
  student;

  /// Парсинг роли из строки API
  static UserRole fromString(String role) {
    switch (role) {
      case 'superadmin':
        return UserRole.superadmin;
      case 'trainer':
        return UserRole.trainer;
      case 'student':
        return UserRole.student;
      default:
        throw ArgumentError('Неизвестная роль: $role');
    }
  }
}

/// Модель пользователя системы (тренер или суперадмин)
class User {
  final String id;
  final String name;
  final String phone;
  final UserRole role;
  final String? avatar;
  final String? clubName;
  final String? clubId;
  final bool isHeadTrainer;
  final String? sportType;
  final List<String> sportTypes;
  final String? city;
  final bool isDemo;
  final List<String> materialCategories;
  final String? plainPassword;

  const User({
    required this.id,
    required this.name,
    required this.phone,
    required this.role,
    this.avatar,
    this.clubName,
    this.clubId,
    this.isHeadTrainer = false,
    this.sportType,
    this.sportTypes = const [],
    this.city,
    this.isDemo = false,
    this.materialCategories = const [],
    this.plainPassword,
  });

  /// Создание из JSON ответа API
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      name: json['name'] as String,
      phone: json['phone'] as String,
      role: UserRole.fromString(json['role'] as String),
      avatar: json['avatar'] as String?,
      clubName: json['clubName'] as String?,
      clubId: json['clubId'] as String?,
      isHeadTrainer: json['isHeadTrainer'] as bool? ?? false,
      sportType: json['sportType'] as String?,
      sportTypes: _parseStringList(json['sportTypes']),
      city: json['city'] as String?,
      isDemo: json['isDemo'] as bool? ?? false,
      materialCategories: _parseStringList(json['materialCategories']),
      plainPassword: json['plainPassword'] as String?,
    );
  }

  /// Конвертация в JSON для отправки на API
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'role': role.name,
      'avatar': avatar,
      'clubName': clubName,
      'clubId': clubId,
      'isHeadTrainer': isHeadTrainer,
      'sportType': sportType,
      'sportTypes': sportTypes,
      'city': city,
    };
  }

  /// Копирование с изменениями
  User copyWith({
    String? name,
    String? phone,
    String? avatar,
    String? clubName,
    String? clubId,
    bool? isHeadTrainer,
    String? sportType,
    List<String>? sportTypes,
    String? city,
    List<String>? materialCategories,
  }) {
    return User(
      id: id,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      role: role,
      avatar: avatar ?? this.avatar,
      clubName: clubName ?? this.clubName,
      clubId: clubId ?? this.clubId,
      isHeadTrainer: isHeadTrainer ?? this.isHeadTrainer,
      sportType: sportType ?? this.sportType,
      sportTypes: sportTypes ?? this.sportTypes,
      city: city ?? this.city,
      isDemo: isDemo,
      materialCategories: materialCategories ?? this.materialCategories,
      plainPassword: plainPassword,
    );
  }

  static List<String> _parseStringList(dynamic value) {
    if (value == null) return [];
    if (value is List) return value.cast<String>();
    if (value is String) {
      try {
        final decoded = jsonDecode(value);
        if (decoded is List) return decoded.cast<String>();
      } catch (_) {
        // Игнорируем ошибки парсинга
      }
    }
    return [];
  }
}
