/// Тесты API сервиса
///
/// Проверяет установку токена, формирование заголовков,
/// обработку ошибок.
import 'package:flutter_test/flutter_test.dart';
import 'package:iborcuha/services/api_service.dart';

void main() {
  group('ApiService', () {
    late ApiService api;

    setUp(() {
      api = ApiService(baseUrl: 'http://localhost:3000');
    });

    test('начальный токен null', () {
      expect(api.token, isNull);
    });

    test('установка токена', () {
      api.setToken('test-token-123');
      expect(api.token, 'test-token-123');
    });

    test('очистка токена', () {
      api.setToken('test-token');
      api.setToken(null);
      expect(api.token, isNull);
    });
  });

  group('ApiException', () {
    test('создание с сообщением', () {
      const error = ApiException(
        message: 'Тестовая ошибка',
        statusCode: 400,
      );

      expect(error.message, 'Тестовая ошибка');
      expect(error.statusCode, 400);
      expect(error.toString(), 'Тестовая ошибка');
    });

    test('создание с типом ошибки', () {
      const error = ApiException(
        message: 'Неверный пароль',
        errorType: 'student',
        statusCode: 401,
      );

      expect(error.errorType, 'student');
    });
  });

  group('AuthResult', () {
    test('парсинг из JSON', () {
      final json = {
        'token': 'jwt-token-123',
        'userId': 'user1',
        'role': 'trainer',
        'user': {
          'id': 'user1',
          'name': 'Тренер',
          'phone': '123',
          'role': 'trainer',
        },
      };

      final result = AuthResult.fromJson(json);

      expect(result.token, 'jwt-token-123');
      expect(result.userId, 'user1');
      expect(result.role, 'trainer');
      expect(result.studentId, isNull);
      expect(result.user['name'], 'Тренер');
    });

    test('парсинг с данными ученика', () {
      final json = {
        'token': 'jwt-token',
        'userId': 'user1',
        'role': 'student',
        'studentId': 'student1',
        'user': {
          'id': 'user1',
          'name': 'Тренер',
          'phone': '123',
          'role': 'trainer',
        },
        'student': {
          'id': 'student1',
          'name': 'Ученик',
        },
      };

      final result = AuthResult.fromJson(json);

      expect(result.role, 'student');
      expect(result.studentId, 'student1');
      expect(result.student, isNotNull);
      expect(result.student!['name'], 'Ученик');
    });
  });
}
