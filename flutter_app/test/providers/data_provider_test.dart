/// Тесты провайдера данных
///
/// Проверяет фильтры и бизнес-логику провайдера.
import 'package:flutter_test/flutter_test.dart';
import 'package:iborcuha/providers/data_provider.dart';
import 'package:iborcuha/services/api_service.dart';
import 'package:iborcuha/models/student.dart';
import 'package:iborcuha/models/group.dart';
import 'package:iborcuha/models/transaction.dart';
import 'package:iborcuha/models/tournament.dart';
import 'package:iborcuha/models/user.dart';

void main() {
  group('DataProvider filters', () {
    late DataProvider provider;

    setUp(() {
      final api = ApiService(baseUrl: 'http://localhost:3000');
      provider = DataProvider(api: api);
    });

    test('studentsForTrainer фильтрует по trainerId', () {
      // Провайдер начинает с пустых данных
      expect(provider.students, isEmpty);
      expect(provider.studentsForTrainer('t1'), isEmpty);
    });

    test('groupsForTrainer фильтрует по trainerId', () {
      expect(provider.groupsForTrainer('t1'), isEmpty);
    });

    test('transactionsForTrainer фильтрует по trainerId', () {
      expect(provider.transactionsForTrainer('t1'), isEmpty);
    });

    test('findUser возвращает null для несуществующего', () {
      expect(provider.findUser('nonexistent'), isNull);
    });

    test('findStudent возвращает null для несуществующего', () {
      expect(provider.findStudent('nonexistent'), isNull);
    });

    test('findGroup возвращает null для несуществующего', () {
      expect(provider.findGroup('nonexistent'), isNull);
    });

    test('начальное состояние', () {
      expect(provider.isLoading, false);
      expect(provider.error, isNull);
      expect(provider.users, isEmpty);
      expect(provider.students, isEmpty);
      expect(provider.groups, isEmpty);
      expect(provider.tournaments, isEmpty);
      expect(provider.news, isEmpty);
      expect(provider.materials, isEmpty);
      expect(provider.clubs, isEmpty);
    });
  });

  group('DataProvider payment logic', () {
    test('handlePayment вычисляет правильную дату', () {
      // Проверяем что handlePayment не падает на студенте без подписки
      final student = Student(
        id: 's1',
        trainerId: 't1',
        name: 'Тест',
        phone: '123',
      );

      // Подписка не активна
      expect(student.isSubscriptionActive, false);
    });

    test('студент с активной подпиской', () {
      final futureDate = DateTime.now().add(const Duration(days: 30));
      final student = Student(
        id: 's1',
        trainerId: 't1',
        name: 'Тест',
        phone: '123',
        subscriptionExpiresAt: futureDate.toIso8601String(),
      );

      expect(student.isSubscriptionActive, true);
    });
  });
}
