/// Тесты модели заявки на регистрацию
import 'package:flutter_test/flutter_test.dart';
import 'package:iborcuha/models/pending_registration.dart';

void main() {
  group('PendingRegistration', () {
    test('создание из JSON', () {
      final json = {
        'id': 'pr1',
        'name': 'Новый Тренер',
        'phone': '89001234567',
        'clubName': 'Fight Club',
        'sportType': 'bjj',
        'city': 'Москва',
        'plainPassword': 'pass123',
        'status': 'pending',
        'createdAt': '2026-03-14T10:00:00.000Z',
      };

      final reg = PendingRegistration.fromJson(json);

      expect(reg.id, 'pr1');
      expect(reg.name, 'Новый Тренер');
      expect(reg.phone, '89001234567');
      expect(reg.clubName, 'Fight Club');
      expect(reg.sportType, 'bjj');
      expect(reg.city, 'Москва');
      expect(reg.status, 'pending');
    });

    test('минимальные поля', () {
      final json = {
        'id': 'pr2',
        'name': 'Тест',
        'phone': '123',
      };

      final reg = PendingRegistration.fromJson(json);

      expect(reg.clubName, isNull);
      expect(reg.sportType, isNull);
      expect(reg.city, isNull);
      expect(reg.status, 'pending');
    });

    test('статус approved', () {
      final json = {
        'id': 'pr3',
        'name': 'Одобренный',
        'phone': '456',
        'status': 'approved',
      };

      final reg = PendingRegistration.fromJson(json);
      expect(reg.status, 'approved');
    });

    test('статус rejected', () {
      final json = {
        'id': 'pr4',
        'name': 'Отклонённый',
        'phone': '789',
        'status': 'rejected',
      };

      final reg = PendingRegistration.fromJson(json);
      expect(reg.status, 'rejected');
    });
  });
}
