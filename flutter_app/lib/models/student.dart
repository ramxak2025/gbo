/// Модель ученика
///
/// Представляет ученика в системе, привязанного к тренеру.
/// Содержит информацию о подписке, группе, весе и поясе.
library;

/// Статус ученика (болеет, травма, пропуск)
enum StudentStatus {
  active,
  sick,
  injury,
  skip;

  static StudentStatus? fromString(String? status) {
    if (status == null) return null;
    switch (status) {
      case 'sick':
        return StudentStatus.sick;
      case 'injury':
        return StudentStatus.injury;
      case 'skip':
        return StudentStatus.skip;
      default:
        return null;
    }
  }

  String? toApiString() {
    switch (this) {
      case StudentStatus.active:
        return null;
      case StudentStatus.sick:
        return 'sick';
      case StudentStatus.injury:
        return 'injury';
      case StudentStatus.skip:
        return 'skip';
    }
  }
}

/// Модель ученика
class Student {
  final String id;
  final String trainerId;
  final String? groupId;
  final String name;
  final String phone;
  final double? weight;
  final String? belt;
  final String? birthDate;
  final String? avatar;
  final String? subscriptionExpiresAt;
  final StudentStatus? status;
  final String? trainingStartDate;
  final String? createdAt;
  final bool isDemo;
  final String? plainPassword;

  const Student({
    required this.id,
    required this.trainerId,
    this.groupId,
    required this.name,
    required this.phone,
    this.weight,
    this.belt,
    this.birthDate,
    this.avatar,
    this.subscriptionExpiresAt,
    this.status,
    this.trainingStartDate,
    this.createdAt,
    this.isDemo = false,
    this.plainPassword,
  });

  /// Создание из JSON ответа API
  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      id: json['id'] as String,
      trainerId: json['trainerId'] as String,
      groupId: json['groupId'] as String?,
      name: json['name'] as String,
      phone: json['phone'] as String,
      weight: (json['weight'] as num?)?.toDouble(),
      belt: json['belt'] as String?,
      birthDate: json['birthDate'] as String?,
      avatar: json['avatar'] as String?,
      subscriptionExpiresAt: json['subscriptionExpiresAt'] as String?,
      status: StudentStatus.fromString(json['status'] as String?),
      trainingStartDate: json['trainingStartDate'] as String?,
      createdAt: json['createdAt'] as String?,
      isDemo: json['isDemo'] as bool? ?? false,
      plainPassword: json['plainPassword'] as String?,
    );
  }

  /// Конвертация в JSON для отправки на API
  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'phone': phone,
      'weight': weight,
      'belt': belt,
      'birthDate': birthDate,
      'avatar': avatar,
      'groupId': groupId,
      'subscriptionExpiresAt': subscriptionExpiresAt,
      'status': status?.toApiString(),
      'trainingStartDate': trainingStartDate,
    };
  }

  /// Проверка активности подписки
  bool get isSubscriptionActive {
    if (subscriptionExpiresAt == null) return false;
    final expires = DateTime.tryParse(subscriptionExpiresAt!);
    if (expires == null) return false;
    return expires.isAfter(DateTime.now());
  }

  /// Копирование с изменениями
  Student copyWith({
    String? groupId,
    String? name,
    String? phone,
    double? weight,
    String? belt,
    String? birthDate,
    String? avatar,
    String? subscriptionExpiresAt,
    StudentStatus? status,
    String? trainingStartDate,
  }) {
    return Student(
      id: id,
      trainerId: trainerId,
      groupId: groupId ?? this.groupId,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      weight: weight ?? this.weight,
      belt: belt ?? this.belt,
      birthDate: birthDate ?? this.birthDate,
      avatar: avatar ?? this.avatar,
      subscriptionExpiresAt:
          subscriptionExpiresAt ?? this.subscriptionExpiresAt,
      status: status ?? this.status,
      trainingStartDate: trainingStartDate ?? this.trainingStartDate,
      createdAt: createdAt,
      isDemo: isDemo,
      plainPassword: plainPassword,
    );
  }
}
