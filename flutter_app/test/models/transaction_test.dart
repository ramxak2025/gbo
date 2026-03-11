/// Тесты модели транзакции
///
/// Проверяет парсинг типов, JSON конвертацию.
import 'package:flutter_test/flutter_test.dart';
import 'package:iborcuha/models/transaction.dart';

void main() {
  group('TransactionType', () {
    test('парсинг из строки', () {
      expect(
          TransactionType.fromString('income'), TransactionType.income);
      expect(
          TransactionType.fromString('expense'), TransactionType.expense);
    });

    test('ошибка при неизвестном типе', () {
      expect(
          () => TransactionType.fromString('unknown'), throwsArgumentError);
    });
  });

  group('Transaction', () {
    test('создание из JSON', () {
      final json = {
        'id': 'tx1',
        'trainerId': 't1',
        'type': 'income',
        'amount': 5000,
        'category': 'Подписка',
        'description': 'Оплата за месяц',
        'studentId': 's1',
        'date': '2024-01-15T12:00:00.000Z',
      };

      final tx = Transaction.fromJson(json);

      expect(tx.id, 'tx1');
      expect(tx.type, TransactionType.income);
      expect(tx.amount, 5000);
      expect(tx.category, 'Подписка');
      expect(tx.description, 'Оплата за месяц');
      expect(tx.studentId, 's1');
    });

    test('конвертация в JSON', () {
      final tx = Transaction(
        id: 'tx1',
        trainerId: 't1',
        type: TransactionType.expense,
        amount: 2000,
        category: 'Аренда',
        date: '2024-01-15',
      );

      final json = tx.toJson();

      expect(json['type'], 'expense');
      expect(json['amount'], 2000);
      expect(json['category'], 'Аренда');
    });
  });
}
