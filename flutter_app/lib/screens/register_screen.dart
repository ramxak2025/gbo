/// Экран регистрации тренера
///
/// Форма для подачи заявки на регистрацию.
/// Дизайн полностью соответствует веб-версии.
library;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../providers/theme_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../utils/sports.dart';

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
  String? _error;
  bool _obscurePassword = true;
  bool _success = false;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _clubController.dispose();
    _cityController.dispose();
    super.dispose();
  }

  String _formatPhone(String value) {
    final digits = value.replaceAll(RegExp(r'\D'), '');
    if (digits.isEmpty) return '';
    var d = digits;
    if (d.isNotEmpty && d[0] == '7' && d.length <= 11) d = '8${d.substring(1)}';
    if (d.isNotEmpty && d[0] != '8') d = '8$d';
    if (d.length > 11) d = d.substring(0, 11);
    var result = d[0];
    if (d.length > 1) result += ' (${d.substring(1, d.length > 4 ? 4 : d.length)}';
    if (d.length >= 4) result += ') ';
    if (d.length > 4) result += d.substring(4, d.length > 7 ? 7 : d.length);
    if (d.length > 7) result += '-${d.substring(7, d.length > 9 ? 9 : d.length)}';
    if (d.length > 9) result += '-${d.substring(9, d.length > 11 ? 11 : d.length)}';
    return result;
  }

  void _onPhoneChanged(String value) {
    final formatted = _formatPhone(value);
    if (formatted != _phoneController.text) {
      _phoneController.value = TextEditingValue(
        text: formatted,
        selection: TextSelection.collapsed(offset: formatted.length),
      );
    }
  }

  Future<void> _register() async {
    setState(() => _error = null);

    if (_nameController.text.trim().isEmpty) {
      setState(() => _error = 'Введите ФИО');
      return;
    }
    final digits = _phoneController.text.replaceAll(RegExp(r'\D'), '');
    if (digits.length < 11) {
      setState(() => _error = 'Введите полный номер телефона');
      return;
    }
    if (_passwordController.text.isEmpty || _passwordController.text.length < 4) {
      setState(() => _error = 'Пароль минимум 4 символа');
      return;
    }
    if (_clubController.text.trim().isEmpty) {
      setState(() => _error = 'Введите название клуба');
      return;
    }
    if (!_consent) {
      setState(() => _error = 'Необходимо согласие на обработку персональных данных');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final api = context.read<ApiService>();
      await api.register(
        name: _nameController.text.trim(),
        phone: digits,
        password: _passwordController.text,
        clubName: _clubController.text.trim(),
        sportType: _selectedSport,
        city: _cityController.text.trim().isNotEmpty ? _cityController.text.trim() : null,
        consent: _consent,
      );

      if (mounted) {
        setState(() => _success = true);
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) setState(() => _error = 'Ошибка подключения');
    }

    if (mounted) setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LiquidGlassColors.backgroundGradient(isDark: isDark),
        ),
        child: Stack(
          children: [
            // Фоновые круги
            Positioned(
              top: -MediaQuery.of(context).size.height * 0.2,
              left: -MediaQuery.of(context).size.width * 0.3,
              child: Container(
                width: MediaQuery.of(context).size.width * 0.8,
                height: MediaQuery.of(context).size.width * 0.8,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDark
                      ? const Color(0xFF7C3AED).withValues(alpha: 0.15)
                      : const Color(0xFFC084FC).withValues(alpha: 0.2),
                ),
              ),
            ),
            Positioned(
              bottom: -MediaQuery.of(context).size.height * 0.15,
              right: -MediaQuery.of(context).size.width * 0.2,
              child: Container(
                width: MediaQuery.of(context).size.width * 0.6,
                height: MediaQuery.of(context).size.width * 0.6,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDark
                      ? const Color(0xFFDC2626).withValues(alpha: 0.1)
                      : const Color(0xFFFCA5A5).withValues(alpha: 0.15),
                ),
              ),
            ),

            // Кнопка назад
            Positioned(
              top: MediaQuery.of(context).padding.top + 16,
              left: 20,
              child: GestureDetector(
                onTap: () => Navigator.of(context).pop(),
                child: Row(
                  children: [
                    Icon(
                      LucideIcons.arrowLeft,
                      size: 18,
                      color: isDark ? Colors.white : Colors.black,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Назад',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: isDark ? Colors.white : Colors.black,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Основной контент
            SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 380),
                    child: _success ? _buildSuccessView(isDark) : _buildRegisterForm(isDark),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuccessView(bool isDark) {
    return Column(
      children: [
        const SizedBox(height: 40),
        Container(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: isDark
                    ? const Color(0xFF22C55E).withValues(alpha: 0.2)
                    : const Color(0xFF86EFAC).withValues(alpha: 0.3),
                blurRadius: 40,
                spreadRadius: 12,
              ),
            ],
          ),
          child: Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF22C55E).withValues(alpha: 0.2),
            ),
            child: const Icon(
              LucideIcons.checkSquare,
              size: 36,
              color: Color(0xFF4ADE80),
            ),
          ),
        ).animate().fadeIn(duration: 600.ms).scale(begin: const Offset(0.5, 0.5)),
        const SizedBox(height: 20),
        const Text(
          'Заявка отправлена!',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
        ).animate().fadeIn(delay: 200.ms, duration: 600.ms),
        const SizedBox(height: 8),
        Text(
          'Администратор рассмотрит вашу заявку.\nПосле одобрения войдите с указанным номером и паролем.',
          style: TextStyle(
            fontSize: 14,
            color: isDark
                ? Colors.white.withValues(alpha: 0.5)
                : Colors.grey[500],
            height: 1.5,
          ),
          textAlign: TextAlign.center,
        ).animate().fadeIn(delay: 400.ms, duration: 600.ms),
        const SizedBox(height: 32),
        GestureDetector(
          onTap: () => Navigator.of(context).pop(),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              gradient: const LinearGradient(
                colors: [Color(0xFF9333EA), Color(0xFF7C3AED), Color(0xFF4F46E5)],
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF9333EA).withValues(alpha: 0.25),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(LucideIcons.logIn, size: 16, color: Colors.white),
                SizedBox(width: 8),
                Text(
                  'Вернуться к входу',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ).animate().fadeIn(delay: 600.ms, duration: 600.ms),
      ],
    );
  }

  Widget _buildRegisterForm(bool isDark) {
    return Column(
      children: [
        // Иконка и заголовок
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            color: isDark
                ? const Color(0xFF8B5CF6).withValues(alpha: 0.15)
                : const Color(0xFFF3E8FF),
          ),
          child: Icon(
            LucideIcons.userPlus,
            size: 26,
            color: isDark ? const Color(0xFFC084FC) : const Color(0xFF9333EA),
          ),
        ).animate().fadeIn(duration: 500.ms).scale(begin: const Offset(0.8, 0.8)),
        const SizedBox(height: 12),
        const Text(
          'Регистрация тренера',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
        ).animate().fadeIn(delay: 100.ms, duration: 500.ms),
        const SizedBox(height: 4),
        Text(
          'Заполните данные для подачи заявки',
          style: TextStyle(
            fontSize: 12,
            color: isDark
                ? Colors.white.withValues(alpha: 0.4)
                : Colors.grey[500],
          ),
        ).animate().fadeIn(delay: 200.ms, duration: 500.ms),
        const SizedBox(height: 20),

        // Карточка формы
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            color: isDark
                ? Colors.white.withValues(alpha: 0.04)
                : Colors.white.withValues(alpha: 0.8),
            border: Border.all(
              color: isDark
                  ? Colors.white.withValues(alpha: 0.06)
                  : Colors.white.withValues(alpha: 0.6),
            ),
            boxShadow: isDark
                ? null
                : [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
          ),
          child: Column(
            children: [
              // ФИО
              _buildField(
                controller: _nameController,
                hint: 'ФИО *',
                icon: LucideIcons.user,
                isDark: isDark,
              ),
              const SizedBox(height: 12),

              // Телефон
              _buildField(
                controller: _phoneController,
                hint: 'Телефон *',
                icon: LucideIcons.phone,
                isDark: isDark,
                keyboardType: TextInputType.phone,
                onChanged: _onPhoneChanged,
                maxLength: 18,
              ),
              const SizedBox(height: 12),

              // Пароль
              _buildField(
                controller: _passwordController,
                hint: 'Пароль *',
                icon: LucideIcons.lock,
                isDark: isDark,
                obscureText: _obscurePassword,
                suffixIcon: GestureDetector(
                  onTap: () => setState(() => _obscurePassword = !_obscurePassword),
                  child: Icon(
                    _obscurePassword ? LucideIcons.eyeOff : LucideIcons.eye,
                    size: 16,
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.25)
                        : Colors.grey[500],
                  ),
                ),
              ),

              // Разделитель
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Container(
                  height: 1,
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.06)
                      : Colors.black.withValues(alpha: 0.04),
                ),
              ),

              // Клуб
              _buildField(
                controller: _clubController,
                hint: 'Название клуба *',
                icon: LucideIcons.building,
                isDark: isDark,
              ),
              const SizedBox(height: 12),

              // Вид спорта
              _buildSportDropdown(isDark),
              const SizedBox(height: 12),

              // Город
              _buildField(
                controller: _cityController,
                hint: 'Город',
                icon: LucideIcons.mapPin,
                isDark: isDark,
              ),

              // Разделитель
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Container(
                  height: 1,
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.06)
                      : Colors.black.withValues(alpha: 0.04),
                ),
              ),

              // Согласие
              _buildConsentButton(isDark),

              // Ошибка
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(
                  _error!,
                  style: const TextStyle(
                    color: LiquidGlassColors.danger,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],

              const SizedBox(height: 16),

              // Кнопка отправки
              GestureDetector(
                onTap: _isLoading ? null : _register,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    gradient: const LinearGradient(
                      colors: [Color(0xFF9333EA), Color(0xFF7C3AED), Color(0xFF4F46E5)],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF9333EA).withValues(alpha: 0.25),
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Center(
                    child: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(LucideIcons.send, size: 16, color: Colors.white),
                              SizedBox(width: 8),
                              Text(
                                'Отправить заявку',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                  ),
                ),
              ),
            ],
          ),
        ).animate().fadeIn(delay: 300.ms, duration: 600.ms).slideY(begin: 0.2),
      ],
    );
  }

  Widget _buildField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    required bool isDark,
    TextInputType? keyboardType,
    bool obscureText = false,
    ValueChanged<String>? onChanged,
    Widget? suffixIcon,
    int? maxLength,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      onChanged: onChanged,
      maxLength: maxLength,
      style: TextStyle(
        fontSize: 15,
        color: isDark ? Colors.white : Colors.grey[900],
      ),
      decoration: InputDecoration(
        hintText: hint,
        counterText: '',
        hintStyle: TextStyle(
          color: isDark
              ? Colors.white.withValues(alpha: 0.25)
              : Colors.grey[400],
        ),
        prefixIcon: Icon(
          icon,
          size: 16,
          color: isDark
              ? Colors.white.withValues(alpha: 0.2)
              : Colors.grey[500],
        ),
        suffixIcon: suffixIcon != null
            ? Padding(padding: const EdgeInsets.only(right: 12), child: suffixIcon)
            : null,
        suffixIconConstraints: const BoxConstraints(minWidth: 40, minHeight: 20),
        filled: true,
        fillColor: isDark
            ? Colors.white.withValues(alpha: 0.07)
            : Colors.white.withValues(alpha: 0.8),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(
            color: isDark
                ? Colors.white.withValues(alpha: 0.08)
                : Colors.white.withValues(alpha: 0.6),
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(
            color: isDark
                ? Colors.white.withValues(alpha: 0.08)
                : Colors.white.withValues(alpha: 0.6),
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(
            color: const Color(0xFF8B5CF6).withValues(alpha: isDark ? 0.5 : 1.0),
          ),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }

  Widget _buildSportDropdown(bool isDark) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        color: isDark
            ? Colors.white.withValues(alpha: 0.07)
            : Colors.white.withValues(alpha: 0.8),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.08)
              : Colors.white.withValues(alpha: 0.6),
        ),
      ),
      child: DropdownButtonFormField<String>(
        value: _selectedSport,
        decoration: InputDecoration(
          hintText: 'Вид спорта',
          hintStyle: TextStyle(
            color: isDark
                ? Colors.white.withValues(alpha: 0.25)
                : Colors.grey[400],
          ),
          prefixIcon: Icon(
            LucideIcons.trophy,
            size: 16,
            color: isDark
                ? Colors.white.withValues(alpha: 0.2)
                : Colors.grey[500],
          ),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
        dropdownColor: isDark ? const Color(0xFF1A1A2E) : Colors.white,
        style: TextStyle(
          fontSize: 15,
          color: isDark ? Colors.white : Colors.grey[900],
        ),
        items: sportsList
            .map((s) => DropdownMenuItem<String>(
                  value: s.id,
                  child: Text('${s.emoji} ${s.name}'),
                ))
            .toList(),
        onChanged: (v) => setState(() => _selectedSport = v),
      ),
    );
  }

  Widget _buildConsentButton(bool isDark) {
    return GestureDetector(
      onTap: () => setState(() => _consent = !_consent),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          color: _consent
              ? (isDark
                  ? const Color(0xFF22C55E).withValues(alpha: 0.1)
                  : const Color(0xFFF0FDF4))
              : (isDark
                  ? Colors.white.withValues(alpha: 0.04)
                  : Colors.white.withValues(alpha: 0.8)),
          border: Border.all(
            color: _consent
                ? (isDark
                    ? const Color(0xFF22C55E).withValues(alpha: 0.2)
                    : const Color(0xFFBBF7D0))
                : (isDark
                    ? Colors.white.withValues(alpha: 0.06)
                    : Colors.white.withValues(alpha: 0.6)),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              _consent ? LucideIcons.checkSquare : LucideIcons.square,
              size: 18,
              color: _consent
                  ? const Color(0xFF22C55E)
                  : (isDark
                      ? Colors.white.withValues(alpha: 0.2)
                      : Colors.grey[500]),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Даю согласие на обработку персональных данных в соответствии с ФЗ №152 «О персональных данных» *',
                style: TextStyle(
                  fontSize: 11,
                  height: 1.5,
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.5)
                      : Colors.grey[500],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
