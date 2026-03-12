import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  static const _storage = FlutterSecureStorage();

  bool _isLoading = true;
  bool _isLoggedIn = false;
  String _role = '';
  int? _userId;
  int? _studentId;
  Map<String, dynamic>? _user;

  bool get isLoading => _isLoading;
  bool get isLoggedIn => _isLoggedIn;
  String get role => _role;
  int? get userId => _userId;
  int? get studentId => _studentId;
  Map<String, dynamic>? get user => _user;

  Future<void> init() async {
    try {
      final authJson = await _storage.read(key: 'iborcuha_auth');
      if (authJson != null) {
        final auth = jsonDecode(authJson);
        _role = auth['role'] ?? '';
        _userId = auth['userId'];
        _studentId = auth['studentId'];
        _user = auth['user'];
        _isLoggedIn = true;

        // Verify token is still valid
        try {
          await ApiService.me();
        } catch (e) {
          if (e is UnauthorizedException) {
            await _clearAuth();
          }
        }
      }
    } catch (_) {}
    _isLoading = false;
    notifyListeners();
  }

  Future<void> login(String phone, String password) async {
    final data = await ApiService.login(phone, password);
    await ApiService.saveToken(data['token']);

    _role = data['role'] ?? '';
    _userId = data['userId'];
    _studentId = data['studentId'];
    _user = data['user'];
    _isLoggedIn = true;

    await _storage.write(
      key: 'iborcuha_auth',
      value: jsonEncode({
        'role': _role,
        'userId': _userId,
        'studentId': _studentId,
        'user': _user,
      }),
    );

    notifyListeners();
  }

  Future<void> logout() async {
    await ApiService.logout();
    await _clearAuth();
    notifyListeners();
  }

  Future<void> _clearAuth() async {
    _isLoggedIn = false;
    _role = '';
    _userId = null;
    _studentId = null;
    _user = null;
    await _storage.delete(key: 'iborcuha_auth');
    await _storage.delete(key: 'iborcuha_token');
  }
}
