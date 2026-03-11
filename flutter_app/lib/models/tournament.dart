/// Модель турнира (внешний турнир)
///
/// Представляет внешние соревнования, на которые
/// могут регистрироваться ученики.
library;

/// Модель внешнего турнира
class Tournament {
  final String id;
  final String title;
  final String? coverImage;
  final String date;
  final String? location;
  final String? description;
  final String? createdBy;

  const Tournament({
    required this.id,
    required this.title,
    this.coverImage,
    required this.date,
    this.location,
    this.description,
    this.createdBy,
  });

  /// Создание из JSON ответа API
  factory Tournament.fromJson(Map<String, dynamic> json) {
    return Tournament(
      id: json['id'] as String,
      title: json['title'] as String,
      coverImage: json['coverImage'] as String?,
      date: json['date'] as String,
      location: json['location'] as String?,
      description: json['description'] as String?,
      createdBy: json['createdBy'] as String?,
    );
  }

  /// Конвертация в JSON
  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'date': date,
      'location': location,
      'description': description,
      'coverImage': coverImage,
    };
  }
}

/// Регистрация на турнир
class TournamentRegistration {
  final String tournamentId;
  final String studentId;

  const TournamentRegistration({
    required this.tournamentId,
    required this.studentId,
  });

  /// Создание из JSON
  factory TournamentRegistration.fromJson(Map<String, dynamic> json) {
    return TournamentRegistration(
      tournamentId: json['tournamentId'] as String,
      studentId: json['studentId'] as String,
    );
  }
}
