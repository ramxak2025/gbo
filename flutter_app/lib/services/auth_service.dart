/// Сервис аутентификации
///
/// Управляет JWT токеном, хранит его в безопасном хранилище.
/// Обрабатывает вход, выход и восстановление сессии.
library;

import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/user.dart';

/// Данные авторизованного пользователя
class AuthData {
  final String token;
  final String userId;
  final UserRole role;
  final String? studentId;
  final User user;
  final Map<String, dynamic>? studentData;

  const AuthData({
    required this.token,
    required this.userId,
    required this.role,
    this.studentId,
    required this.user,
    this.studentData,
  });

  /// Создание из JSON (при входе или восстановлении)
  factory AuthData.fromJson(Map<String, dynamic> json) {
    return AuthData(
      token: json['token'] as String,
      userId: json['userId'] as String,
      role: UserRole.fromString(json['role'] as String),
      studentId: json['studentId'] as String?,
      user: User.fromJson(json['user'] as Map<String, dynamic>),
      studentData: json['student'] as Map<String, dynamic>?,
    );
  }

  /// Конвертация в JSON для хранения
  Map<String, dynamic> toJson() {
    return {
      'token': token,
      'userId': userId,
      'role': role.name,
      'studentId': studentId,
      'user': user.toJson(),
      'student': studentData,
    };
  }
}

/// Сервис безопасного хранения авторизации
class AuthService {
  static const String _tokenKey = 'iborcuha_token';
  static const String _authDataKey = 'iborcuha_auth';

  final FlutterSecureStorage _storage;

  AuthService({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  /// Сохранить данные авторизации
  Future<void> saveAuth(AuthData authData) async {
    await _storage.write(key: _tokenKey, value: authData.token);
    await _storage.write(
      key: _authDataKey,
      value: jsonEncode(authData.toJson()),
    );
  }

  /// Получить сохранённый токен
  Future<String?> getToken() async {
    return _storage.read(key: _tokenKey);
  }

  /// Получить сохранённые данные авторизации
  Future<AuthData?> getAuthData() async {
    final data = await _storage.read(key: _authDataKey);
    if (data == null) return null;
    try {
      final json = jsonDecode(data) as Map<String, dynamic>;
      return AuthData.fromJson(json);
    } catch (_) {
      return null;
    }
  }

  /// Очистить авторизацию (выход)
  Future<void> clearAuth() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _authDataKey);
  }
}
