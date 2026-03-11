/// Тесты моделей турниров
///
/// Проверяет парсинг внешних и внутренних турниров.
import 'package:flutter_test/flutter_test.dart';
import 'package:iborcuha/models/tournament.dart';
import 'package:iborcuha/models/internal_tournament.dart';

void main() {
  group('Tournament', () {
    test('создание из JSON', () {
      final json = {
        'id': 't1',
        'title': 'Чемпионат города',
        'coverImage': 'https://example.com/img.jpg',
        'date': '2024-06-15',
        'location': 'Москва, Лужники',
        'description': 'Главный турнир года',
        'createdBy': 'admin1',
      };

      final tournament = Tournament.fromJson(json);

      expect(tournament.id, 't1');
      expect(tournament.title, 'Чемпионат города');
      expect(tournament.coverImage, 'https://example.com/img.jpg');
      expect(tournament.date, '2024-06-15');
      expect(tournament.location, 'Москва, Лужники');
    });

    test('конвертация в JSON', () {
      const tournament = Tournament(
        id: 't1',
        title: 'Тест',
        date: '2024-01-01',
      );

      final json = tournament.toJson();
      expect(json['title'], 'Тест');
      expect(json['date'], '2024-01-01');
    });
  });

  group('TournamentRegistration', () {
    test('создание из JSON', () {
      final json = {
        'tournamentId': 't1',
        'studentId': 's1',
      };

      final reg = TournamentRegistration.fromJson(json);

      expect(reg.tournamentId, 't1');
      expect(reg.studentId, 's1');
    });
  });

  group('InternalTournament', () {
    test('создание из JSON', () {
      final json = {
        'id': 'it1',
        'trainerId': 'trainer1',
        'title': 'Внутренний турнир',
        'date': '2024-03-01',
        'status': 'active',
        'brackets': {'round1': []},
        'sportType': 'mma',
        'coverImage': null,
        'createdAt': '2024-01-01T00:00:00.000Z',
      };

      final tournament = InternalTournament.fromJson(json);

      expect(tournament.id, 'it1');
      expect(tournament.title, 'Внутренний турнир');
      expect(tournament.status, 'active');
      expect(tournament.brackets, isA<Map<String, dynamic>>());
    });

    test('значения по умолчанию', () {
      final json = {
        'id': 'it2',
        'trainerId': 'trainer1',
        'title': 'Тест',
      };

      final tournament = InternalTournament.fromJson(json);

      expect(tournament.status, 'active');
      expect(tournament.brackets, isEmpty);
    });
  });
}
