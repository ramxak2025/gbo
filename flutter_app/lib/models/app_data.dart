/// Совокупная модель данных приложения
///
/// Содержит все данные, загружаемые с API одним запросом GET /api/data.
/// Используется DataProvider для хранения состояния.
library;

import 'user.dart';
import 'student.dart';
import 'group.dart';
import 'transaction.dart';
import 'tournament.dart';
import 'internal_tournament.dart';
import 'news.dart';
import 'material.dart';
import 'attendance.dart';
import 'club.dart';
import 'author_info.dart';
import 'pending_registration.dart';

/// Все данные приложения
class AppData {
  final List<User> users;
  final List<Student> students;
  final List<Group> groups;
  final List<Transaction> transactions;
  final List<Tournament> tournaments;
  final List<TournamentRegistration> tournamentRegistrations;
  final List<News> news;
  final List<InternalTournament> internalTournaments;
  final List<Attendance> attendance;
  final List<TrainingMaterial> materials;
  final List<Club> clubs;
  final AuthorInfo authorInfo;
  final List<PendingRegistration> pendingRegistrations;

  const AppData({
    this.users = const [],
    this.students = const [],
    this.groups = const [],
    this.transactions = const [],
    this.tournaments = const [],
    this.tournamentRegistrations = const [],
    this.news = const [],
    this.internalTournaments = const [],
    this.attendance = const [],
    this.materials = const [],
    this.clubs = const [],
    this.authorInfo = const AuthorInfo(),
    this.pendingRegistrations = const [],
  });

  /// Парсинг полного ответа GET /api/data
  factory AppData.fromJson(Map<String, dynamic> json) {
    return AppData(
      users: (json['users'] as List<dynamic>?)
              ?.map((e) => User.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      students: (json['students'] as List<dynamic>?)
              ?.map((e) => Student.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      groups: (json['groups'] as List<dynamic>?)
              ?.map((e) => Group.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      transactions: (json['transactions'] as List<dynamic>?)
              ?.map((e) => Transaction.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      tournaments: (json['tournaments'] as List<dynamic>?)
              ?.map((e) => Tournament.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      tournamentRegistrations: (json['tournamentRegistrations']
                  as List<dynamic>?)
              ?.map((e) =>
                  TournamentRegistration.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      news: (json['news'] as List<dynamic>?)
              ?.map((e) => News.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      internalTournaments: (json['internalTournaments'] as List<dynamic>?)
              ?.map(
                  (e) => InternalTournament.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      attendance: (json['attendance'] as List<dynamic>?)
              ?.map((e) => Attendance.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      materials: (json['materials'] as List<dynamic>?)
              ?.map(
                  (e) => TrainingMaterial.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      clubs: (json['clubs'] as List<dynamic>?)
              ?.map((e) => Club.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      authorInfo: json['authorInfo'] != null
          ? AuthorInfo.fromJson(json['authorInfo'] as Map<String, dynamic>)
          : const AuthorInfo(),
      pendingRegistrations: (json['pendingRegistrations'] as List<dynamic>?)
              ?.map((e) =>
                  PendingRegistration.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  /// Пустые данные по умолчанию
  static const AppData empty = AppData();
}
