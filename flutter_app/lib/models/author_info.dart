/// Модель информации об авторе
///
/// Метаданные приложения — контакты разработчика.
library;

/// Модель информации об авторе
class AuthorInfo {
  final String? name;
  final String? instagram;
  final String? website;
  final String? description;
  final String? phone;

  const AuthorInfo({
    this.name,
    this.instagram,
    this.website,
    this.description,
    this.phone,
  });

  /// Создание из JSON ответа API
  factory AuthorInfo.fromJson(Map<String, dynamic> json) {
    return AuthorInfo(
      name: json['name'] as String?,
      instagram: json['instagram'] as String?,
      website: json['website'] as String?,
      description: json['description'] as String?,
      phone: json['phone'] as String?,
    );
  }

  /// Конвертация в JSON
  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'instagram': instagram,
      'website': website,
      'description': description,
      'phone': phone,
    };
  }
}
