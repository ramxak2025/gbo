/// Тесты модели группы
///
/// Проверяет парсинг, конвертацию и копирование.
import 'package:flutter_test/flutter_test.dart';
import 'package:iborcuha/models/group.dart';

void main() {
  group('Group', () {
    test('создание из JSON', () {
      final json = {
        'id': 'g1',
        'trainerId': 't1',
        'name': 'Утренняя группа',
        'schedule': 'Пн, Ср, Пт 10:00',
        'subscriptionCost': 3000,
        'attendanceEnabled': true,
        'sportType': 'boxing',
        'pinnedMaterialId': 'm1',
      };

      final group = Group.fromJson(json);

      expect(group.id, 'g1');
      expect(group.trainerId, 't1');
      expect(group.name, 'Утренняя группа');
      expect(group.schedule, 'Пн, Ср, Пт 10:00');
      expect(group.subscriptionCost, 3000);
      expect(group.attendanceEnabled, true);
      expect(group.sportType, 'boxing');
      expect(group.pinnedMaterialId, 'm1');
    });

    test('значения по умолчанию', () {
      final json = {
        'id': 'g2',
        'trainerId': 't1',
        'name': 'Группа',
      };

      final group = Group.fromJson(json);

      expect(group.schedule, '');
      expect(group.subscriptionCost, 0);
      expect(group.attendanceEnabled, false);
      expect(group.sportType, isNull);
    });

    test('конвертация в JSON', () {
      final group = Group(
        id: 'g1',
        trainerId: 't1',
        name: 'Тест',
        subscriptionCost: 5000,
      );

      final json = group.toJson();

      expect(json['name'], 'Тест');
      expect(json['subscriptionCost'], 5000);
    });

    test('copyWith', () {
      final group = Group(
        id: 'g1',
        trainerId: 't1',
        name: 'Старое',
        subscriptionCost: 1000,
      );

      final updated = group.copyWith(name: 'Новое', subscriptionCost: 2000);

      expect(updated.name, 'Новое');
      expect(updated.subscriptionCost, 2000);
      expect(updated.id, 'g1');
    });
  });
}
