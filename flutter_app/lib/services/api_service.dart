import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static const String baseUrl = 'https://iborcuha.ru/api';
  static const _storage = FlutterSecureStorage();

  static Future<String?> getToken() async {
    return await _storage.read(key: 'iborcuha_token');
  }

  static Future<void> saveToken(String token) async {
    await _storage.write(key: 'iborcuha_token', value: token);
  }

  static Future<void> clearToken() async {
    await _storage.delete(key: 'iborcuha_token');
    await _storage.delete(key: 'iborcuha_auth');
  }

  static Future<Map<String, String>> _headers() async {
    final token = await getToken();
    final headers = {'Content-Type': 'application/json'};
    if (token != null) headers['Authorization'] = 'Bearer $token';
    return headers;
  }

  static Future<Map<String, dynamic>> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final headers = await _headers();
    final uri = Uri.parse('$baseUrl$path');

    http.Response response;
    switch (method) {
      case 'GET':
        response = await http.get(uri, headers: headers);
        break;
      case 'POST':
        response = await http.post(uri, headers: headers, body: body != null ? jsonEncode(body) : null);
        break;
      case 'PUT':
        response = await http.put(uri, headers: headers, body: body != null ? jsonEncode(body) : null);
        break;
      case 'DELETE':
        response = await http.delete(uri, headers: headers, body: body != null ? jsonEncode(body) : null);
        break;
      default:
        throw Exception('Unsupported method: $method');
    }

    if (response.statusCode == 401) {
      await clearToken();
      throw UnauthorizedException();
    }

    final data = jsonDecode(response.body);
    if (response.statusCode >= 400) {
      throw ApiException(data['error'] ?? 'Ошибка сервера');
    }

    return data;
  }

  // Auth
  static Future<Map<String, dynamic>> login(String phone, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phone': phone, 'password': password}),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode >= 400) {
      throw ApiException(data['error'] ?? 'Ошибка входа');
    }
    return data;
  }

  static Future<Map<String, dynamic>> register(Map<String, dynamic> body) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );
    final data = jsonDecode(response.body);
    if (response.statusCode >= 400) {
      throw ApiException(data['error'] ?? 'Ошибка регистрации');
    }
    return data;
  }

  static Future<Map<String, dynamic>> me() => _request('GET', '/auth/me');
  static Future<void> logout() async {
    try { await _request('POST', '/auth/logout'); } catch (_) {}
    await clearToken();
  }

  // Data
  static Future<Map<String, dynamic>> getData() => _request('GET', '/data');

  // Students CRUD
  static Future<Map<String, dynamic>> addStudent(Map<String, dynamic> data) =>
      _request('POST', '/data/students', body: data);
  static Future<Map<String, dynamic>> updateStudent(int id, Map<String, dynamic> data) =>
      _request('PUT', '/data/students/$id', body: data);
  static Future<Map<String, dynamic>> deleteStudent(int id) =>
      _request('DELETE', '/data/students/$id');

  // Groups CRUD
  static Future<Map<String, dynamic>> addGroup(Map<String, dynamic> data) =>
      _request('POST', '/data/groups', body: data);
  static Future<Map<String, dynamic>> updateGroup(int id, Map<String, dynamic> data) =>
      _request('PUT', '/data/groups/$id', body: data);
  static Future<Map<String, dynamic>> deleteGroup(int id) =>
      _request('DELETE', '/data/groups/$id');

  // Transactions CRUD
  static Future<Map<String, dynamic>> addTransaction(Map<String, dynamic> data) =>
      _request('POST', '/data/transactions', body: data);
  static Future<Map<String, dynamic>> updateTransaction(int id, Map<String, dynamic> data) =>
      _request('PUT', '/data/transactions/$id', body: data);
  static Future<Map<String, dynamic>> deleteTransaction(int id) =>
      _request('DELETE', '/data/transactions/$id');

  // Tournaments
  static Future<Map<String, dynamic>> addTournament(Map<String, dynamic> data) =>
      _request('POST', '/data/tournaments', body: data);

  // News
  static Future<Map<String, dynamic>> addNews(Map<String, dynamic> data) =>
      _request('POST', '/data/news', body: data);
  static Future<Map<String, dynamic>> deleteNews(int id) =>
      _request('DELETE', '/data/news/$id');
}

class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  @override
  String toString() => message;
}

class UnauthorizedException implements Exception {}
