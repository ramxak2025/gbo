/// Экран регистрации тренера
///
/// Форма для подачи заявки на регистрацию.
/// Заявка ожидает одобрения суперадмином.
library;

import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../providers/theme_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../utils/sports.dart';
import '../widgets/glass_card.dart';
import '../widgets/glass_button.dart';
import '../widgets/page_header.dart';

/// Экран регистрации нового тренера
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _clubController = TextEditingController();
  final _cityController = TextEditingController();
  String? _selectedSport;
  bool _consent = false;
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _clubController.dispose();
    _cityController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (_nameController.text.trim().isEmpty ||
        _phoneController.text.trim().isEmpty ||
        _passwordController.text.isEmpty) {
      _showMessage('Заполните обязательные поля', isError: true);
      return;
    }
    if (!_consent) {
      _showMessage('Необходимо согласие на обработку данных', isError: true);
      return;
    }

    setState(() => _isLoading = true);

    try {
      final api = context.read<ApiService>();
      await api.register(
        name: _nameController.text.trim(),
        phone: _phoneController.text.trim(),
        password: _passwordController.text,
        clubName: _clubController.text.trim(),
        sportType: _selectedSport,
        city: _cityController.text.trim(),
        consent: _consent,
      );

      if (mounted) {
        _showMessage('Заявка отправлена! Ожидайте одобрения.');
        Navigator.of(context).pop();
      }
    } on ApiException catch (e) {
      if (mounted) _showMessage(e.message, isError: true);
    } catch (_) {
      if (mounted) _showMessage('Ошибка подключения', isError: true);
    }

    if (mounted) setState(() => _isLoading = false);
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor:
            isError ? LiquidGlassColors.danger : LiquidGlassColors.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LiquidGlassColors.backgroundGradient(isDark: isDark),
        ),
        child: SafeArea(
          child: Column(
            children: [
              const PageHeader(
                title: 'Регистрация',
                showBack: true,
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Имя
                        TextField(
                          controller: _nameController,
                          decoration: const InputDecoration(
                            hintText: 'Ваше имя *',
                            prefixIcon: Icon(LucideIcons.user, size: 18),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Телефон
                        TextField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          decoration: const InputDecoration(
                            hintText: 'Номер телефона *',
                            prefixIcon: Icon(LucideIcons.phone, size: 18),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Пароль
                        TextField(
                          controller: _passwordController,
                          obscureText: true,
                          decoration: const InputDecoration(
                            hintText: 'Пароль *',
                            prefixIcon: Icon(LucideIcons.lock, size: 18),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Клуб
                        TextField(
                          controller: _clubController,
                          decoration: const InputDecoration(
                            hintText: 'Название клуба',
                            prefixIcon: Icon(LucideIcons.building, size: 18),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Город
                        TextField(
                          controller: _cityController,
                          decoration: const InputDecoration(
                            hintText: 'Город',
                            prefixIcon:
                                Icon(LucideIcons.mapPin, size: 18),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Вид спорта
                        DropdownButtonFormField<String>(
                          value: _selectedSport,
                          decoration: const InputDecoration(
                            hintText: 'Вид спорта',
                            prefixIcon: Icon(LucideIcons.trophy, size: 18),
                          ),
                          items: sportsList
                              .map((s) => DropdownMenuItem<String>(
                                    value: s.id,
                                    child: Text('${s.emoji} ${s.name}'),
                                  ))
                              .toList(),
                          onChanged: (v) =>
                              setState(() => _selectedSport = v),
                        ),
                        const SizedBox(height: 16),

                        // Согласие
                        Row(
                          children: [
                            Checkbox(
                              value: _consent,
                              onChanged: (v) =>
                                  setState(() => _consent = v ?? false),
                              activeColor: LiquidGlassColors.primary,
                            ),
                            Expanded(
                              child: GestureDetector(
                                onTap: () =>
                                    setState(() => _consent = !_consent),
                                child: Text(
                                  'Согласие на обработку персональных данных',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),

                        // Кнопка
                        GlassButton(
                          label: 'Отправить заявку',
                          icon: LucideIcons.send,
                          onTap: _isLoading ? null : _register,
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
