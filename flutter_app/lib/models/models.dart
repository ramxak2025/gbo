class User {
  final int id;
  final String name;
  final String phone;
  final String role;
  final String? avatar;
  final String? clubName;
  final String? sportType;
  final String? city;
  final bool? isDemo;
  final bool? isHeadTrainer;
  final int? clubId;
  final String? plainPassword;
  final List<String>? materialCategories;

  User({
    required this.id,
    required this.name,
    required this.phone,
    required this.role,
    this.avatar,
    this.clubName,
    this.sportType,
    this.city,
    this.isDemo,
    this.isHeadTrainer,
    this.clubId,
    this.plainPassword,
    this.materialCategories,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
    id: json['id'],
    name: json['name'] ?? '',
    phone: json['phone'] ?? '',
    role: json['role'] ?? 'trainer',
    avatar: json['avatar'],
    clubName: json['clubName'] ?? json['club_name'],
    sportType: json['sportType'] ?? json['sport_type'],
    city: json['city'],
    isDemo: json['isDemo'] ?? json['is_demo'],
    isHeadTrainer: json['isHeadTrainer'] ?? json['is_head_trainer'],
    clubId: json['clubId'] ?? json['club_id'],
    plainPassword: json['plainPassword'] ?? json['plain_password'],
    materialCategories: json['materialCategories'] != null
        ? List<String>.from(json['materialCategories'])
        : null,
  );
}

class Student {
  final int id;
  final String name;
  final String? phone;
  final String? belt;
  final String? weight;
  final String? birthDate;
  final String? avatar;
  final String? subscriptionExpiresAt;
  final int? trainerId;
  final int? groupId;
  final String? status;
  final String? trainingStartDate;
  final bool? isDemo;

  Student({
    required this.id,
    required this.name,
    this.phone,
    this.belt,
    this.weight,
    this.birthDate,
    this.avatar,
    this.subscriptionExpiresAt,
    this.trainerId,
    this.groupId,
    this.status,
    this.trainingStartDate,
    this.isDemo,
  });

  factory Student.fromJson(Map<String, dynamic> json) => Student(
    id: json['id'],
    name: json['name'] ?? '',
    phone: json['phone'],
    belt: json['belt'],
    weight: json['weight']?.toString(),
    birthDate: json['birthDate'] ?? json['birth_date'],
    avatar: json['avatar'],
    subscriptionExpiresAt: json['subscriptionExpiresAt'] ?? json['subscription_expires_at'],
    trainerId: json['trainerId'] ?? json['trainer_id'],
    groupId: json['groupId'] ?? json['group_id'],
    status: json['status'],
    trainingStartDate: json['trainingStartDate'] ?? json['training_start_date'],
    isDemo: json['isDemo'] ?? json['is_demo'],
  );

  bool get isExpired {
    if (subscriptionExpiresAt == null) return true;
    return DateTime.parse(subscriptionExpiresAt!).isBefore(DateTime.now());
  }
}

class Group {
  final int id;
  final String name;
  final String? schedule;
  final int? cost;
  final int? trainerId;
  final String? sportType;
  final bool? attendanceEnabled;
  final int? pinnedMaterialId;

  Group({
    required this.id,
    required this.name,
    this.schedule,
    this.cost,
    this.trainerId,
    this.sportType,
    this.attendanceEnabled,
    this.pinnedMaterialId,
  });

  factory Group.fromJson(Map<String, dynamic> json) => Group(
    id: json['id'],
    name: json['name'] ?? '',
    schedule: json['schedule'],
    cost: json['cost'],
    trainerId: json['trainerId'] ?? json['trainer_id'],
    sportType: json['sportType'] ?? json['sport_type'],
    attendanceEnabled: json['attendanceEnabled'] ?? json['attendance_enabled'],
    pinnedMaterialId: json['pinnedMaterialId'] ?? json['pinned_material_id'],
  );
}

class Transaction {
  final int id;
  final String type; // income / expense
  final double amount;
  final String? category;
  final String? description;
  final String? date;
  final int? trainerId;
  final int? studentId;

  Transaction({
    required this.id,
    required this.type,
    required this.amount,
    this.category,
    this.description,
    this.date,
    this.trainerId,
    this.studentId,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) => Transaction(
    id: json['id'],
    type: json['type'] ?? 'income',
    amount: (json['amount'] ?? 0).toDouble(),
    category: json['category'],
    description: json['description'],
    date: json['date'],
    trainerId: json['trainerId'] ?? json['trainer_id'],
    studentId: json['studentId'] ?? json['student_id'],
  );
}

class Tournament {
  final int id;
  final String title;
  final String? date;
  final String? location;
  final String? coverImage;
  final String? description;
  final int? trainerId;

  Tournament({
    required this.id,
    required this.title,
    this.date,
    this.location,
    this.coverImage,
    this.description,
    this.trainerId,
  });

  factory Tournament.fromJson(Map<String, dynamic> json) => Tournament(
    id: json['id'],
    title: json['title'] ?? '',
    date: json['date'],
    location: json['location'],
    coverImage: json['coverImage'] ?? json['cover_image'],
    description: json['description'],
    trainerId: json['trainerId'] ?? json['trainer_id'],
  );
}

class NewsItem {
  final int id;
  final String title;
  final String? content;
  final String? createdAt;
  final int? trainerId;

  NewsItem({
    required this.id,
    required this.title,
    this.content,
    this.createdAt,
    this.trainerId,
  });

  factory NewsItem.fromJson(Map<String, dynamic> json) => NewsItem(
    id: json['id'],
    title: json['title'] ?? '',
    content: json['content'],
    createdAt: json['createdAt'] ?? json['created_at'],
    trainerId: json['trainerId'] ?? json['trainer_id'],
  );
}

class Club {
  final int id;
  final String name;
  final String? city;
  final List<String>? sportTypes;

  Club({
    required this.id,
    required this.name,
    this.city,
    this.sportTypes,
  });

  factory Club.fromJson(Map<String, dynamic> json) => Club(
    id: json['id'],
    name: json['name'] ?? '',
    city: json['city'],
    sportTypes: json['sportTypes'] != null
        ? List<String>.from(json['sportTypes'])
        : null,
  );
}

class AppData {
  final List<User> users;
  final List<Student> students;
  final List<Group> groups;
  final List<Transaction> transactions;
  final List<Tournament> tournaments;
  final List<NewsItem> news;
  final List<Club> clubs;

  AppData({
    required this.users,
    required this.students,
    required this.groups,
    required this.transactions,
    required this.tournaments,
    required this.news,
    required this.clubs,
  });

  factory AppData.fromJson(Map<String, dynamic> json) => AppData(
    users: (json['users'] as List? ?? []).map((e) => User.fromJson(e)).toList(),
    students: (json['students'] as List? ?? []).map((e) => Student.fromJson(e)).toList(),
    groups: (json['groups'] as List? ?? []).map((e) => Group.fromJson(e)).toList(),
    transactions: (json['transactions'] as List? ?? []).map((e) => Transaction.fromJson(e)).toList(),
    tournaments: (json['tournaments'] as List? ?? []).map((e) => Tournament.fromJson(e)).toList(),
    news: (json['news'] as List? ?? []).map((e) => NewsItem.fromJson(e)).toList(),
    clubs: (json['clubs'] as List? ?? []).map((e) => Club.fromJson(e)).toList(),
  );
}
