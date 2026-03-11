/// Тесты справочника видов спорта
///
/// Проверяет поиск и получение названий.
import 'package:flutter_test/flutter_test.dart';
import 'package:iborcuha/utils/sports.dart';

void main() {
  group('sports', () {
    test('список не пуст', () {
      expect(sportsList, isNotEmpty);
      expect(sportsList.length, greaterThan(10));
    });

    test('поиск по ID', () {
      final mma = findSport('mma');
      expect(mma, isNotNull);
      expect(mma!.name, 'ММА');
      expect(mma.emoji, isNotEmpty);
    });

    test('поиск несуществующего', () {
      final result = findSport('nonexistent');
      expect(result, isNull);
    });

    test('поиск с null', () {
      final result = findSport(null);
      expect(result, isNull);
    });

    test('получение названия', () {
      expect(sportName('boxing'), 'Бокс');
      expect(sportName('judo'), 'Дзюдо');
      expect(sportName(null), '');
      expect(sportName('unknown'), 'unknown');
    });

    test('все спорты имеют уникальные ID', () {
      final ids = sportsList.map((s) => s.id).toSet();
      expect(ids.length, sportsList.length);
    });
  });
}
