/// Касса — точная копия Cash.jsx мобильной веб-версии
///
/// Balance hero card с gradient, action buttons (доход/расход),
/// month selector, monthly bar chart, category breakdown,
/// transaction history с filter tabs, success overlay.
library;

import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/data_provider.dart';
import '../providers/theme_provider.dart';
import '../models/transaction.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import '../widgets/glass_modal.dart';
import '../utils/date_utils.dart' as date_utils;

const _monthsRu = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const _monthsShort = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const _expenseCategories = ['Аренда', 'Инвентарь', 'Зарплата', 'Реклама', 'Прочее'];

const _categoryColors = <String, Color>{
  'Аренда': LiquidGlassColors.blue500,
  'Инвентарь': LiquidGlassColors.purple,
  'Зарплата': LiquidGlassColors.amber500,
  'Реклама': LiquidGlassColors.pink,
  'Прочее': Color(0xFF6B7280),
  'Абонемент': LiquidGlassColors.success,
};

class CashScreen extends StatefulWidget {
  const CashScreen({super.key});

  @override
  State<CashScreen> createState() => _CashScreenState();
}

class _CashScreenState extends State<CashScreen> {
  String _activeTab = 'all';
  late int _selectedMonth;
  late int _selectedYear;
  bool _showSuccess = false;
  String? _successType;
  int _successAmount = 0;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _selectedMonth = now.month - 1;
    _selectedYear = now.year;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;
    final auth = context.watch<AuthProvider>();
    final data = context.watch<DataProvider>();
    final userId = auth.userId!;

    final allTx = data.transactionsForTrainer(userId);
    final myStudents = data.studentsForTrainer(userId);
    final myGroups = data.groupsForTrainer(userId);

    // Total stats
    final totalIncome = allTx.where((t) => t.type == TransactionType.income).fold<int>(0, (s, t) => s + t.amount);
    final totalExpense = allTx.where((t) => t.type == TransactionType.expense).fold<int>(0, (s, t) => s + t.amount);
    final totalBalance = totalIncome - totalExpense;

    // Monthly data
    final monthlyIncome = List<int>.filled(12, 0);
    final monthlyExpense = List<int>.filled(12, 0);
    for (final t in allTx) {
      final d = DateTime.tryParse(t.date);
      if (d != null && d.year == _selectedYear) {
        final m = d.month - 1;
        if (t.type == TransactionType.income) monthlyIncome[m] += t.amount;
        else monthlyExpense[m] += t.amount;
      }
    }

    // Month stats
    final monthTx = allTx.where((t) {
      final d = DateTime.tryParse(t.date);
      return d != null && d.month - 1 == _selectedMonth && d.year == _selectedYear;
    }).toList();
    final monthIncome = monthTx.where((t) => t.type == TransactionType.income).fold<int>(0, (s, t) => s + t.amount);
    final monthExpense = monthTx.where((t) => t.type == TransactionType.expense).fold<int>(0, (s, t) => s + t.amount);
    final monthBalance = monthIncome - monthExpense;

    // Category breakdown
    final catMap = <String, int>{};
    for (final t in monthTx.where((t) => t.type == TransactionType.expense)) {
      catMap[t.category] = (catMap[t.category] ?? 0) + t.amount;
    }
    final catList = catMap.entries.toList()..sort((a, b) => b.value.compareTo(a.value));

    // Filtered tx
    var filteredTx = monthTx;
    if (_activeTab == 'income') filteredTx = filteredTx.where((t) => t.type == TransactionType.income).toList();
    if (_activeTab == 'expense') filteredTx = filteredTx.where((t) => t.type == TransactionType.expense).toList();
    filteredTx = filteredTx.reversed.toList();

    final maxChartVal = math.max(monthlyIncome.reduce(math.max), math.max(monthlyExpense.reduce(math.max), 1));
    final now = DateTime.now();
    final isCurrentMonth = _selectedMonth == now.month - 1 && _selectedYear == now.year;

    return SafeArea(
      child: Stack(
        children: [
          Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: Row(
                  children: [
                    Expanded(child: Text('Касса', style: Theme.of(context).textTheme.headlineMedium)),
                    GestureDetector(
                      onTap: () => _showAddModal(context, data, myStudents, myGroups, isDark),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: LiquidGlassColors.primary.withValues(alpha: 0.15),
                        ),
                        child: const Icon(LucideIcons.plus, color: LiquidGlassColors.primary, size: 20),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              Expanded(
                child: ListView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.only(bottom: 120),
                  children: [
                    // === BALANCE HERO CARD ===
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(24),
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: isDark
                                ? [LiquidGlassColors.indigo500.withValues(alpha: 0.20), Colors.white.withValues(alpha: 0.03), LiquidGlassColors.purple.withValues(alpha: 0.15)]
                                : [const Color(0xFFEEF2FF), Colors.white.withValues(alpha: 0.9), const Color(0xFFF5F3FF)],
                          ),
                          border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.white.withValues(alpha: 0.7)),
                          boxShadow: isDark ? null : [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 40, offset: const Offset(0, 8))],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 36, height: 36,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(10),
                                    gradient: const LinearGradient(colors: [LiquidGlassColors.indigo500, LiquidGlassColors.purple]),
                                  ),
                                  child: const Icon(LucideIcons.wallet, size: 17, color: Colors.white),
                                ),
                                const SizedBox(width: 8),
                                Text('ОБЩИЙ БАЛАНС', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.5, color: isDark ? Colors.white.withValues(alpha: 0.35) : Colors.grey[400])),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              '${_formatMoney(totalBalance)} \u20BD',
                              style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: totalBalance >= 0 ? LiquidGlassColors.success : LiquidGlassColors.accent),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Container(
                                  width: 20, height: 20,
                                  decoration: BoxDecoration(borderRadius: BorderRadius.circular(6), color: LiquidGlassColors.success.withValues(alpha: 0.15)),
                                  child: const Icon(LucideIcons.trendingUp, size: 11, color: LiquidGlassColors.success),
                                ),
                                const SizedBox(width: 4),
                                Text('+${_formatMoney(totalIncome)} \u20BD', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: LiquidGlassColors.success)),
                                const SizedBox(width: 16),
                                Container(
                                  width: 20, height: 20,
                                  decoration: BoxDecoration(borderRadius: BorderRadius.circular(6), color: LiquidGlassColors.danger.withValues(alpha: 0.15)),
                                  child: const Icon(LucideIcons.trendingDown, size: 11, color: LiquidGlassColors.danger),
                                ),
                                const SizedBox(width: 4),
                                Text('-${_formatMoney(totalExpense)} \u20BD', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: LiquidGlassColors.danger)),
                              ],
                            ),
                          ],
                        ),
                      ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1),
                    ),

                    const SizedBox(height: 12),

                    // === ACTION BUTTONS ===
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () {
                                HapticFeedback.mediumImpact();
                                _showIncomeModal(context, data, myStudents, myGroups, isDark);
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(18),
                                  gradient: const LinearGradient(colors: [LiquidGlassColors.success, Color(0xFF059669)]),
                                  boxShadow: [BoxShadow(color: LiquidGlassColors.success.withValues(alpha: 0.2), blurRadius: 12, offset: const Offset(0, 4))],
                                ),
                                child: const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(LucideIcons.arrowDownCircle, size: 18, color: Colors.white),
                                    SizedBox(width: 8),
                                    Text('Доход', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white)),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: GestureDetector(
                              onTap: () {
                                HapticFeedback.mediumImpact();
                                _showExpenseModal(context, data, isDark);
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(18),
                                  gradient: const LinearGradient(colors: [LiquidGlassColors.danger, LiquidGlassColors.rose500]),
                                  boxShadow: [BoxShadow(color: LiquidGlassColors.danger.withValues(alpha: 0.2), blurRadius: 12, offset: const Offset(0, 4))],
                                ),
                                child: const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(LucideIcons.arrowUpCircle, size: 18, color: Colors.white),
                                    SizedBox(width: 8),
                                    Text('Расход', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white)),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 12),

                    // === MONTH SELECTOR + STATS + CHART ===
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(20),
                          color: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.white.withValues(alpha: 0.7),
                          border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.white.withValues(alpha: 0.6)),
                          boxShadow: isDark ? null : [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 12, offset: const Offset(0, 2))],
                        ),
                        child: Column(
                          children: [
                            // Month selector
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                GestureDetector(
                                  onTap: () { HapticFeedback.selectionClick(); _prevMonth(); },
                                  child: Padding(
                                    padding: const EdgeInsets.all(6),
                                    child: Icon(LucideIcons.chevronLeft, size: 18, color: isDark ? Colors.white.withValues(alpha: 0.4) : Colors.grey[400]),
                                  ),
                                ),
                                Column(
                                  children: [
                                    Text(_monthsRu[_selectedMonth], style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
                                    Text('$_selectedYear', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: isDark ? Colors.white.withValues(alpha: 0.25) : Colors.grey[400])),
                                  ],
                                ),
                                GestureDetector(
                                  onTap: () { HapticFeedback.selectionClick(); _nextMonth(); },
                                  child: Padding(
                                    padding: const EdgeInsets.all(6),
                                    child: Icon(LucideIcons.chevronRight, size: 18, color: isDark ? Colors.white.withValues(alpha: 0.4) : Colors.grey[400]),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            // Month stats
                            Row(
                              children: [
                                Expanded(child: _MonthStatChip(value: '+${_formatMoney(monthIncome)}', label: 'Доход', color: LiquidGlassColors.success, isDark: isDark)),
                                const SizedBox(width: 8),
                                Expanded(child: _MonthStatChip(value: '-${_formatMoney(monthExpense)}', label: 'Расход', color: LiquidGlassColors.danger, isDark: isDark)),
                                const SizedBox(width: 8),
                                Expanded(child: _MonthStatChip(value: '${monthBalance >= 0 ? '+' : ''}${_formatMoney(monthBalance)}', label: 'Итого', color: LiquidGlassColors.indigo500, isDark: isDark, balanceColor: monthBalance >= 0 ? LiquidGlassColors.indigo500 : LiquidGlassColors.danger)),
                              ],
                            ),
                            const SizedBox(height: 12),
                            // Mini bar chart
                            SizedBox(
                              height: 64,
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: List.generate(12, (i) {
                                  final val = monthlyIncome[i];
                                  final height = maxChartVal > 0 ? math.max((val / maxChartVal) * 100, 4).toDouble() : 4.0;
                                  final isCurrent = i == now.month - 1;
                                  return Expanded(
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 1),
                                      child: Column(
                                        mainAxisAlignment: MainAxisAlignment.end,
                                        children: [
                                          Flexible(
                                            child: FractionallySizedBox(
                                              heightFactor: height / 100,
                                              child: Container(
                                                decoration: BoxDecoration(
                                                  borderRadius: const BorderRadius.vertical(top: Radius.circular(3)),
                                                  gradient: isCurrent
                                                      ? const LinearGradient(begin: Alignment.bottomCenter, end: Alignment.topCenter, colors: [LiquidGlassColors.accent, LiquidGlassColors.rose500])
                                                      : null,
                                                  color: isCurrent ? null : (val > 0 ? (isDark ? Colors.white.withValues(alpha: 0.15) : Colors.grey.withValues(alpha: 0.3)) : (isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.withValues(alpha: 0.1))),
                                                ),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(_monthsShort[i], style: TextStyle(fontSize: 7, fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w500, color: isCurrent ? LiquidGlassColors.accent : (isDark ? Colors.white.withValues(alpha: 0.2) : Colors.grey[300]))),
                                        ],
                                      ),
                                    ),
                                  );
                                }),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // === CATEGORY BREAKDOWN ===
                    if (catList.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(20),
                            color: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.white.withValues(alpha: 0.7),
                            border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.white.withValues(alpha: 0.6)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(LucideIcons.pieChart, size: 14, color: isDark ? Colors.white.withValues(alpha: 0.3) : Colors.grey[400]),
                                  const SizedBox(width: 6),
                                  Text('РАСХОДЫ ПО КАТЕГОРИЯМ', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1, color: isDark ? Colors.white.withValues(alpha: 0.3) : Colors.grey[400])),
                                ],
                              ),
                              const SizedBox(height: 12),
                              // Progress bar
                              ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: SizedBox(
                                  height: 8,
                                  child: Row(
                                    children: catList.map((e) {
                                      final pct = monthExpense > 0 ? e.value / monthExpense : 0.0;
                                      return Expanded(
                                        flex: (pct * 1000).round().clamp(1, 1000),
                                        child: Container(color: _categoryColors[e.key] ?? Colors.grey),
                                      );
                                    }).toList(),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),
                              ...catList.map((e) {
                                final pct = monthExpense > 0 ? (e.value / monthExpense * 100).round() : 0;
                                final color = _categoryColors[e.key] ?? Colors.grey;
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: Row(
                                    children: [
                                      Container(width: 10, height: 10, decoration: BoxDecoration(shape: BoxShape.circle, color: color)),
                                      const SizedBox(width: 8),
                                      Text(e.key, style: TextStyle(fontSize: 14, color: isDark ? Colors.white.withValues(alpha: 0.6) : Colors.grey[600])),
                                      const Spacer(),
                                      Text('$pct%', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: isDark ? Colors.white.withValues(alpha: 0.3) : Colors.grey[400])),
                                      const SizedBox(width: 8),
                                      Text('${_formatMoney(e.value)} \u20BD', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                                    ],
                                  ),
                                );
                              }),
                            ],
                          ),
                        ),
                      ),
                    ],

                    const SizedBox(height: 12),

                    // === TRANSACTION HISTORY ===
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Column(
                        children: [
                          // Filter tabs
                          Row(
                            children: [
                              _TabChip(label: 'Все', isActive: _activeTab == 'all', isDark: isDark, onTap: () => setState(() => _activeTab = 'all')),
                              const SizedBox(width: 4),
                              _TabChip(label: 'Доходы', isActive: _activeTab == 'income', isDark: isDark, onTap: () => setState(() => _activeTab = 'income')),
                              const SizedBox(width: 4),
                              _TabChip(label: 'Расходы', isActive: _activeTab == 'expense', isDark: isDark, onTap: () => setState(() => _activeTab = 'expense')),
                              const Spacer(),
                              Text('${filteredTx.length} записей', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: isDark ? Colors.white.withValues(alpha: 0.2) : Colors.grey[300])),
                            ],
                          ),
                          const SizedBox(height: 10),
                          // Transactions
                          if (filteredTx.isEmpty)
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 40),
                              child: Column(
                                children: [
                                  Icon(LucideIcons.barChart3, size: 32, color: isDark ? Colors.white.withValues(alpha: 0.1) : Colors.grey[200]),
                                  const SizedBox(height: 8),
                                  Text('Нет транзакций', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: isDark ? Colors.white.withValues(alpha: 0.2) : Colors.grey[300])),
                                  Text('за ${_monthsRu[_selectedMonth].toLowerCase()} $_selectedYear', style: TextStyle(fontSize: 12, color: isDark ? Colors.white.withValues(alpha: 0.15) : Colors.grey[300])),
                                ],
                              ),
                            ),
                          ...filteredTx.asMap().entries.map((entry) {
                            final tx = entry.value;
                            final i = entry.key;
                            final isIncome = tx.type == TransactionType.income;
                            final color = _categoryColors[tx.category] ?? Colors.grey;

                            return Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(16),
                                  color: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.white.withValues(alpha: 0.7),
                                  border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.white.withValues(alpha: 0.6)),
                                  boxShadow: isDark ? null : [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 12, offset: const Offset(0, 2))],
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 40, height: 40,
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(14),
                                        color: isIncome ? LiquidGlassColors.success.withValues(alpha: 0.15) : color.withValues(alpha: 0.15),
                                      ),
                                      child: Icon(
                                        isIncome ? LucideIcons.arrowDownCircle : LucideIcons.arrowUpCircle,
                                        size: 18,
                                        color: isIncome ? LiquidGlassColors.success : color,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(tx.description.isNotEmpty ? tx.description : tx.category, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis),
                                          const SizedBox(height: 2),
                                          Row(
                                            children: [
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                                decoration: BoxDecoration(
                                                  borderRadius: BorderRadius.circular(4),
                                                  color: (isIncome ? LiquidGlassColors.success : color).withValues(alpha: 0.15),
                                                ),
                                                child: Text(tx.category, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: isIncome ? LiquidGlassColors.success : color)),
                                              ),
                                              const SizedBox(width: 6),
                                              Text(date_utils.formatDate(tx.date), style: TextStyle(fontSize: 11, color: isDark ? Colors.white.withValues(alpha: 0.25) : Colors.grey[400])),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      '${isIncome ? '+' : '-'}${_formatMoney(tx.amount)} \u20BD',
                                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: isIncome ? LiquidGlassColors.success : LiquidGlassColors.danger),
                                    ),
                                  ],
                                ),
                              ).animate().fadeIn(delay: Duration(milliseconds: i * 30), duration: 300.ms),
                            );
                          }),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          // Success overlay
          if (_showSuccess) _buildSuccessOverlay(),
        ],
      ),
    );
  }

  void _prevMonth() {
    setState(() {
      if (_selectedMonth == 0) {
        _selectedMonth = 11;
        _selectedYear--;
      } else {
        _selectedMonth--;
      }
    });
  }

  void _nextMonth() {
    setState(() {
      if (_selectedMonth == 11) {
        _selectedMonth = 0;
        _selectedYear++;
      } else {
        _selectedMonth++;
      }
    });
  }

  void _showSuccessAnimation(String type, int amount) {
    HapticFeedback.heavyImpact();
    setState(() {
      _showSuccess = true;
      _successType = type;
      _successAmount = amount;
    });
    Future.delayed(const Duration(milliseconds: 2200), () {
      if (mounted) setState(() => _showSuccess = false);
    });
  }

  Widget _buildSuccessOverlay() {
    final isIncome = _successType == 'income';
    return AnimatedOpacity(
      opacity: _showSuccess ? 1.0 : 0.0,
      duration: const Duration(milliseconds: 300),
      child: Container(
        color: Colors.black.withValues(alpha: 0.4),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 80, height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: isIncome
                        ? [LiquidGlassColors.success, const Color(0xFF059669)]
                        : [LiquidGlassColors.danger, LiquidGlassColors.rose500],
                  ),
                  boxShadow: [BoxShadow(color: (isIncome ? LiquidGlassColors.success : LiquidGlassColors.danger).withValues(alpha: 0.4), blurRadius: 24)],
                ),
                child: Icon(isIncome ? LucideIcons.arrowDownCircle : LucideIcons.arrowUpCircle, size: 36, color: Colors.white),
              ).animate().scale(begin: const Offset(0.5, 0.5), duration: 500.ms, curve: Curves.elasticOut),
              const SizedBox(height: 16),
              Text(
                '${isIncome ? '+' : '-'}${_formatMoney(_successAmount)} \u20BD',
                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white),
              ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.3),
              const SizedBox(height: 4),
              Text(
                isIncome ? 'Доход записан' : 'Расход записан',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Colors.white.withValues(alpha: 0.6)),
              ).animate().fadeIn(delay: 300.ms),
            ],
          ),
        ),
      ),
    );
  }

  void _showAddModal(BuildContext context, DataProvider data, List<dynamic> students, List<dynamic> groups, bool isDark) {
    showGlassModal(
      context: context,
      title: 'Новая операция',
      child: Column(
        children: [
          GestureDetector(
            onTap: () {
              Navigator.pop(context);
              _showIncomeModal(context, data, students, groups, isDark);
            },
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), gradient: const LinearGradient(colors: [LiquidGlassColors.success, Color(0xFF059669)])),
              child: const Center(child: Text('Доход', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white))),
            ),
          ),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: () {
              Navigator.pop(context);
              _showExpenseModal(context, data, isDark);
            },
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), gradient: const LinearGradient(colors: [LiquidGlassColors.danger, LiquidGlassColors.rose500])),
              child: const Center(child: Text('Расход', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white))),
            ),
          ),
        ],
      ),
    );
  }

  void _showIncomeModal(BuildContext context, DataProvider data, List<dynamic> students, List<dynamic> groups, bool isDark) {
    showGlassModal(
      context: context,
      title: 'Принять оплату',
      child: Column(
        children: [
          if (students.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Text('Нет учеников', style: TextStyle(fontSize: 14, color: isDark ? Colors.white.withValues(alpha: 0.3) : Colors.grey[500])),
            ),
          ...students.map((s) {
            final expired = !s.isSubscriptionActive;
            final group = s.groupId != null ? groups.where((g) => g.id == s.groupId).firstOrNull : null;
            final amount = group?.subscriptionCost ?? 5000;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: GestureDetector(
                onTap: () async {
                  await data.handlePayment(s, amount);
                  if (context.mounted) Navigator.pop(context);
                  _showSuccessAnimation('income', amount);
                },
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    color: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.white.withValues(alpha: 0.6),
                    border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.white.withValues(alpha: 0.5)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(s.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                            Text(group?.name ?? 'Без группы', style: TextStyle(fontSize: 12, color: isDark ? Colors.white.withValues(alpha: 0.3) : Colors.grey[400])),
                          ],
                        ),
                      ),
                      if (expired)
                        Container(
                          margin: const EdgeInsets.only(right: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(borderRadius: BorderRadius.circular(12), color: LiquidGlassColors.danger.withValues(alpha: 0.15)),
                          child: const Text('Долг', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: LiquidGlassColors.danger)),
                        ),
                      Text('$amount \u20BD', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: LiquidGlassColors.success)),
                    ],
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  void _showExpenseModal(BuildContext context, DataProvider data, bool isDark) {
    final amountController = TextEditingController();
    final descController = TextEditingController();
    String category = _expenseCategories[0];

    showGlassModal(
      context: context,
      title: 'Добавить расход',
      child: StatefulBuilder(
        builder: (context, setModalState) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(hintText: 'Сумма (\u20BD)', prefixIcon: Icon(LucideIcons.banknote, size: 18)),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: _expenseCategories.map((c) {
                final active = category == c;
                final color = _categoryColors[c] ?? Colors.grey;
                return GestureDetector(
                  onTap: () => setModalState(() => category = c),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      color: active ? color : (isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey[100]),
                      border: active ? null : Border.all(color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey.withValues(alpha: 0.2)),
                    ),
                    child: Text(c, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: active ? Colors.white : (isDark ? Colors.white.withValues(alpha: 0.5) : Colors.grey[500]))),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: descController,
              decoration: const InputDecoration(hintText: 'Описание (необязательно)', prefixIcon: Icon(LucideIcons.fileText, size: 18)),
            ),
            const SizedBox(height: 16),
            GestureDetector(
              onTap: () async {
                final amount = int.tryParse(amountController.text);
                if (amount == null || amount <= 0) return;
                await data.addTransaction({
                  'type': 'expense',
                  'amount': amount,
                  'category': category,
                  'description': descController.text.isNotEmpty ? descController.text : category,
                });
                if (context.mounted) Navigator.pop(context);
                _showSuccessAnimation('expense', amount);
              },
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  gradient: const LinearGradient(colors: [LiquidGlassColors.danger, LiquidGlassColors.rose500]),
                  boxShadow: [BoxShadow(color: LiquidGlassColors.danger.withValues(alpha: 0.2), blurRadius: 12)],
                ),
                child: const Center(child: Text('Сохранить', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white))),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatMoney(int amount) {
    final abs = amount.abs();
    if (abs >= 1000) {
      final str = abs.toString();
      final parts = <String>[];
      for (var i = str.length; i > 0; i -= 3) {
        parts.insert(0, str.substring(i - 3 < 0 ? 0 : i - 3, i));
      }
      return '${amount < 0 ? '-' : ''}${parts.join(' ')}';
    }
    return amount.toString();
  }
}

class _MonthStatChip extends StatelessWidget {
  final String value;
  final String label;
  final Color color;
  final bool isDark;
  final Color? balanceColor;

  const _MonthStatChip({required this.value, required this.label, required this.color, required this.isDark, this.balanceColor});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        color: isDark ? color.withValues(alpha: 0.10) : color.withValues(alpha: 0.06),
      ),
      child: Column(
        children: [
          Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: balanceColor ?? color)),
          Text(label, style: TextStyle(fontSize: 8, fontWeight: FontWeight.w700, color: isDark ? Colors.white.withValues(alpha: 0.2) : Colors.grey[400])),
        ],
      ),
    );
  }
}

class _TabChip extends StatelessWidget {
  final String label;
  final bool isActive;
  final bool isDark;
  final VoidCallback onTap;

  const _TabChip({required this.label, required this.isActive, required this.isDark, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          color: isActive
              ? isDark ? Colors.white.withValues(alpha: 0.15) : Colors.grey[900]
              : Colors.transparent,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: isActive
                ? isDark ? Colors.white : Colors.white
                : isDark ? Colors.white.withValues(alpha: 0.3) : Colors.grey[400],
          ),
        ),
      ),
    );
  }
}
