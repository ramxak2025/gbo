/// Провайдер данных приложения
///
/// Загружает все данные с API одним запросом и хранит в памяти.
/// Предоставляет методы CRUD для всех сущностей.
/// После каждого изменения перезагружает данные для синхронизации.
library;

import 'package:flutter/foundation.dart';
import '../models/app_data.dart';
import '../models/user.dart';
import '../models/student.dart';
import '../models/group.dart';
import '../models/transaction.dart';
import '../models/tournament.dart';
import '../models/internal_tournament.dart';
import '../models/news.dart';
import '../models/material.dart';
import '../models/attendance.dart';
import '../models/club.dart';
import '../models/author_info.dart';
import '../models/pending_registration.dart';
import '../services/api_service.dart';

/// Провайдер данных — единый источник правды для всего приложения
class DataProvider extends ChangeNotifier {
  final ApiService _api;

  AppData _data = AppData.empty;
  bool _isLoading = false;
  String? _error;

  DataProvider({required ApiService api}) : _api = api;

  // ========== Геттеры ==========

  AppData get data => _data;
  bool get isLoading => _isLoading;
  String? get error => _error;

  List<User> get users => _data.users;
  List<Student> get students => _data.students;
  List<Group> get groups => _data.groups;
  List<Transaction> get transactions => _data.transactions;
  List<Tournament> get tournaments => _data.tournaments;
  List<TournamentRegistration> get tournamentRegistrations =>
      _data.tournamentRegistrations;
  List<News> get news => _data.news;
  List<InternalTournament> get internalTournaments =>
      _data.internalTournaments;
  List<Attendance> get attendance => _data.attendance;
  List<TrainingMaterial> get materials => _data.materials;
  List<Club> get clubs => _data.clubs;
  AuthorInfo get authorInfo => _data.authorInfo;
  List<PendingRegistration> get pendingRegistrations =>
      _data.pendingRegistrations;

  // ========== Загрузка данных ==========

  /// Загрузить все данные с сервера
  Future<void> loadData() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _data = await _api.getData();
      _isLoading = false;
      notifyListeners();
    } on ApiException catch (e) {
      _error = e.message;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = 'Ошибка загрузки данных';
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Перезагрузить данные (после изменений)
  Future<void> reload() async {
    await loadData();
  }

  // ========== Фильтры ==========

  /// Ученики тренера
  List<Student> studentsForTrainer(String trainerId) =>
      students.where((s) => s.trainerId == trainerId).toList();

  /// Группы тренера
  List<Group> groupsForTrainer(String trainerId) =>
      groups.where((g) => g.trainerId == trainerId).toList();

  /// Транзакции тренера
  List<Transaction> transactionsForTrainer(String trainerId) =>
      transactions.where((t) => t.trainerId == trainerId).toList();

  /// Ученики группы
  List<Student> studentsInGroup(String groupId) =>
      students.where((s) => s.groupId == groupId).toList();

  /// Регистрации на турнир
  List<TournamentRegistration> registrationsForTournament(
          String tournamentId) =>
      tournamentRegistrations
          .where((r) => r.tournamentId == tournamentId)
          .toList();

  /// Найти пользователя по ID
  User? findUser(String id) {
    try {
      return users.firstWhere((u) => u.id == id);
    } catch (_) {
      return null;
    }
  }

  /// Найти ученика по ID
  Student? findStudent(String id) {
    try {
      return students.firstWhere((s) => s.id == id);
    } catch (_) {
      return null;
    }
  }

  /// Найти группу по ID
  Group? findGroup(String id) {
    try {
      return groups.firstWhere((g) => g.id == id);
    } catch (_) {
      return null;
    }
  }

  // ========== CRUD операции ==========

  /// Добавить ученика
  Future<void> addStudent(Map<String, dynamic> data) async {
    await _api.addStudent(data);
    await reload();
  }

  /// Обновить ученика
  Future<void> updateStudent(String id, Map<String, dynamic> data) async {
    await _api.updateStudent(id, data);
    await reload();
  }

  /// Удалить ученика
  Future<void> deleteStudent(String id) async {
    await _api.deleteStudent(id);
    await reload();
  }

  /// Добавить группу
  Future<void> addGroup(Map<String, dynamic> data) async {
    await _api.addGroup(data);
    await reload();
  }

  /// Обновить группу
  Future<void> updateGroup(String id, Map<String, dynamic> data) async {
    await _api.updateGroup(id, data);
    await reload();
  }

  /// Удалить группу
  Future<void> deleteGroup(String id) async {
    await _api.deleteGroup(id);
    await reload();
  }

  /// Добавить транзакцию
  Future<void> addTransaction(Map<String, dynamic> data) async {
    await _api.addTransaction(data);
    await reload();
  }

  /// Обновить транзакцию
  Future<void> updateTransaction(
      String id, Map<String, dynamic> data) async {
    await _api.updateTransaction(id, data);
    await reload();
  }

  /// Удалить транзакцию
  Future<void> deleteTransaction(String id) async {
    await _api.deleteTransaction(id);
    await reload();
  }

  /// Добавить турнир
  Future<void> addTournament(Map<String, dynamic> data) async {
    await _api.addTournament(data);
    await reload();
  }

  /// Обновить турнир
  Future<void> updateTournament(
      String id, Map<String, dynamic> data) async {
    await _api.updateTournament(id, data);
    await reload();
  }

  /// Удалить турнир
  Future<void> deleteTournament(String id) async {
    await _api.deleteTournament(id);
    await reload();
  }

  /// Регистрация на турнир
  Future<void> registerTournament(
      String tournamentId, String studentId) async {
    await _api.registerTournament(tournamentId, studentId);
    await reload();
  }

  /// Отмена регистрации
  Future<void> unregisterTournament(
      String tournamentId, String studentId) async {
    await _api.unregisterTournament(tournamentId, studentId);
    await reload();
  }

  /// Добавить новость
  Future<void> addNews(Map<String, dynamic> data) async {
    await _api.addNews(data);
    await reload();
  }

  /// Удалить новость
  Future<void> deleteNews(String id) async {
    await _api.deleteNews(id);
    await reload();
  }

  /// Добавить тренера
  Future<void> addTrainer(Map<String, dynamic> data) async {
    await _api.addTrainer(data);
    await reload();
  }

  /// Обновить тренера
  Future<void> updateTrainer(String id, Map<String, dynamic> data) async {
    await _api.updateTrainer(id, data);
    await reload();
  }

  /// Удалить тренера
  Future<void> deleteTrainer(String id) async {
    await _api.deleteTrainer(id);
    await reload();
  }

  /// Обновить информацию об авторе
  Future<void> updateAuthor(Map<String, dynamic> data) async {
    await _api.updateAuthor(data);
    await reload();
  }

  /// Добавить внутренний турнир
  Future<void> addInternalTournament(Map<String, dynamic> data) async {
    await _api.addInternalTournament(data);
    await reload();
  }

  /// Обновить внутренний турнир
  Future<void> updateInternalTournament(
      String id, Map<String, dynamic> data) async {
    await _api.updateInternalTournament(id, data);
    await reload();
  }

  /// Удалить внутренний турнир
  Future<void> deleteInternalTournament(String id) async {
    await _api.deleteInternalTournament(id);
    await reload();
  }

  /// Сохранить посещаемость
  Future<void> saveAttendanceBulk({
    required String groupId,
    required String date,
    required List<Map<String, dynamic>> records,
  }) async {
    await _api.saveAttendanceBulk(
      groupId: groupId,
      date: date,
      records: records,
    );
    await reload();
  }

  /// Добавить материал
  Future<void> addMaterial(Map<String, dynamic> data) async {
    await _api.addMaterial(data);
    await reload();
  }

  /// Обновить материал
  Future<void> updateMaterial(String id, Map<String, dynamic> data) async {
    await _api.updateMaterial(id, data);
    await reload();
  }

  /// Удалить материал
  Future<void> deleteMaterial(String id) async {
    await _api.deleteMaterial(id);
    await reload();
  }

  /// Добавить клуб
  Future<void> addClub(Map<String, dynamic> data) async {
    await _api.addClub(data);
    await reload();
  }

  /// Обновить клуб
  Future<void> updateClub(String id, Map<String, dynamic> data) async {
    await _api.updateClub(id, data);
    await reload();
  }

  /// Удалить клуб
  Future<void> deleteClub(String id) async {
    await _api.deleteClub(id);
    await reload();
  }

  /// Привязать тренера к клубу
  Future<void> assignTrainerToClub(
      String clubId, String trainerId) async {
    await _api.assignTrainerToClub(clubId, trainerId);
    await reload();
  }

  /// Убрать тренера из клуба
  Future<void> removeTrainerFromClub(
      String clubId, String trainerId) async {
    await _api.removeTrainerFromClub(clubId, trainerId);
    await reload();
  }

  /// Одобрить заявку
  Future<void> approveRegistration(String id) async {
    await _api.approveRegistration(id);
    await reload();
  }

  /// Отклонить заявку
  Future<void> rejectRegistration(String id) async {
    await _api.rejectRegistration(id);
    await reload();
  }
}
