/// Модель финансовой транзакции
///
/// Представляет доход или расход тренера.
/// Категории транзакций помогают анализировать финансы.
library;

/// Тип транзакции
enum TransactionType {
  income,
  expense;

  static TransactionType fromString(String type) {
    switch (type) {
      case 'income':
        return TransactionType.income;
      case 'expense':
        return TransactionType.expense;
      default:
        throw ArgumentError('Неизвестный тип транзакции: $type');
    }
  }
}

/// Модель финансовой транзакции
class Transaction {
  final String id;
  final String trainerId;
  final TransactionType type;
  final int amount;
  final String category;
  final String description;
  final String? studentId;
  final String date;

  const Transaction({
    required this.id,
    required this.trainerId,
    required this.type,
    required this.amount,
    this.category = '',
    this.description = '',
    this.studentId,
    required this.date,
  });

  /// Создание из JSON ответа API
  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'] as String,
      trainerId: json['trainerId'] as String,
      type: TransactionType.fromString(json['type'] as String),
      amount: json['amount'] as int,
      category: json['category'] as String? ?? '',
      description: json['description'] as String? ?? '',
      studentId: json['studentId'] as String?,
      date: json['date'] as String,
    );
  }

  /// Конвертация в JSON
  Map<String, dynamic> toJson() {
    return {
      'type': type.name,
      'amount': amount,
      'category': category,
      'description': description,
      'studentId': studentId,
    };
  }
}
