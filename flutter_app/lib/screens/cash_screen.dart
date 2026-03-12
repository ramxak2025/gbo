import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/data_provider.dart';
import '../providers/theme_provider.dart';
import '../theme/app_theme.dart';
import '../models/models.dart' as m;
import '../widgets/glass_card.dart';
import '../widgets/page_header.dart';
import '../widgets/section_title.dart';

class CashScreen extends StatefulWidget {
  const CashScreen({super.key});

  @override
  State<CashScreen> createState() => _CashScreenState();
}

class _CashScreenState extends State<CashScreen> {
  int _monthOffset = 0;
  String _filter = 'all'; // all, income, expense

  DateTime get _viewMonth {
    final now = DateTime.now();
    return DateTime(now.year, now.month + _monthOffset);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final data = context.watch<DataProvider>();
    final tp = context.watch<ThemeProvider>();
    final t = tp.theme;
    final isDark = tp.isDark;

    final monthTx = data.transactions.where((tx) {
      if (tx.date == null) return false;
      final d = DateTime.parse(tx.date!);
      return d.month == _viewMonth.month && d.year == _viewMonth.year;
    }).toList()
      ..sort((a, b) => (b.date ?? '').compareTo(a.date ?? ''));

    final filteredTx = _filter == 'all'
        ? monthTx
        : monthTx.where((tx) => tx.type == _filter).toList();

    final income = monthTx.where((tx) => tx.type == 'income').fold(0.0, (s, tx) => s + tx.amount);
    final expense = monthTx.where((tx) => tx.type == 'expense').fold(0.0, (s, tx) => s + tx.amount);
    final balance = income - expense;
    final fmt = NumberFormat('#,###', 'ru');

    return Scaffold(
      backgroundColor: t.bg,
      body: Stack(
        children: [
          Positioned(top: -60, left: -80, child: _blob(AppColors.green, 180)),
          Positioned(bottom: 80, right: -60, child: _blob(AppColors.red, 150)),

          CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const PageHeader(title: 'Финансы'),

                      // Balance card
                      GlassCard(
                        child: Column(
                          children: [
                            Text(
                              'Баланс',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1, color: t.textMuted),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${balance >= 0 ? '+' : ''}${fmt.format(balance)} \u20BD',
                              style: TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.w900,
                                color: balance >= 0 ? t.green : t.red,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceAround,
                              children: [
                                _BalancePart(
                                  icon: Icons.trending_up,
                                  label: 'Доход',
                                  value: '+${fmt.format(income)}',
                                  color: t.green,
                                ),
                                Container(width: 1, height: 30, color: t.cardBorder),
                                _BalancePart(
                                  icon: Icons.trending_down,
                                  label: 'Расход',
                                  value: '-${fmt.format(expense)}',
                                  color: t.red,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      // Month navigation
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          IconButton(
                            onPressed: () => setState(() => _monthOffset--),
                            icon: Icon(Icons.chevron_left, color: t.textSecondary),
                          ),
                          Text(
                            DateFormat('LLLL yyyy', 'ru').format(_viewMonth),
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: t.text),
                          ),
                          IconButton(
                            onPressed: _monthOffset < 0 ? () => setState(() => _monthOffset++) : null,
                            icon: Icon(Icons.chevron_right, color: _monthOffset < 0 ? t.textSecondary : t.textMuted),
                          ),
                        ],
                      ),

                      const SizedBox(height: 8),

                      // Filter tabs
                      Row(
                        children: [
                          _FilterTab(label: 'Все', active: _filter == 'all', onTap: () => setState(() => _filter = 'all'), t: t, isDark: isDark),
                          const SizedBox(width: 8),
                          _FilterTab(label: 'Доходы', active: _filter == 'income', onTap: () => setState(() => _filter = 'income'), t: t, isDark: isDark, color: AppColors.green),
                          const SizedBox(width: 8),
                          _FilterTab(label: 'Расходы', active: _filter == 'expense', onTap: () => setState(() => _filter = 'expense'), t: t, isDark: isDark, color: AppColors.red),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // Transactions
                      if (filteredTx.isEmpty)
                        Center(
                          child: Padding(
                            padding: const EdgeInsets.all(40),
                            child: Column(
                              children: [
                                Icon(Icons.account_balance_wallet_outlined, size: 48, color: t.textMuted),
                                const SizedBox(height: 12),
                                Text('Нет операций', style: TextStyle(color: t.textMuted)),
                              ],
                            ),
                          ),
                        )
                      else
                        ...filteredTx.map((tx) => _TransactionCard(tx: tx, t: t, isDark: isDark, data: data)),

                      const SizedBox(height: 120),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
      floatingActionButton: auth.role == 'trainer' ? FloatingActionButton(
        onPressed: () => _showAddTransaction(context, t, isDark),
        backgroundColor: t.accent,
        child: const Icon(Icons.add, color: Colors.white),
      ) : null,
    );
  }

  Widget _blob(Color color, double size) => Container(
    width: size, height: size,
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      gradient: RadialGradient(colors: [color.withOpacity(0.12), Colors.transparent]),
    ),
  );

  void _showAddTransaction(BuildContext context, dynamic t, bool isDark) {
    String type = 'income';
    final amountCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    String category = 'Оплата';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Container(
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1A1A2E) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(width: 40, height: 4, decoration: BoxDecoration(color: t.textMuted.withOpacity(0.3), borderRadius: BorderRadius.circular(2))),
                ),
                const SizedBox(height: 20),
                Text('Новая операция', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: t.text)),
                const SizedBox(height: 16),

                // Type toggle
                Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setModalState(() => type = 'income'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            color: type == 'income' ? AppColors.green.withOpacity(0.15) : t.input,
                            border: Border.all(color: type == 'income' ? AppColors.green.withOpacity(0.4) : t.inputBorder),
                          ),
                          child: Center(child: Text('Доход', style: TextStyle(fontWeight: FontWeight.w600, color: type == 'income' ? AppColors.green : t.textSecondary))),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setModalState(() => type = 'expense'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            color: type == 'expense' ? AppColors.red.withOpacity(0.15) : t.input,
                            border: Border.all(color: type == 'expense' ? AppColors.red.withOpacity(0.4) : t.inputBorder),
                          ),
                          child: Center(child: Text('Расход', style: TextStyle(fontWeight: FontWeight.w600, color: type == 'expense' ? AppColors.red : t.textSecondary))),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                TextField(
                  controller: amountCtrl,
                  keyboardType: TextInputType.number,
                  style: TextStyle(color: t.text, fontSize: 20, fontWeight: FontWeight.w700),
                  decoration: InputDecoration(
                    hintText: 'Сумма',
                    hintStyle: TextStyle(color: t.textMuted),
                    filled: true,
                    fillColor: t.input,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: t.inputBorder)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: t.inputBorder)),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: descCtrl,
                  style: TextStyle(color: t.text),
                  decoration: InputDecoration(
                    hintText: 'Описание',
                    hintStyle: TextStyle(color: t.textMuted),
                    filled: true,
                    fillColor: t.input,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: t.inputBorder)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: t.inputBorder)),
                  ),
                ),
                const SizedBox(height: 16),

                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: t.accent,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    onPressed: () async {
                      final amount = double.tryParse(amountCtrl.text);
                      if (amount == null || amount <= 0) return;
                      try {
                        await context.read<DataProvider>().addTransaction({
                          'type': type,
                          'amount': amount,
                          'description': descCtrl.text,
                          'category': category,
                          'date': DateTime.now().toIso8601String(),
                        });
                        if (ctx.mounted) Navigator.pop(ctx);
                      } catch (e) {
                        if (ctx.mounted) {
                          ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text(e.toString())));
                        }
                      }
                    },
                    child: const Text('Добавить', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _BalancePart extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _BalancePart({required this.icon, required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 4),
            Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: color)),
          ],
        ),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(fontSize: 10, color: color.withOpacity(0.7))),
      ],
    );
  }
}

class _FilterTab extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;
  final dynamic t;
  final bool isDark;
  final Color? color;

  const _FilterTab({required this.label, required this.active, required this.onTap, required this.t, required this.isDark, this.color});

  @override
  Widget build(BuildContext context) {
    final activeColor = color ?? t.accent;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          color: active ? activeColor.withOpacity(0.15) : t.card,
          border: Border.all(color: active ? activeColor.withOpacity(0.4) : t.cardBorder),
        ),
        child: Text(
          label,
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: active ? activeColor : t.textSecondary),
        ),
      ),
    );
  }
}

class _TransactionCard extends StatelessWidget {
  final m.Transaction tx;
  final dynamic t;
  final bool isDark;
  final DataProvider data;

  const _TransactionCard({required this.tx, required this.t, required this.isDark, required this.data});

  @override
  Widget build(BuildContext context) {
    final isIncome = tx.type == 'income';
    final color = isIncome ? AppColors.green : AppColors.red;
    final fmt = NumberFormat('#,###', 'ru');

    return GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              color: color.withOpacity(0.12),
            ),
            child: Icon(
              isIncome ? Icons.arrow_downward : Icons.arrow_upward,
              size: 18,
              color: color,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tx.description ?? (isIncome ? 'Оплата' : 'Расход'),
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: t.text),
                ),
                if (tx.category != null)
                  Text(tx.category!, style: TextStyle(fontSize: 11, color: t.textMuted)),
              ],
            ),
          ),
          Text(
            '${isIncome ? '+' : '-'}${fmt.format(tx.amount)}',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: color),
          ),
        ],
      ),
    );
  }
}
