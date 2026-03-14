/// Тесты модели внутреннего турнира
import 'package:flutter_test/flutter_test.dart';
import 'package:iborcuha/models/internal_tournament.dart';

void main() {
  group('InternalTournament', () {
    test('создание из JSON', () {
      final json = {
        'id': 'it1',
        'trainerId': 't1',
        'title': 'Внутренний турнир',
        'date': '2026-03-20',
        'status': 'active',
        'brackets': {'round1': []},
        'sportType': 'bjj',
        'coverImage': '/uploads/cover.jpg',
        'createdAt': '2026-03-14T10:00:00.000Z',
      };

      final t = InternalTournament.fromJson(json);

      expect(t.id, 'it1');
      expect(t.trainerId, 't1');
      expect(t.title, 'Внутренний турнир');
      expect(t.date, '2026-03-20');
      expect(t.status, 'active');
      expect(t.brackets, isA<Map>());
      expect(t.sportType, 'bjj');
      expect(t.coverImage, '/uploads/cover.jpg');
    });

    test('значения по умолчанию', () {
      final json = {
        'id': 'it2',
        'trainerId': 't1',
        'title': 'Минимальный',
      };

      final t = InternalTournament.fromJson(json);

      expect(t.date, isNull);
      expect(t.status, 'active');
      expect(t.brackets, isEmpty);
      expect(t.sportType, isNull);
      expect(t.coverImage, isNull);
    });

    test('конвертация в JSON', () {
      const t = InternalTournament(
        id: 'it1',
        trainerId: 't1',
        title: 'Тест',
        date: '2026-03-20',
        brackets: {'data': []},
        sportType: 'mma',
      );

      final json = t.toJson();

      expect(json['title'], 'Тест');
      expect(json['date'], '2026-03-20');
      expect(json['brackets'], isA<Map>());
      expect(json['sportType'], 'mma');
    });
  });
}
