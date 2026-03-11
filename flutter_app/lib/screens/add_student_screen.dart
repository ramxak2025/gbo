/// Экран добавления ученика
///
/// Форма для создания нового ученика тренером.
/// Поддерживает все поля: имя, телефон, пароль,
/// группа, вес, пояс, дата рождения.
library;

import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/data_provider.dart';
import '../providers/theme_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import '../widgets/glass_button.dart';
import '../widgets/page_header.dart';
import '../utils/date_utils.dart' as date_utils;

/// Экран добавления ученика
class AddStudentScreen extends StatefulWidget {
  const AddStudentScreen({super.key});

  @override
  State<AddStudentScreen> createState() => _AddStudentScreenState();
}

class _AddStudentScreenState extends State<AddStudentScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController(text: 'student123');
  final _weightController = TextEditingController();
  final _beltController = TextEditingController();
  String? _selectedGroupId;
  DateTime? _birthDate;
  DateTime? _subscriptionExpires;
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _weightController.dispose();
    _beltController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_nameController.text.trim().isEmpty ||
        _phoneController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Введите имя и телефон'),
          backgroundColor: LiquidGlassColors.danger,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final data = context.read<DataProvider>();
      await data.addStudent({
        'name': _nameController.text.trim(),
        'phone': _phoneController.text.trim(),
        'password': _passwordController.text,
        'groupId': _selectedGroupId,
        'weight': double.tryParse(_weightController.text),
        'belt': _beltController.text.trim().isNotEmpty
            ? _beltController.text.trim()
            : null,
        'birthDate': _birthDate != null
            ? date_utils.formatDateApi(_birthDate!)
            : null,
        'subscriptionExpiresAt': _subscriptionExpires?.toIso8601String(),
      });

      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Ошибка: $e'),
            backgroundColor: LiquidGlassColors.danger,
          ),
        );
      }
    }

    if (mounted) setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;
    final auth = context.watch<AuthProvider>();
    final data = context.watch<DataProvider>();
    final groups = data.groupsForTrainer(auth.userId!);

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LiquidGlassColors.backgroundGradient(isDark: isDark),
        ),
        child: SafeArea(
          child: Column(
            children: [
              const PageHeader(
                title: 'Новый ученик',
                showBack: true,
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: GlassCard(
                    child: Column(
                      children: [
                        TextField(
                          controller: _nameController,
                          decoration: const InputDecoration(
                            hintText: 'Имя ученика *',
                            prefixIcon: Icon(LucideIcons.user, size: 18),
                          ),
                        ),
                        const SizedBox(height: 12),

                        TextField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          decoration: const InputDecoration(
                            hintText: 'Телефон *',
                            prefixIcon: Icon(LucideIcons.phone, size: 18),
                          ),
                        ),
                        const SizedBox(height: 12),

                        TextField(
                          controller: _passwordController,
                          decoration: const InputDecoration(
                            hintText: 'Пароль',
                            prefixIcon: Icon(LucideIcons.lock, size: 18),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Выбор группы
                        if (groups.isNotEmpty)
                          DropdownButtonFormField<String>(
                            value: _selectedGroupId,
                            decoration: const InputDecoration(
                              hintText: 'Группа',
                              prefixIcon:
                                  Icon(LucideIcons.layers, size: 18),
                            ),
                            items: [
                              const DropdownMenuItem<String>(
                                value: null,
                                child: Text('Без группы'),
                              ),
                              ...groups.map((g) =>
                                  DropdownMenuItem<String>(
                                    value: g.id,
                                    child: Text(g.name),
                                  )),
                            ],
                            onChanged: (v) =>
                                setState(() => _selectedGroupId = v),
                          ),
                        if (groups.isNotEmpty) const SizedBox(height: 12),

                        TextField(
                          controller: _weightController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            hintText: 'Вес (кг)',
                            prefixIcon: Icon(LucideIcons.scale, size: 18),
                          ),
                        ),
                        const SizedBox(height: 12),

                        TextField(
                          controller: _beltController,
                          decoration: const InputDecoration(
                            hintText: 'Пояс',
                            prefixIcon: Icon(LucideIcons.award, size: 18),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Дата рождения
                        GestureDetector(
                          onTap: () async {
                            final date = await showDatePicker(
                              context: context,
                              initialDate: DateTime(2005),
                              firstDate: DateTime(1970),
                              lastDate: DateTime.now(),
                            );
                            if (date != null) {
                              setState(() => _birthDate = date);
                            }
                          },
                          child: InputDecorator(
                            decoration: const InputDecoration(
                              hintText: 'Дата рождения',
                              prefixIcon:
                                  Icon(LucideIcons.cake, size: 18),
                            ),
                            child: Text(
                              _birthDate != null
                                  ? date_utils.formatDate(
                                      _birthDate!.toIso8601String())
                                  : 'Дата рождения',
                              style: _birthDate != null
                                  ? null
                                  : TextStyle(
                                      color: Theme.of(context)
                                          .hintColor,
                                    ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Подписка до
                        GestureDetector(
                          onTap: () async {
                            final date = await showDatePicker(
                              context: context,
                              initialDate:
                                  DateTime.now().add(const Duration(days: 30)),
                              firstDate: DateTime.now(),
                              lastDate:
                                  DateTime.now().add(const Duration(days: 365)),
                            );
                            if (date != null) {
                              setState(
                                  () => _subscriptionExpires = date);
                            }
                          },
                          child: InputDecorator(
                            decoration: const InputDecoration(
                              hintText: 'Подписка до',
                              prefixIcon: Icon(LucideIcons.creditCard,
                                  size: 18),
                            ),
                            child: Text(
                              _subscriptionExpires != null
                                  ? date_utils.formatDate(
                                      _subscriptionExpires!.toIso8601String())
                                  : 'Подписка до',
                              style: _subscriptionExpires != null
                                  ? null
                                  : TextStyle(
                                      color: Theme.of(context)
                                          .hintColor,
                                    ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),

                        GlassButton(
                          label: 'Добавить ученика',
                          icon: LucideIcons.userPlus,
                          onTap: _isLoading ? null : _save,
                          isLoading: _isLoading,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
