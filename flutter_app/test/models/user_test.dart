/// Тесты модели пользователя
///
/// Проверяет парсинг JSON, конвертацию, копирование.
import 'package:flutter_test/flutter_test.dart';
import 'package:iborcuha/models/user.dart';

void main() {
  group('UserRole', () {
    test('парсинг из строки', () {
      expect(UserRole.fromString('superadmin'), UserRole.superadmin);
      expect(UserRole.fromString('trainer'), UserRole.trainer);
      expect(UserRole.fromString('student'), UserRole.student);
    });

    test('ошибка при неизвестной роли', () {
      expect(() => UserRole.fromString('unknown'), throwsArgumentError);
    });
  });

  group('User', () {
    test('создание из JSON', () {
      final json = {
        'id': 'user1',
        'name': 'Иван Петров',
        'phone': '+79001234567',
        'role': 'trainer',
        'avatar': null,
        'clubName': 'Клуб Борцов',
        'clubId': 'club1',
        'isHeadTrainer': true,
        'sportType': 'mma',
        'sportTypes': ['mma', 'boxing'],
        'city': 'Москва',
        'isDemo': false,
        'materialCategories': ['technique', 'sparring'],
      };

      final user = User.fromJson(json);

      expect(user.id, 'user1');
      expect(user.name, 'Иван Петров');
      expect(user.phone, '+79001234567');
      expect(user.role, UserRole.trainer);
      expect(user.avatar, isNull);
      expect(user.clubName, 'Клуб Борцов');
      expect(user.clubId, 'club1');
      expect(user.isHeadTrainer, true);
      expect(user.sportType, 'mma');
      expect(user.sportTypes, ['mma', 'boxing']);
      expect(user.city, 'Москва');
      expect(user.isDemo, false);
      expect(user.materialCategories, ['technique', 'sparring']);
    });

    test('JSON с null полями', () {
      final json = {
        'id': 'user2',
        'name': 'Тест',
        'phone': '123',
        'role': 'superadmin',
      };

      final user = User.fromJson(json);

      expect(user.avatar, isNull);
      expect(user.clubName, isNull);
      expect(user.isHeadTrainer, false);
      expect(user.sportTypes, isEmpty);
      expect(user.materialCategories, isEmpty);
    });

    test('конвертация в JSON', () {
      final user = User(
        id: 'test',
        name: 'Тест',
        phone: '123',
        role: UserRole.trainer,
        city: 'СПб',
      );

      final json = user.toJson();

      expect(json['id'], 'test');
      expect(json['name'], 'Тест');
      expect(json['role'], 'trainer');
      expect(json['city'], 'СПб');
    });

    test('copyWith', () {
      final user = User(
        id: 'test',
        name: 'Старое имя',
        phone: '123',
        role: UserRole.trainer,
      );

      final updated = user.copyWith(name: 'Новое имя', city: 'Москва');

      expect(updated.name, 'Новое имя');
      expect(updated.city, 'Москва');
      expect(updated.id, 'test'); // не изменилось
      expect(updated.phone, '123'); // не изменилось
    });
  });
}
