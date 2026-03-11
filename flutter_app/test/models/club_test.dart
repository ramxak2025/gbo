/// Тесты модели клуба
///
/// Проверяет парсинг JSON и конвертацию.
import 'package:flutter_test/flutter_test.dart';
import 'package:iborcuha/models/club.dart';

void main() {
  group('Club', () {
    test('создание из JSON', () {
      final json = {
        'id': 'c1',
        'name': 'Клуб Чемпионов',
        'city': 'Москва',
        'sportTypes': ['mma', 'boxing'],
        'headTrainerId': 't1',
        'createdAt': '2024-01-01T00:00:00.000Z',
      };

      final club = Club.fromJson(json);

      expect(club.id, 'c1');
      expect(club.name, 'Клуб Чемпионов');
      expect(club.city, 'Москва');
      expect(club.sportTypes, ['mma', 'boxing']);
      expect(club.headTrainerId, 't1');
    });

    test('значения по умолчанию', () {
      final json = {
        'id': 'c2',
        'name': 'Клуб',
      };

      final club = Club.fromJson(json);

      expect(club.city, '');
      expect(club.sportTypes, isEmpty);
      expect(club.headTrainerId, isNull);
    });

    test('конвертация в JSON', () {
      const club = Club(
        id: 'c1',
        name: 'Тест',
        city: 'СПб',
        sportTypes: ['judo'],
      );

      final json = club.toJson();

      expect(json['name'], 'Тест');
      expect(json['city'], 'СПб');
      expect(json['sportTypes'], ['judo']);
    });
  });
}
