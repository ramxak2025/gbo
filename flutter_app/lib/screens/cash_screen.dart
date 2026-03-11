/// Экран финансов (Касса)
///
/// Отображает доходы и расходы тренера.
/// Позволяет добавлять новые транзакции,
/// фильтровать по периоду и категории.
/// Доступен только для тренеров.
library;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/data_provider.dart';
import '../providers/theme_provider.dart';
import '../models/transaction.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import '../widgets/glass_button.dart';
import '../widgets/glass_modal.dart';
import '../utils/date_utils.dart' as date_utils;

/// Экран финансового учёта
class CashScreen extends StatefulWidget {
  const CashScreen({super.key});

  @override
  State<CashScreen> createState() => _CashScreenState();
}

class _CashScreenState extends State<CashScreen> {
  String _filter = 'all'; // all, income, expense

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;
    final auth = context.watch<AuthProvider>();
    final data = context.watch<DataProvider>();
    final userId = auth.userId!;

    final allTx = data.transactionsForTrainer(userId);
    final filtered = _filter == 'all'
        ? allTx
        : allTx.where((t) => t.type.name == _filter).toList();

    final totalIncome = allTx
        .where((t) => t.type == TransactionType.income)
        .fold<int>(0, (sum, t) => sum + t.amount);
    final totalExpense = allTx
        .where((t) => t.type == TransactionType.expense)
        .fold<int>(0, (sum, t) => sum + t.amount);
    final balance = totalIncome - totalExpense;

    return SafeArea(
      child: Column(
        children: [
          // Заголовок
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'Касса',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                ),
                GestureDetector(
                  onTap: () => _showAddTransaction(context),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: LiquidGlassColors.primary.withValues(alpha: 0.15),
                    ),
                    child: const Icon(
                      LucideIcons.plus,
                      color: LiquidGlassColors.primary,
                      size: 20,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Баланс
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: GlassCard(
              child: Column(
                children: [
                  Text(
                    'Баланс',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${balance >= 0 ? '+' : ''}$balance \u20BD',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          color: balance >= 0
                              ? LiquidGlassColors.success
                              : LiquidGlassColors.danger,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _MiniStat(
                          label: 'Доход',
                          value: '+$totalIncome \u20BD',
                          color: LiquidGlassColors.success,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _MiniStat(
                          label: 'Расход',
                          value: '-$totalExpense \u20BD',
                          color: LiquidGlassColors.danger,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1),
          ),

          const SizedBox(height: 12),

          // Фильтры
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                _FilterChip(
                  label: 'Все',
                  isActive: _filter == 'all',
                  onTap: () => setState(() => _filter = 'all'),
                ),
                const SizedBox(width: 8),
                _FilterChip(
                  label: 'Доходы',
                  isActive: _filter == 'income',
                  onTap: () => setState(() => _filter = 'income'),
                  color: LiquidGlassColors.success,
                ),
                const SizedBox(width: 8),
                _FilterChip(
                  label: 'Расходы',
                  isActive: _filter == 'expense',
                  onTap: () => setState(() => _filter = 'expense'),
                  color: LiquidGlassColors.danger,
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Список транзакций
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
              itemCount: filtered.length,
              itemBuilder: (context, index) {
                final tx = filtered[index];
                final isIncome = tx.type == TransactionType.income;
                final student = tx.studentId != null
                    ? data.findStudent(tx.studentId!)
                    : null;

                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: GlassCard(
                    onTap: () => _showTransactionDetails(context, tx),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isIncome
                                ? LiquidGlassColors.success
                                    .withValues(alpha: 0.15)
                                : LiquidGlassColors.danger
                                    .withValues(alpha: 0.15),
                          ),
                          child: Icon(
                            isIncome
                                ? LucideIcons.trendingUp
                                : LucideIcons.trendingDown,
                            size: 18,
                            color: isIncome
                                ? LiquidGlassColors.success
                                : LiquidGlassColors.danger,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                tx.category.isNotEmpty
                                    ? tx.category
                                    : (isIncome ? 'Доход' : 'Расход'),
                                style:
                                    Theme.of(context).textTheme.titleMedium,
                              ),
                              if (student != null)
                                Text(
                                  student.name,
                                  style:
                                      Theme.of(context).textTheme.bodySmall,
                                ),
                              Text(
                                date_utils.relativeDate(tx.date),
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          '${isIncome ? '+' : '-'}${tx.amount} \u20BD',
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    color: isIncome
                                        ? LiquidGlassColors.success
                                        : LiquidGlassColors.danger,
                                    fontWeight: FontWeight.w700,
                                  ),
                        ),
                      ],
                    ),
                  )
                      .animate()
                      .fadeIn(delay: Duration(milliseconds: index * 50))
                      .slideX(begin: 0.05),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  /// Показать форму добавления транзакции
  void _showAddTransaction(BuildContext context) {
    final typeController = ValueNotifier<TransactionType>(TransactionType.income);
    final amountController = TextEditingController();
    final categoryController = TextEditingController();
    final descController = TextEditingController();

    showGlassModal(
      context: context,
      title: 'Новая операция',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Тип
          ListenableBuilder(
            listenable: typeController,
            builder: (context, _) => Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => typeController.value = TransactionType.income,
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: typeController.value == TransactionType.income
                            ? LiquidGlassColors.success
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: LiquidGlassColors.success,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          'Доход',
                          style: TextStyle(
                            color:
                                typeController.value == TransactionType.income
                                    ? Colors.white
                                    : LiquidGlassColors.success,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: GestureDetector(
                    onTap: () => typeController.value = TransactionType.expense,
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: typeController.value == TransactionType.expense
                            ? LiquidGlassColors.danger
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: LiquidGlassColors.danger,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          'Расход',
                          style: TextStyle(
                            color:
                                typeController.value == TransactionType.expense
                                    ? Colors.white
                                    : LiquidGlassColors.danger,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          TextField(
            controller: amountController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              hintText: 'Сумма',
              prefixIcon: Icon(LucideIcons.banknote, size: 18),
            ),
          ),
          const SizedBox(height: 12),

          TextField(
            controller: categoryController,
            decoration: const InputDecoration(
              hintText: 'Категория',
              prefixIcon: Icon(LucideIcons.tag, size: 18),
            ),
          ),
          const SizedBox(height: 12),

          TextField(
            controller: descController,
            decoration: const InputDecoration(
              hintText: 'Описание',
              prefixIcon: Icon(LucideIcons.fileText, size: 18),
            ),
          ),
          const SizedBox(height: 20),

          GlassButton(
            label: 'Добавить',
            icon: LucideIcons.plus,
            onTap: () async {
              final amount = int.tryParse(amountController.text);
              if (amount == null || amount <= 0) return;

              final dataProvider = context.read<DataProvider>();
              await dataProvider.addTransaction({
                'type': typeController.value.name,
                'amount': amount,
                'category': categoryController.text,
                'description': descController.text,
              });

              if (context.mounted) Navigator.of(context).pop();
            },
          ),
        ],
      ),
    );
  }

  /// Детали транзакции
  void _showTransactionDetails(BuildContext context, Transaction tx) {
    showGlassModal(
      context: context,
      title: tx.category.isNotEmpty ? tx.category : 'Транзакция',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${tx.type == TransactionType.income ? '+' : '-'}${tx.amount} \u20BD',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: tx.type == TransactionType.income
                      ? LiquidGlassColors.success
                      : LiquidGlassColors.danger,
                ),
          ),
          if (tx.description.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(tx.description),
          ],
          const SizedBox(height: 8),
          Text(
            date_utils.formatDate(tx.date),
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 20),
          GlassButton(
            label: 'Удалить',
            style: GlassButtonStyle.danger,
            icon: LucideIcons.trash2,
            onTap: () async {
              await context.read<DataProvider>().deleteTransaction(tx.id);
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
        ],
      ),
    );
  }
}

/// Мини-статистика
class _MiniStat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _MiniStat({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 2),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w600,
              fontSize: 15,
            ),
          ),
        ],
      ),
    );
  }
}

/// Фильтр-чип
class _FilterChip extends StatelessWidget {
  final String label;
  final bool isActive;
  final VoidCallback onTap;
  final Color? color;

  const _FilterChip({
    required this.label,
    required this.isActive,
    required this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final activeColor = color ?? LiquidGlassColors.primary;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? activeColor : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isActive ? activeColor : activeColor.withValues(alpha: 0.3),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isActive ? Colors.white : activeColor,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }
}
