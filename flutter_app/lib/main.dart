/// Точка входа Flutter-приложения iBorcuha
///
/// Инициализирует провайдеры, тему, API-сервис
/// и запускает основной виджет приложения.
/// Общий бэкенд с веб-версией (Express + PostgreSQL).
library;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'providers/data_provider.dart';
import 'providers/theme_provider.dart';
import 'services/api_service.dart';
import 'services/auth_service.dart';
import 'theme/app_theme.dart';
import 'screens/login_screen.dart';
import 'screens/main_shell.dart';
import 'utils/config.dart';
import 'utils/date_utils.dart' as date_utils;

/// Точка входа приложения
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Инициализация русской локали для дат
  await date_utils.initDateFormatting();

  // Настройка ориентации
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Создание сервисов
  final apiService = ApiService(baseUrl: AppConfig.apiBaseUrl);
  final authService = AuthService();

  // Инициализация темы
  final themeProvider = ThemeProvider();
  await themeProvider.init();

  runApp(
    IBorcuhaApp(
      apiService: apiService,
      authService: authService,
      themeProvider: themeProvider,
    ),
  );
}

/// Главный виджет приложения
class IBorcuhaApp extends StatelessWidget {
  final ApiService apiService;
  final AuthService authService;
  final ThemeProvider themeProvider;

  const IBorcuhaApp({
    super.key,
    required this.apiService,
    required this.authService,
    required this.themeProvider,
  });

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // API сервис (доступен через Provider)
        Provider<ApiService>.value(value: apiService),

        // Тема
        ChangeNotifierProvider<ThemeProvider>.value(value: themeProvider),

        // Аутентификация
        ChangeNotifierProvider<AuthProvider>(
          create: (_) => AuthProvider(
            api: apiService,
            authService: authService,
          ),
        ),

        // Данные приложения
        ChangeNotifierProvider<DataProvider>(
          create: (_) => DataProvider(api: apiService),
        ),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, theme, _) {
          // Настройка системного UI
          SystemChrome.setSystemUIOverlayStyle(
            theme.isDark
                ? SystemUiOverlayStyle.light
                : SystemUiOverlayStyle.dark,
          );

          return MaterialApp(
            title: AppConfig.appName,
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light(),
            darkTheme: AppTheme.dark(),
            themeMode: theme.isDark ? ThemeMode.dark : ThemeMode.light,
            home: Consumer<AuthProvider>(
              builder: (context, auth, _) {
                // Экран загрузки
                if (auth.isLoading) {
                  return _SplashScreen(isDark: theme.isDark);
                }

                // Авторизация или главный экран
                if (!auth.isAuthenticated) {
                  return const LoginScreen();
                }

                return const MainShell();
              },
            ),
          );
        },
      ),
    );
  }
}

/// Экран загрузки (splash) при запуске
class _SplashScreen extends StatelessWidget {
  final bool isDark;

  const _SplashScreen({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LiquidGlassColors.backgroundGradient(isDark: isDark),
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
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
                    width: 80,
                    height: 80,
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(
                  LiquidGlassColors.primary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
