/// Тесты модели новости
import 'package:flutter_test/flutter_test.dart';
import 'package:iborcuha/models/news.dart';

void main() {
  group('News', () {
    test('создание из JSON', () {
      final json = {
        'id': 'n1',
        'trainerId': 't1',
        'groupId': 'g1',
        'title': 'Смена расписания',
        'content': 'Новое время тренировок',
        'date': '2026-03-14T10:00:00.000Z',
      };

      final news = News.fromJson(json);

      expect(news.id, 'n1');
      expect(news.trainerId, 't1');
      expect(news.groupId, 'g1');
      expect(news.title, 'Смена расписания');
      expect(news.content, 'Новое время тренировок');
    });

    test('создание без группы (общая новость)', () {
      final json = {
        'id': 'n2',
        'trainerId': 't1',
        'groupId': null,
        'title': 'Общая новость',
        'content': null,
        'date': '2026-03-14T10:00:00.000Z',
      };

      final news = News.fromJson(json);

      expect(news.groupId, isNull);
      expect(news.content, '');
    });

    test('конвертация в JSON', () {
      const news = News(
        id: 'n1',
        trainerId: 't1',
        groupId: 'g1',
        title: 'Тест',
        content: 'Контент',
        date: '2026-03-14',
      );

      final json = news.toJson();

      expect(json['title'], 'Тест');
      expect(json['content'], 'Контент');
      expect(json['groupId'], 'g1');
    });
  });
}
