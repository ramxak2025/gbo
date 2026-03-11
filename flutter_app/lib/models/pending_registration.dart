/// Модель заявки на регистрацию тренера
///
/// Заявки ожидают одобрения суперадмином.
library;

/// Модель ожидающей регистрации
class PendingRegistration {
  final String id;
  final String name;
  final String phone;
  final String? clubName;
  final String? sportType;
  final String? city;
  final String? plainPassword;
  final String status;
  final String? createdAt;

  const PendingRegistration({
    required this.id,
    required this.name,
    required this.phone,
    this.clubName,
    this.sportType,
    this.city,
    this.plainPassword,
    this.status = 'pending',
    this.createdAt,
  });

  /// Создание из JSON ответа API
  factory PendingRegistration.fromJson(Map<String, dynamic> json) {
    return PendingRegistration(
      id: json['id'] as String,
      name: json['name'] as String,
      phone: json['phone'] as String,
      clubName: json['clubName'] as String?,
      sportType: json['sportType'] as String?,
      city: json['city'] as String?,
      plainPassword: json['plainPassword'] as String?,
      status: json['status'] as String? ?? 'pending',
      createdAt: json['createdAt'] as String?,
    );
  }
}
