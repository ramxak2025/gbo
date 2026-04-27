/// Модель посещаемости
///
/// Отслеживает присутствие учеников на тренировках.
/// Привязана к группе, ученику и дате.
library;

/// Модель записи посещаемости
class Attendance {
  final String id;
  final String groupId;
  final String studentId;
  final String date;
  final bool present;

  const Attendance({
    required this.id,
    required this.groupId,
    required this.studentId,
    required this.date,
    required this.present,
  });

  /// Создание из JSON ответа API
  factory Attendance.fromJson(Map<String, dynamic> json) {
    return Attendance(
      id: json['id'] as String,
      groupId: json['groupId'] as String,
      studentId: json['studentId'] as String,
      date: json['date'] as String,
      present: json['present'] as bool,
    );
  }
}

/// Запись для массового сохранения посещаемости
class AttendanceRecord {
  final String studentId;
  final bool present;

  const AttendanceRecord({
    required this.studentId,
    required this.present,
  });

  Map<String, dynamic> toJson() {
    return {
      'studentId': studentId,
      'present': present,
    };
  }
}
