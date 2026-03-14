/// Тесты сервиса авторизации
///
/// Проверяет AuthData: парсинг, сериализацию, конвертацию.
import 'package:flutter_test/flutter_test.dart';
import 'package:iborcuha/services/auth_service.dart';
import 'package:iborcuha/models/user.dart';

void main() {
  group('AuthData', () {
    test('создание из JSON (тренер)', () {
      final json = {
        'token': 'jwt-test-token',
        'userId': 'u1',
        'role': 'trainer',
        'studentId': null,
        'user': {
          'id': 'u1',
          'name': 'Тренер',
          'phone': '123',
          'role': 'trainer',
        },
        'student': null,
      };

      final auth = AuthData.fromJson(json);

      expect(auth.token, 'jwt-test-token');
      expect(auth.userId, 'u1');
      expect(auth.role, UserRole.trainer);
      expect(auth.studentId, isNull);
      expect(auth.user.name, 'Тренер');
      expect(auth.studentData, isNull);
    });

    test('создание из JSON (ученик)', () {
      final json = {
        'token': 'jwt-student',
        'userId': 'u1',
        'role': 'student',
        'studentId': 's1',
        'user': {
          'id': 'u1',
          'name': 'Тренер',
          'phone': '123',
          'role': 'trainer',
        },
        'student': {
          'id': 's1',
          'name': 'Ученик',
          'phone': '456',
        },
      };

      final auth = AuthData.fromJson(json);

      expect(auth.role, UserRole.student);
      expect(auth.studentId, 's1');
      expect(auth.studentData, isNotNull);
      expect(auth.studentData!['name'], 'Ученик');
    });

    test('конвертация в JSON и обратно', () {
      final original = AuthData(
        token: 'test-token',
        userId: 'u1',
        role: UserRole.trainer,
        user: const User(
          id: 'u1',
          name: 'Тренер',
          phone: '123',
          role: UserRole.trainer,
          city: 'Москва',
        ),
      );

      final json = original.toJson();
      final restored = AuthData.fromJson(json);

      expect(restored.token, original.token);
      expect(restored.userId, original.userId);
      expect(restored.role, original.role);
      expect(restored.user.name, original.user.name);
      expect(restored.user.city, original.user.city);
    });

    test('конвертация с данными ученика', () {
      final original = AuthData(
        token: 'tok',
        userId: 'u1',
        role: UserRole.student,
        studentId: 's1',
        user: const User(
          id: 'u1',
          name: 'Тренер',
          phone: '123',
          role: UserRole.trainer,
        ),
        studentData: {'id': 's1', 'name': 'Ученик'},
      );

      final json = original.toJson();

      expect(json['studentId'], 's1');
      expect(json['student'], isNotNull);
      expect(json['role'], 'student');
    });
  });
}
