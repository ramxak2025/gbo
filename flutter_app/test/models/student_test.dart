/// Тесты модели ученика
///
/// Проверяет парсинг JSON, статус подписки, статусы.
import 'package:flutter_test/flutter_test.dart';
import 'package:iborcuha/models/student.dart';

void main() {
  group('StudentStatus', () {
    test('парсинг из строки', () {
      expect(StudentStatus.fromString('sick'), StudentStatus.sick);
      expect(StudentStatus.fromString('injury'), StudentStatus.injury);
      expect(StudentStatus.fromString('skip'), StudentStatus.skip);
      expect(StudentStatus.fromString(null), isNull);
      expect(StudentStatus.fromString('unknown'), isNull);
    });

    test('конвертация в API строку', () {
      expect(StudentStatus.sick.toApiString(), 'sick');
      expect(StudentStatus.active.toApiString(), isNull);
    });
  });

  group('Student', () {
    test('создание из JSON', () {
      final json = {
        'id': 'student1',
        'trainerId': 'trainer1',
        'groupId': 'group1',
        'name': 'Алексей Иванов',
        'phone': '+79001234567',
        'weight': 75.5,
        'belt': 'синий',
        'birthDate': '2005-03-15',
        'avatar': null,
        'subscriptionExpiresAt': '2030-12-31T23:59:59.000Z',
        'status': 'sick',
        'trainingStartDate': '2023-01-01',
        'isDemo': false,
      };

      final student = Student.fromJson(json);

      expect(student.id, 'student1');
      expect(student.trainerId, 'trainer1');
      expect(student.groupId, 'group1');
      expect(student.name, 'Алексей Иванов');
      expect(student.weight, 75.5);
      expect(student.belt, 'синий');
      expect(student.status, StudentStatus.sick);
    });

    test('подписка активна (будущая дата)', () {
      final student = Student(
        id: 's1',
        trainerId: 't1',
        name: 'Тест',
        phone: '123',
        subscriptionExpiresAt: '2030-12-31T23:59:59.000Z',
      );

      expect(student.isSubscriptionActive, true);
    });

    test('подписка неактивна (прошедшая дата)', () {
      final student = Student(
        id: 's1',
        trainerId: 't1',
        name: 'Тест',
        phone: '123',
        subscriptionExpiresAt: '2020-01-01T00:00:00.000Z',
      );

      expect(student.isSubscriptionActive, false);
    });

    test('подписка неактивна (null)', () {
      final student = Student(
        id: 's1',
        trainerId: 't1',
        name: 'Тест',
        phone: '123',
      );

      expect(student.isSubscriptionActive, false);
    });

    test('конвертация в JSON', () {
      final student = Student(
        id: 's1',
        trainerId: 't1',
        name: 'Тест',
        phone: '123',
        weight: 70.0,
        belt: 'белый',
      );

      final json = student.toJson();

      expect(json['name'], 'Тест');
      expect(json['phone'], '123');
      expect(json['weight'], 70.0);
      expect(json['belt'], 'белый');
    });

    test('copyWith', () {
      final student = Student(
        id: 's1',
        trainerId: 't1',
        name: 'Старое',
        phone: '123',
        weight: 70.0,
      );

      final updated = student.copyWith(name: 'Новое', weight: 80.0);

      expect(updated.name, 'Новое');
      expect(updated.weight, 80.0);
      expect(updated.id, 's1');
      expect(updated.phone, '123');
    });
  });
}
