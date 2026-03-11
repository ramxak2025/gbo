/// Экран входа в систему
///
/// Полноценная форма авторизации, соответствующая веб-версии.
/// Поддерживает вход для тренеров, учеников и суперадминов.
/// Форматирование телефона, демо-доступ, теги видов спорта.
library;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_button.dart';
import 'register_screen.dart';

/// Форматирование телефона в формат 8 (900) 123-45-67
String _formatPhone(String value) {
  final digits = value.replaceAll(RegExp(r'\D'), '');
  if (digits.isEmpty) return '';

  var d = digits;
  if (d.isNotEmpty && d[0] == '7' && d.length <= 11) {
    d = '8${d.substring(1)}';
  }
  if (d.isNotEmpty && d[0] != '8') {
    d = '8$d';
  }
  if (d.length > 11) d = d.substring(0, 11);

  var result = d[0];
  if (d.length > 1) result += ' (${d.substring(1, d.length > 4 ? 4 : d.length)}';
  if (d.length >= 4) result += ') ';
  if (d.length > 4) result += d.substring(4, d.length > 7 ? 7 : d.length);
  if (d.length > 7) result += '-${d.substring(7, d.length > 9 ? 9 : d.length)}';
  if (d.length > 9) result += '-${d.substring(9, d.length > 11 ? 11 : d.length)}';
  return result;
}

/// Очистить телефон до цифр
String _cleanPhone(String value) {
  return value.replaceAll(RegExp(r'\D'), '');
}

/// Экран входа в систему
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;
  String? _error;
  String? _errorType;
  bool _showDemo = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login({String? demoPhone, String? demoPassword}) async {
    final phone = demoPhone ?? _cleanPhone(_phoneController.text);
    final password = demoPassword ?? _passwordController.text;

    if (phone.isEmpty || password.isEmpty) {
      setState(() {
        _error = 'Введите номер телефона и пароль';
        _errorType = null;
      });
      return;
    }

    if (demoPhone == null && phone.length < 11) {
      setState(() {
        _error = 'Введите полный номер телефона';
        _errorType = null;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
      _errorType = null;
    });

    try {
      final auth = context.read<AuthProvider>();
      final success = await auth.login(phone, password);

      if (mounted && !success && auth.error != null) {
        setState(() {
          _error = auth.error;
          _errorType = null;
        });
      }
    } on ApiException catch (e) {
      if (mounted) {
        setState(() {
          _error = e.message;
          _errorType = e.errorType;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = 'Ошибка подключения к серверу';
          _errorType = null;
        });
      }
    }

    if (mounted) setState(() => _isLoading = false);
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
            // Фоновые декоративные круги (как в веб-версии)
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

            // Переключатель темы (правый верхний угол)
            Positioned(
              top: MediaQuery.of(context).padding.top + 16,
              right: 20,
              child: GestureDetector(
                onTap: () => context.read<ThemeProvider>().toggleTheme(),
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.06)
                        : Colors.white.withValues(alpha: 0.6),
                    boxShadow: isDark
                        ? null
                        : [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.05),
                              blurRadius: 8,
                            ),
                          ],
                  ),
                  child: Icon(
                    isDark ? LucideIcons.sun : LucideIcons.moon,
                    size: 18,
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.7)
                        : Colors.black.withValues(alpha: 0.5),
                  ),
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
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Логотип
                        _buildLogo(isDark),

                        const SizedBox(height: 20),

                        // Название приложения
                        _buildTitle(isDark),

                        const SizedBox(height: 32),

                        // Карточка входа
                        _buildLoginCard(isDark),

                        const SizedBox(height: 12),

                        // Кнопка регистрации
                        _buildRegisterButton(isDark),

                        const SizedBox(height: 20),

                        // Демо-доступ
                        _buildDemoSection(isDark),

                        const SizedBox(height: 20),

                        // Теги видов спорта
                        _buildSportTags(isDark),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLogo(bool isDark) {
    return Column(
      children: [
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            boxShadow: [
              BoxShadow(
                color: isDark
                    ? const Color(0xFF7C3AED).withValues(alpha: 0.3)
                    : const Color(0xFFC084FC).withValues(alpha: 0.2),
                blurRadius: 40,
                spreadRadius: 8,
              ),
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.3),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: Image.asset(
              'assets/logo.png',
              width: 88,
              height: 88,
              fit: BoxFit.cover,
            ),
          ),
        )
            .animate()
            .fadeIn(duration: 600.ms)
            .scale(begin: const Offset(0.8, 0.8)),
      ],
    );
  }

  Widget _buildTitle(bool isDark) {
    return Column(
      children: [
        RichText(
          text: TextSpan(
            children: [
              TextSpan(
                text: 'i',
                style: TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.6)
                      : Colors.grey[500],
                ),
              ),
              TextSpan(
                text: 'Borcuha',
                style: TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                  foreground: Paint()
                    ..shader = const LinearGradient(
                      colors: [
                        Color(0xFFC084FC),
                        Color(0xFF8B5CF6),
                        Color(0xFF6366F1),
                      ],
                    ).createShader(const Rect.fromLTWH(0, 0, 200, 40)),
                ),
              ),
            ],
          ),
        ).animate().fadeIn(delay: 200.ms, duration: 600.ms).slideY(begin: 0.3),
        const SizedBox(height: 4),
        Text(
          'ПЛАТФОРМА ДЛЯ ЕДИНОБОРСТВ',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            letterSpacing: 2.0,
            color: isDark
                ? Colors.white.withValues(alpha: 0.2)
                : Colors.grey[500],
          ),
        ).animate().fadeIn(delay: 400.ms, duration: 600.ms),
      ],
    );
  }

  Widget _buildLoginCard(bool isDark) {
    return Container(
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
          // Телефон
          _buildInputField(
            controller: _phoneController,
            hint: '8 (900) 123-45-67',
            icon: LucideIcons.phone,
            isDark: isDark,
            keyboardType: TextInputType.phone,
            onChanged: _onPhoneChanged,
            maxLength: 18,
          ),

          const SizedBox(height: 12),

          // Пароль
          _buildInputField(
            controller: _passwordController,
            hint: 'Пароль',
            icon: LucideIcons.lock,
            isDark: isDark,
            obscureText: _obscurePassword,
            onSubmitted: (_) => _login(),
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

          // Ошибки
          if (_error != null) ...[
            const SizedBox(height: 12),
            _buildErrorWidget(isDark),
          ],

          const SizedBox(height: 16),

          // Кнопка входа (градиент как в веб-версии)
          _buildLoginButton(),
        ],
      ),
    ).animate().fadeIn(delay: 600.ms, duration: 600.ms).slideY(begin: 0.2);
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    required bool isDark,
    TextInputType? keyboardType,
    bool obscureText = false,
    ValueChanged<String>? onChanged,
    ValueChanged<String>? onSubmitted,
    Widget? suffixIcon,
    int? maxLength,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      onChanged: onChanged,
      onSubmitted: onSubmitted,
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
            ? Padding(
                padding: const EdgeInsets.only(right: 12),
                child: suffixIcon,
              )
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

  Widget _buildErrorWidget(bool isDark) {
    if (_errorType == 'student') {
      return Column(
        children: [
          Text(
            _error!,
            style: const TextStyle(
              color: LiquidGlassColors.danger,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            'Обратитесь к тренеру за паролем',
            style: TextStyle(
              fontSize: 12,
              color: isDark
                  ? Colors.white.withValues(alpha: 0.4)
                  : Colors.grey[500],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      );
    }

    if (_errorType == 'trainer') {
      return Column(
        children: [
          Text(
            _error!,
            style: const TextStyle(
              color: LiquidGlassColors.danger,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            'Свяжитесь с администратором:',
            style: TextStyle(
              fontSize: 12,
              color: isDark
                  ? Colors.white.withValues(alpha: 0.4)
                  : Colors.grey[500],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: () {
              // Можно добавить url_launcher позже
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFF16A34A),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(LucideIcons.messageCircle, size: 16, color: Colors.white),
                  SizedBox(width: 8),
                  Text(
                    '8-988-444-44-36',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      );
    }

    return Text(
      _error!,
      style: const TextStyle(
        color: LiquidGlassColors.danger,
        fontSize: 14,
        fontWeight: FontWeight.w500,
      ),
      textAlign: TextAlign.center,
    );
  }

  Widget _buildLoginButton() {
    return GestureDetector(
      onTap: _isLoading ? null : () => _login(),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          gradient: const LinearGradient(
            colors: [
              Color(0xFF9333EA),
              Color(0xFF7C3AED),
              Color(0xFF4F46E5),
            ],
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
                    Icon(LucideIcons.logIn, size: 18, color: Colors.white),
                    SizedBox(width: 8),
                    Text(
                      'Войти',
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
    );
  }

  Widget _buildRegisterButton(bool isDark) {
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => const RegisterScreen(),
          ),
        );
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: isDark
              ? Colors.white.withValues(alpha: 0.04)
              : Colors.white.withValues(alpha: 0.6),
          border: Border.all(
            color: isDark
                ? Colors.white.withValues(alpha: 0.06)
                : Colors.black.withValues(alpha: 0.04),
          ),
          boxShadow: isDark
              ? null
              : [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 8,
                  ),
                ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              LucideIcons.userPlus,
              size: 15,
              color: isDark
                  ? Colors.white.withValues(alpha: 0.6)
                  : Colors.grey[500],
            ),
            const SizedBox(width: 8),
            Text(
              'Я тренер — хочу зарегистрироваться',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: isDark
                    ? Colors.white.withValues(alpha: 0.6)
                    : Colors.grey[500],
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(delay: 800.ms, duration: 600.ms);
  }

  Widget _buildDemoSection(bool isDark) {
    return Column(
      children: [
        GestureDetector(
          onTap: () => setState(() => _showDemo = !_showDemo),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'ДЕМО-ДОСТУП',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 2.0,
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.2)
                      : Colors.grey[500],
                ),
              ),
              const SizedBox(width: 4),
              Icon(
                _showDemo ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                size: 14,
                color: isDark
                    ? Colors.white.withValues(alpha: 0.2)
                    : Colors.grey[500],
              ),
            ],
          ),
        ),
        if (_showDemo)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Row(
              children: [
                Expanded(
                  child: _buildDemoButton(
                    emoji: '🥋',
                    label: 'Тренер',
                    phone: '89999999999',
                    password: 'demo123',
                    isDark: isDark,
                    color: const Color(0xFF3B82F6),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildDemoButton(
                    emoji: '🤼',
                    label: 'Спортсмен',
                    phone: '89990000001',
                    password: 'demo123',
                    isDark: isDark,
                    color: const Color(0xFF22C55E),
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(duration: 300.ms),
      ],
    );
  }

  Widget _buildDemoButton({
    required String emoji,
    required String label,
    required String phone,
    required String password,
    required bool isDark,
    required Color color,
  }) {
    return GestureDetector(
      onTap: _isLoading ? null : () => _login(demoPhone: phone, demoPassword: password),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          color: color.withValues(alpha: isDark ? 0.1 : 0.05),
          border: Border.all(
            color: color.withValues(alpha: isDark ? 0.15 : 0.15),
          ),
        ),
        child: Column(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 18)),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSportTags(bool isDark) {
    const sports = ['BJJ', 'MMA', 'Самбо', 'Дзюдо', 'Грэпплинг'];
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      alignment: WrapAlignment.center,
      children: sports
          .map(
            (s) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: isDark
                    ? Colors.white.withValues(alpha: 0.04)
                    : Colors.black.withValues(alpha: 0.04),
              ),
              child: Text(
                s,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.2)
                      : Colors.grey[500],
                ),
              ),
            ),
          )
          .toList(),
    ).animate().fadeIn(delay: 1000.ms, duration: 600.ms);
  }
}
