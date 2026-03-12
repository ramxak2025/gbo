import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../theme/app_theme.dart';
import '../utils/sports.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _isRegister = false;
  bool _loading = false;
  String? _error;

  // Login
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();

  // Register
  final _regNameController = TextEditingController();
  final _regPhoneController = TextEditingController();
  final _regPasswordController = TextEditingController();
  final _regClubController = TextEditingController();
  final _regCityController = TextEditingController();
  String _regSportType = 'bjj';
  bool _consent = false;

  Future<void> _login() async {
    final phone = _phoneController.text.trim();
    final password = _passwordController.text.trim();
    if (phone.isEmpty || password.isEmpty) return;

    setState(() { _loading = true; _error = null; });
    try {
      await context.read<AuthProvider>().login(phone, password);
    } catch (e) {
      setState(() { _error = e.toString(); });
    }
    setState(() { _loading = false; });
  }

  Future<void> _demoLogin(String phone, String password) async {
    setState(() { _loading = true; _error = null; });
    try {
      await context.read<AuthProvider>().login(phone, password);
    } catch (e) {
      setState(() { _error = e.toString(); });
    }
    setState(() { _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<ThemeProvider>().theme;
    final isDark = context.watch<ThemeProvider>().isDark;
    final tp = context.read<ThemeProvider>();

    return Scaffold(
      backgroundColor: t.bg,
      body: Stack(
        children: [
          // Background gradient blobs
          Positioned(
            top: -100,
            left: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.purple.withOpacity(0.15),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            bottom: -50,
            right: -80,
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.red.withOpacity(0.1),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                children: [
                  const SizedBox(height: 20),

                  // Theme toggle
                  Align(
                    alignment: Alignment.topRight,
                    child: IconButton(
                      onPressed: () => tp.toggle(),
                      icon: Icon(
                        isDark ? Icons.wb_sunny_outlined : Icons.nightlight_round,
                        color: t.textMuted,
                      ),
                    ),
                  ),

                  const SizedBox(height: 40),

                  // Logo
                  ShaderMask(
                    shaderCallback: (bounds) => const LinearGradient(
                      colors: [AppColors.purple, Color(0xFF7C3AED), Color(0xFF6366F1)],
                    ).createShader(bounds),
                    child: const Text(
                      'iBorcuha',
                      style: TextStyle(
                        fontSize: 36,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Управление спортивной командой',
                    style: TextStyle(
                      fontSize: 13,
                      color: t.textMuted,
                      fontWeight: FontWeight.w500,
                    ),
                  ),

                  const SizedBox(height: 40),

                  // Error
                  if (_error != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.red.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.red.withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline, color: AppColors.red, size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _error!,
                              style: const TextStyle(color: AppColors.red, fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    ),

                  if (!_isRegister) ..._buildLoginForm(t, isDark),
                  if (_isRegister) ..._buildRegisterForm(t, isDark),

                  const SizedBox(height: 24),

                  // Toggle register/login
                  TextButton(
                    onPressed: () => setState(() { _isRegister = !_isRegister; _error = null; }),
                    child: Text(
                      _isRegister ? 'Уже есть аккаунт? Войти' : 'Регистрация для тренеров',
                      style: TextStyle(color: t.accent, fontWeight: FontWeight.w600),
                    ),
                  ),

                  // Demo access
                  if (!_isRegister) ...[
                    const SizedBox(height: 16),
                    Text(
                      'Быстрый доступ',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1,
                        color: t.textMuted,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: _DemoButton(
                            label: 'Демо тренер',
                            icon: Icons.sports_martial_arts,
                            color: AppColors.blue,
                            isDark: isDark,
                            t: t,
                            onTap: () => _demoLogin('+7 000 000 0001', 'demo123'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _DemoButton(
                            label: 'Демо ученик',
                            icon: Icons.person,
                            color: AppColors.green,
                            isDark: isDark,
                            t: t,
                            onTap: () => _demoLogin('+7 000 000 0002', 'demo123'),
                          ),
                        ),
                      ],
                    ),
                  ],

                  const SizedBox(height: 60),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildLoginForm(AppTheme t, bool isDark) {
    return [
      _GlassInput(
        controller: _phoneController,
        hint: 'Телефон',
        icon: Icons.phone_outlined,
        keyboardType: TextInputType.phone,
        t: t,
        isDark: isDark,
      ),
      const SizedBox(height: 12),
      _GlassInput(
        controller: _passwordController,
        hint: 'Пароль',
        icon: Icons.lock_outline,
        obscure: true,
        t: t,
        isDark: isDark,
      ),
      const SizedBox(height: 20),
      _AccentButton(
        label: 'Войти',
        loading: _loading,
        onTap: _login,
      ),
    ];
  }

  List<Widget> _buildRegisterForm(AppTheme t, bool isDark) {
    return [
      _GlassInput(controller: _regNameController, hint: 'Имя', icon: Icons.person_outline, t: t, isDark: isDark),
      const SizedBox(height: 12),
      _GlassInput(controller: _regPhoneController, hint: 'Телефон', icon: Icons.phone_outlined, keyboardType: TextInputType.phone, t: t, isDark: isDark),
      const SizedBox(height: 12),
      _GlassInput(controller: _regPasswordController, hint: 'Пароль', icon: Icons.lock_outline, obscure: true, t: t, isDark: isDark),
      const SizedBox(height: 12),
      _GlassInput(controller: _regClubController, hint: 'Название клуба', icon: Icons.business_outlined, t: t, isDark: isDark),
      const SizedBox(height: 12),
      _GlassInput(controller: _regCityController, hint: 'Город', icon: Icons.location_on_outlined, t: t, isDark: isDark),
      const SizedBox(height: 12),

      // Sport type selector
      Container(
        decoration: BoxDecoration(
          color: t.input,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: t.inputBorder),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: DropdownButtonHideUnderline(
          child: DropdownButton<String>(
            value: _regSportType,
            isExpanded: true,
            dropdownColor: isDark ? const Color(0xFF1A1A2E) : Colors.white,
            style: TextStyle(color: t.text, fontSize: 14),
            items: sportTypes.entries.map((e) => DropdownMenuItem(
              value: e.key,
              child: Text(e.value),
            )).toList(),
            onChanged: (v) => setState(() => _regSportType = v!),
          ),
        ),
      ),
      const SizedBox(height: 16),

      // Consent
      GestureDetector(
        onTap: () => setState(() => _consent = !_consent),
        child: Row(
          children: [
            Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(6),
                color: _consent ? t.accent : t.input,
                border: Border.all(color: _consent ? t.accent : t.inputBorder),
              ),
              child: _consent ? const Icon(Icons.check, size: 14, color: Colors.white) : null,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'Согласен на обработку данных',
                style: TextStyle(fontSize: 13, color: t.textSecondary),
              ),
            ),
          ],
        ),
      ),
      const SizedBox(height: 20),
      _AccentButton(
        label: 'Зарегистрироваться',
        loading: _loading,
        onTap: _consent ? () {} : null, // TODO: implement register
      ),
    ];
  }
}

class _GlassInput extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final bool obscure;
  final TextInputType? keyboardType;
  final AppTheme t;
  final bool isDark;

  const _GlassInput({
    required this.controller,
    required this.hint,
    required this.icon,
    this.obscure = false,
    this.keyboardType,
    required this.t,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: t.input,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: t.inputBorder),
      ),
      child: TextField(
        controller: controller,
        obscureText: obscure,
        keyboardType: keyboardType,
        style: TextStyle(color: t.text, fontSize: 15),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: t.textMuted),
          prefixIcon: Icon(icon, size: 20, color: t.textMuted),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
      ),
    );
  }
}

class _AccentButton extends StatelessWidget {
  final String label;
  final bool loading;
  final VoidCallback? onTap;

  const _AccentButton({required this.label, this.loading = false, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: loading ? null : onTap,
      child: Container(
        width: double.infinity,
        height: 52,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            colors: onTap == null
                ? [Colors.grey.withOpacity(0.3), Colors.grey.withOpacity(0.2)]
                : [AppColors.accent, AppColors.rose],
          ),
          boxShadow: onTap != null
              ? [BoxShadow(color: AppColors.accent.withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 8))]
              : null,
        ),
        child: Center(
          child: loading
              ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
        ),
      ),
    );
  }
}

class _DemoButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final bool isDark;
  final AppTheme t;
  final VoidCallback onTap;

  const _DemoButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.isDark,
    required this.t,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          color: color.withOpacity(isDark ? 0.1 : 0.08),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}
