/// Тесты модели AppData
///
/// Проверяет парсинг полного ответа API GET /api/data.
import 'package:flutter_test/flutter_test.dart';
import 'package:iborcuha/models/app_data.dart';

void main() {
  group('AppData', () {
    test('парсинг полного JSON ответа', () {
      final json = {
        'users': [
          {
            'id': 'u1',
            'name': 'Тренер',
            'phone': '123',
            'role': 'trainer',
          },
        ],
        'students': [
          {
            'id': 's1',
            'trainerId': 'u1',
            'name': 'Ученик',
            'phone': '456',
          },
        ],
        'groups': [
          {
            'id': 'g1',
            'trainerId': 'u1',
            'name': 'Группа 1',
          },
        ],
        'transactions': [
          {
            'id': 't1',
            'trainerId': 'u1',
            'type': 'income',
            'amount': 5000,
            'date': '2024-01-15T12:00:00.000Z',
          },
        ],
        'tournaments': [],
        'tournamentRegistrations': [],
        'news': [
          {
            'id': 'n1',
            'trainerId': 'u1',
            'title': 'Новость',
            'date': '2024-01-15T12:00:00.000Z',
          },
        ],
        'internalTournaments': [],
        'attendance': [],
        'materials': [],
        'clubs': [],
        'authorInfo': {
          'name': 'Автор',
          'instagram': '@author',
        },
        'pendingRegistrations': [],
      };

      final data = AppData.fromJson(json);

      expect(data.users.length, 1);
      expect(data.users.first.name, 'Тренер');
      expect(data.students.length, 1);
      expect(data.students.first.name, 'Ученик');
      expect(data.groups.length, 1);
      expect(data.groups.first.name, 'Группа 1');
      expect(data.transactions.length, 1);
      expect(data.transactions.first.amount, 5000);
      expect(data.news.length, 1);
      expect(data.authorInfo.name, 'Автор');
      expect(data.authorInfo.instagram, '@author');
    });

    test('парсинг пустого JSON', () {
      final json = <String, dynamic>{};
      final data = AppData.fromJson(json);

      expect(data.users, isEmpty);
      expect(data.students, isEmpty);
      expect(data.groups, isEmpty);
      expect(data.tournaments, isEmpty);
    });

    test('empty константа', () {
      const data = AppData.empty;

      expect(data.users, isEmpty);
      expect(data.students, isEmpty);
      expect(data.authorInfo.name, isNull);
    });
  });
}
