/// API сервис — HTTP клиент для работы с бэкендом
///
/// Общий бэкенд с веб-версией. Все запросы идут через единый API.
/// Поддерживает JWT авторизацию, загрузку файлов, обработку ошибок.
library;

import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

import '../models/app_data.dart';
import '../models/student.dart';
import '../models/group.dart';
import '../models/transaction.dart';
import '../models/tournament.dart';
import '../models/internal_tournament.dart';
import '../models/news.dart';
import '../models/material.dart';
import '../models/club.dart';

/// Исключение API — ошибка от сервера
class ApiException implements Exception {
  final String message;
  final String? errorType;
  final int statusCode;

  const ApiException({
    required this.message,
    this.errorType,
    this.statusCode = 500,
  });

  @override
  String toString() => message;
}

/// Результат авторизации
class AuthResult {
  final String token;
  final String userId;
  final String role;
  final String? studentId;
  final Map<String, dynamic> user;
  final Map<String, dynamic>? student;

  const AuthResult({
    required this.token,
    required this.userId,
    required this.role,
    this.studentId,
    required this.user,
    this.student,
  });

  factory AuthResult.fromJson(Map<String, dynamic> json) {
    return AuthResult(
      token: json['token'] as String,
      userId: json['userId'] as String,
      role: json['role'] as String,
      studentId: json['studentId'] as String?,
      user: json['user'] as Map<String, dynamic>,
      student: json['student'] as Map<String, dynamic>?,
    );
  }
}

/// HTTP клиент для работы с API бэкенда
class ApiService {
  final String baseUrl;
  String? _token;

  /// Колбэк при получении 401 (для выхода из системы)
  void Function()? onUnauthorized;

  ApiService({required this.baseUrl});

  /// Установить JWT токен для авторизации
  void setToken(String? token) {
    _token = token;
  }

  /// Текущий токен
  String? get token => _token;

  /// Заголовки с авторизацией
  Map<String, String> get _headers {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (_token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  /// Базовый HTTP запрос с обработкой ошибок
  Future<Map<String, dynamic>> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    late http.Response response;

    switch (method) {
      case 'GET':
        response = await http.get(uri, headers: _headers);
        break;
      case 'POST':
        response = await http.post(
          uri,
          headers: _headers,
          body: body != null ? jsonEncode(body) : null,
        );
        break;
      case 'PUT':
        response = await http.put(
          uri,
          headers: _headers,
          body: body != null ? jsonEncode(body) : null,
        );
        break;
      case 'DELETE':
        response = await http.delete(
          uri,
          headers: _headers,
          body: body != null ? jsonEncode(body) : null,
        );
        break;
      default:
        throw ArgumentError('Неподдерживаемый метод: $method');
    }

    // Обработка 401 — неавторизован
    if (response.statusCode == 401) {
      onUnauthorized?.call();
      throw const ApiException(
        message: 'Сессия истекла',
        statusCode: 401,
      );
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        message: data['error'] as String? ?? 'Ошибка сервера',
        errorType: data['errorType'] as String?,
        statusCode: response.statusCode,
      );
    }

    return data;
  }

  // ========== Аутентификация ==========

  /// Вход в систему по телефону и паролю
  Future<AuthResult> login(String phone, String password) async {
    final data = await _request('POST', '/api/auth/login', body: {
      'phone': phone,
      'password': password,
    });
    return AuthResult.fromJson(data);
  }

  /// Выход из системы
  Future<void> logout() async {
    await _request('POST', '/api/auth/logout');
  }

  /// Проверка текущей сессии
  Future<Map<String, dynamic>?> me() async {
    try {
      final uri = Uri.parse('$baseUrl/api/auth/me');
      final response = await http.get(uri, headers: _headers);
      if (response.statusCode != 200) return null;
      final body = response.body;
      if (body == 'null' || body.isEmpty) return null;
      final data = jsonDecode(body);
      if (data == null) return null;
      return data as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  /// Регистрация нового тренера (заявка)
  Future<void> register({
    required String name,
    required String phone,
    required String password,
    String? clubName,
    String? sportType,
    String? city,
    required bool consent,
  }) async {
    final uri = Uri.parse('$baseUrl/api/auth/register');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'name': name,
        'phone': phone,
        'password': password,
        'clubName': clubName,
        'sportType': sportType,
        'city': city,
        'consent': consent,
      }),
    );
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (!response.statusCode.toString().startsWith('2')) {
      throw ApiException(
        message: data['error'] as String? ?? 'Ошибка регистрации',
        statusCode: response.statusCode,
      );
    }
  }

  // ========== Данные ==========

  /// Загрузка всех данных (GET /api/data)
  Future<AppData> getData() async {
    final data = await _request('GET', '/api/data');
    return AppData.fromJson(data);
  }

  // ========== Ученики ==========

  /// Добавить ученика
  Future<Student> addStudent(Map<String, dynamic> data) async {
    final result = await _request('POST', '/api/data/students', body: data);
    return Student.fromJson(result);
  }

  /// Обновить ученика
  Future<void> updateStudent(String id, Map<String, dynamic> data) async {
    await _request('PUT', '/api/data/students/$id', body: data);
  }

  /// Удалить ученика
  Future<void> deleteStudent(String id) async {
    await _request('DELETE', '/api/data/students/$id');
  }

  // ========== Группы ==========

  /// Добавить группу
  Future<Map<String, dynamic>> addGroup(Map<String, dynamic> data) async {
    return _request('POST', '/api/data/groups', body: data);
  }

  /// Обновить группу
  Future<void> updateGroup(String id, Map<String, dynamic> data) async {
    await _request('PUT', '/api/data/groups/$id', body: data);
  }

  /// Удалить группу
  Future<void> deleteGroup(String id) async {
    await _request('DELETE', '/api/data/groups/$id');
  }

  // ========== Транзакции ==========

  /// Добавить транзакцию
  Future<Map<String, dynamic>> addTransaction(
      Map<String, dynamic> data) async {
    return _request('POST', '/api/data/transactions', body: data);
  }

  /// Обновить транзакцию
  Future<void> updateTransaction(
      String id, Map<String, dynamic> data) async {
    await _request('PUT', '/api/data/transactions/$id', body: data);
  }

  /// Удалить транзакцию
  Future<void> deleteTransaction(String id) async {
    await _request('DELETE', '/api/data/transactions/$id');
  }

  // ========== Турниры ==========

  /// Добавить турнир
  Future<Map<String, dynamic>> addTournament(
      Map<String, dynamic> data) async {
    return _request('POST', '/api/data/tournaments', body: data);
  }

  /// Обновить турнир
  Future<void> updateTournament(
      String id, Map<String, dynamic> data) async {
    await _request('PUT', '/api/data/tournaments/$id', body: data);
  }

  /// Удалить турнир
  Future<void> deleteTournament(String id) async {
    await _request('DELETE', '/api/data/tournaments/$id');
  }

  // ========== Регистрация на турнир ==========

  /// Зарегистрировать на турнир
  Future<void> registerTournament(
      String tournamentId, String studentId) async {
    await _request('POST', '/api/data/tournament-registrations', body: {
      'tournamentId': tournamentId,
      'studentId': studentId,
    });
  }

  /// Отменить регистрацию
  Future<void> unregisterTournament(
      String tournamentId, String studentId) async {
    await _request('DELETE', '/api/data/tournament-registrations', body: {
      'tournamentId': tournamentId,
      'studentId': studentId,
    });
  }

  // ========== Новости ==========

  /// Добавить новость
  Future<Map<String, dynamic>> addNews(Map<String, dynamic> data) async {
    return _request('POST', '/api/data/news', body: data);
  }

  /// Удалить новость
  Future<void> deleteNews(String id) async {
    await _request('DELETE', '/api/data/news/$id');
  }

  // ========== Тренеры ==========

  /// Добавить тренера (суперадмин)
  Future<Map<String, dynamic>> addTrainer(Map<String, dynamic> data) async {
    return _request('POST', '/api/data/trainers', body: data);
  }

  /// Обновить тренера
  Future<void> updateTrainer(String id, Map<String, dynamic> data) async {
    await _request('PUT', '/api/data/trainers/$id', body: data);
  }

  /// Удалить тренера
  Future<void> deleteTrainer(String id) async {
    await _request('DELETE', '/api/data/trainers/$id');
  }

  // ========== Автор ==========

  /// Обновить информацию об авторе
  Future<void> updateAuthor(Map<String, dynamic> data) async {
    await _request('PUT', '/api/data/author', body: data);
  }

  // ========== Внутренние турниры ==========

  /// Добавить внутренний турнир
  Future<InternalTournament> addInternalTournament(
      Map<String, dynamic> data) async {
    final result =
        await _request('POST', '/api/data/internal-tournaments', body: data);
    return InternalTournament.fromJson(result);
  }

  /// Обновить внутренний турнир
  Future<InternalTournament> updateInternalTournament(
      String id, Map<String, dynamic> data) async {
    final result = await _request(
        'PUT', '/api/data/internal-tournaments/$id',
        body: data);
    return InternalTournament.fromJson(result);
  }

  /// Удалить внутренний турнир
  Future<void> deleteInternalTournament(String id) async {
    await _request('DELETE', '/api/data/internal-tournaments/$id');
  }

  // ========== Посещаемость ==========

  /// Сохранить посещаемость массово
  Future<void> saveAttendanceBulk({
    required String groupId,
    required String date,
    required List<Map<String, dynamic>> records,
  }) async {
    await _request('POST', '/api/data/attendance/bulk', body: {
      'groupId': groupId,
      'date': date,
      'records': records,
    });
  }

  // ========== Материалы ==========

  /// Добавить материал
  Future<Map<String, dynamic>> addMaterial(Map<String, dynamic> data) async {
    return _request('POST', '/api/data/materials', body: data);
  }

  /// Обновить материал
  Future<void> updateMaterial(String id, Map<String, dynamic> data) async {
    await _request('PUT', '/api/data/materials/$id', body: data);
  }

  /// Удалить материал
  Future<void> deleteMaterial(String id) async {
    await _request('DELETE', '/api/data/materials/$id');
  }

  // ========== Клубы ==========

  /// Добавить клуб
  Future<Map<String, dynamic>> addClub(Map<String, dynamic> data) async {
    return _request('POST', '/api/data/clubs', body: data);
  }

  /// Обновить клуб
  Future<void> updateClub(String id, Map<String, dynamic> data) async {
    await _request('PUT', '/api/data/clubs/$id', body: data);
  }

  /// Удалить клуб
  Future<void> deleteClub(String id) async {
    await _request('DELETE', '/api/data/clubs/$id');
  }

  /// Привязать тренера к клубу
  Future<void> assignTrainerToClub(String clubId, String trainerId) async {
    await _request('POST', '/api/data/clubs/$clubId/trainers', body: {
      'trainerId': trainerId,
    });
  }

  /// Убрать тренера из клуба
  Future<void> removeTrainerFromClub(
      String clubId, String trainerId) async {
    await _request(
        'DELETE', '/api/data/clubs/$clubId/trainers/$trainerId');
  }

  // ========== Регистрации ==========

  /// Одобрить заявку на регистрацию
  Future<void> approveRegistration(String id) async {
    await _request('POST', '/api/data/registrations/$id/approve');
  }

  /// Отклонить заявку на регистрацию
  Future<void> rejectRegistration(String id) async {
    await _request('POST', '/api/data/registrations/$id/reject');
  }

  // ========== Загрузка файлов ==========

  /// Загрузить файл на сервер
  Future<String> uploadFile(File file) async {
    final uri = Uri.parse('$baseUrl/api/upload');
    final request = http.MultipartRequest('POST', uri);

    if (_token != null) {
      request.headers['Authorization'] = 'Bearer $_token';
    }

    request.files.add(await http.MultipartFile.fromPath('file', file.path));

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode != 200) {
      throw const ApiException(
        message: 'Ошибка загрузки файла',
        statusCode: 500,
      );
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return data['url'] as String;
  }
}
