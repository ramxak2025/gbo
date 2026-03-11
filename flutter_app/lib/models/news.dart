/// Модель новости/объявления
///
/// Новости создаются тренером для определённой группы
/// или для всех учеников.
library;

/// Модель новости
class News {
  final String id;
  final String trainerId;
  final String? groupId;
  final String title;
  final String content;
  final String date;

  const News({
    required this.id,
    required this.trainerId,
    this.groupId,
    required this.title,
    this.content = '',
    required this.date,
  });

  /// Создание из JSON ответа API
  factory News.fromJson(Map<String, dynamic> json) {
    return News(
      id: json['id'] as String,
      trainerId: json['trainerId'] as String,
      groupId: json['groupId'] as String?,
      title: json['title'] as String,
      content: json['content'] as String? ?? '',
      date: json['date'] as String,
    );
  }

  /// Конвертация в JSON
  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'content': content,
      'groupId': groupId,
    };
  }
}
