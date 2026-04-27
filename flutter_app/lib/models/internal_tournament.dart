/// Модель внутреннего турнира (сетки/bracket)
///
/// Тренер создаёт внутренние турниры для своих учеников
/// с турнирной сеткой (brackets).
library;

/// Модель внутреннего турнира с турнирной сеткой
class InternalTournament {
  final String id;
  final String trainerId;
  final String title;
  final String? date;
  final String status;
  final Map<String, dynamic> brackets;
  final String? sportType;
  final String? coverImage;
  final String? createdAt;

  const InternalTournament({
    required this.id,
    required this.trainerId,
    required this.title,
    this.date,
    this.status = 'active',
    this.brackets = const {},
    this.sportType,
    this.coverImage,
    this.createdAt,
  });

  /// Создание из JSON ответа API
  factory InternalTournament.fromJson(Map<String, dynamic> json) {
    return InternalTournament(
      id: json['id'] as String,
      trainerId: json['trainerId'] as String,
      title: json['title'] as String,
      date: json['date'] as String?,
      status: json['status'] as String? ?? 'active',
      brackets: json['brackets'] as Map<String, dynamic>? ?? {},
      sportType: json['sportType'] as String?,
      coverImage: json['coverImage'] as String?,
      createdAt: json['createdAt'] as String?,
    );
  }

  /// Конвертация в JSON
  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'date': date,
      'brackets': brackets,
      'sportType': sportType,
      'coverImage': coverImage,
    };
  }
}
