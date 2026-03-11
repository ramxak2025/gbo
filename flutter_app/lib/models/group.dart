/// Модель группы (тренировочная группа)
///
/// Группа объединяет учеников тренера. Содержит расписание,
/// стоимость подписки и настройки посещаемости.
library;

/// Модель тренировочной группы
class Group {
  final String id;
  final String trainerId;
  final String name;
  final String schedule;
  final int subscriptionCost;
  final bool attendanceEnabled;
  final String? sportType;
  final String? pinnedMaterialId;

  const Group({
    required this.id,
    required this.trainerId,
    required this.name,
    this.schedule = '',
    this.subscriptionCost = 0,
    this.attendanceEnabled = false,
    this.sportType,
    this.pinnedMaterialId,
  });

  /// Создание из JSON ответа API
  factory Group.fromJson(Map<String, dynamic> json) {
    return Group(
      id: json['id'] as String,
      trainerId: json['trainerId'] as String,
      name: json['name'] as String,
      schedule: json['schedule'] as String? ?? '',
      subscriptionCost: json['subscriptionCost'] as int? ?? 0,
      attendanceEnabled: json['attendanceEnabled'] as bool? ?? false,
      sportType: json['sportType'] as String?,
      pinnedMaterialId: json['pinnedMaterialId'] as String?,
    );
  }

  /// Конвертация в JSON
  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'schedule': schedule,
      'subscriptionCost': subscriptionCost,
      'attendanceEnabled': attendanceEnabled,
      'sportType': sportType,
      'pinnedMaterialId': pinnedMaterialId,
    };
  }

  /// Копирование с изменениями
  Group copyWith({
    String? name,
    String? schedule,
    int? subscriptionCost,
    bool? attendanceEnabled,
    String? sportType,
    String? pinnedMaterialId,
  }) {
    return Group(
      id: id,
      trainerId: trainerId,
      name: name ?? this.name,
      schedule: schedule ?? this.schedule,
      subscriptionCost: subscriptionCost ?? this.subscriptionCost,
      attendanceEnabled: attendanceEnabled ?? this.attendanceEnabled,
      sportType: sportType ?? this.sportType,
      pinnedMaterialId: pinnedMaterialId ?? this.pinnedMaterialId,
    );
  }
}
