/// Провайдер аутентификации
///
/// Управляет состоянием авторизации пользователя.
/// При входе сохраняет токен, при выходе очищает данные.
/// Автоматически восстанавливает сессию при старте.
library;

import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';

/// Провайдер состояния аутентификации
class AuthProvider extends ChangeNotifier {
  final ApiService _api;
  final AuthService _authService;

  AuthData? _authData;
  bool _isLoading = true;
  String? _error;

  AuthProvider({
    required ApiService api,
    required AuthService authService,
  })  : _api = api,
        _authService = authService {
    _init();
  }

  // ========== Геттеры ==========

  /// Данные авторизации (null если не авторизован)
  AuthData? get authData => _authData;

  /// Авторизован ли пользователь
  bool get isAuthenticated => _authData != null;

  /// Загрузка (при старте или входе)
  bool get isLoading => _isLoading;

  /// Ошибка (при входе)
  String? get error => _error;

  /// Текущий пользователь
  User? get currentUser => _authData?.user;

  /// Роль пользователя
  UserRole? get role => _authData?.role;

  /// ID пользователя
  String? get userId => _authData?.userId;

  /// ID ученика (если роль = student)
  String? get studentId => _authData?.studentId;

  /// Является ли тренером
  bool get isTrainer => _authData?.role == UserRole.trainer;

  /// Является ли суперадмином
  bool get isSuperadmin => _authData?.role == UserRole.superadmin;

  /// Является ли учеником
  bool get isStudent => _authData?.role == UserRole.student;

  // ========== Инициализация ==========

  /// Восстановление сессии при старте приложения
  Future<void> _init() async {
    _isLoading = true;
    notifyListeners();

    try {
      final savedAuth = await _authService.getAuthData();
      if (savedAuth != null) {
        _api.setToken(savedAuth.token);

        // Проверяем валидность токена через API
        final meData = await _api.me();
        if (meData != null) {
          _authData = savedAuth;
        } else {
          // Токен истёк — очищаем
          await _authService.clearAuth();
          _api.setToken(null);
        }
      }
    } catch (_) {
      // При ошибке сети используем кэшированные данные
      final savedAuth = await _authService.getAuthData();
      if (savedAuth != null) {
        _authData = savedAuth;
        _api.setToken(savedAuth.token);
      }
    }

    _isLoading = false;
    notifyListeners();
  }

  // ========== Действия ==========

  /// Вход по телефону и паролю
  Future<bool> login(String phone, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _api.login(phone, password);
      _api.setToken(result.token);

      final authData = AuthData(
        token: result.token,
        userId: result.userId,
        role: UserRole.fromString(result.role),
        studentId: result.studentId,
        user: User.fromJson(result.user),
        studentData: result.student,
      );

      await _authService.saveAuth(authData);
      _authData = authData;
      _isLoading = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Ошибка подключения к серверу';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Выход из системы
  Future<void> logout() async {
    try {
      await _api.logout();
    } catch (_) {
      // Выходим даже при ошибке сети
    }

    _api.setToken(null);
    await _authService.clearAuth();
    _authData = null;
    _error = null;
    notifyListeners();
  }

  /// Очистить ошибку
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
