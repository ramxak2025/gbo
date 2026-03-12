import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class DataProvider extends ChangeNotifier {
  AppData? _data;
  bool _isLoading = false;
  String? _error;

  AppData? get data => _data;
  bool get isLoading => _isLoading;
  String? get error => _error;

  List<User> get users => _data?.users ?? [];
  List<Student> get students => _data?.students ?? [];
  List<Group> get groups => _data?.groups ?? [];
  List<Transaction> get transactions => _data?.transactions ?? [];
  List<Tournament> get tournaments => _data?.tournaments ?? [];
  List<NewsItem> get news => _data?.news ?? [];
  List<Club> get clubs => _data?.clubs ?? [];

  Future<void> loadData() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final json = await ApiService.getData();
      _data = AppData.fromJson(json);
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> reload() => loadData();

  // Students
  Future<void> addStudent(Map<String, dynamic> data) async {
    await ApiService.addStudent(data);
    await reload();
  }

  Future<void> updateStudent(int id, Map<String, dynamic> data) async {
    await ApiService.updateStudent(id, data);
    await reload();
  }

  Future<void> deleteStudent(int id) async {
    await ApiService.deleteStudent(id);
    await reload();
  }

  // Groups
  Future<void> addGroup(Map<String, dynamic> data) async {
    await ApiService.addGroup(data);
    await reload();
  }

  Future<void> updateGroup(int id, Map<String, dynamic> data) async {
    await ApiService.updateGroup(id, data);
    await reload();
  }

  Future<void> deleteGroup(int id) async {
    await ApiService.deleteGroup(id);
    await reload();
  }

  // Transactions
  Future<void> addTransaction(Map<String, dynamic> data) async {
    await ApiService.addTransaction(data);
    await reload();
  }

  Future<void> updateTransaction(int id, Map<String, dynamic> data) async {
    await ApiService.updateTransaction(id, data);
    await reload();
  }

  Future<void> deleteTransaction(int id) async {
    await ApiService.deleteTransaction(id);
    await reload();
  }
}
