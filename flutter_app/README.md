# iBorcuha Flutter App

## Описание

Flutter-приложение для платформы **iBorcuha** — SaaS для тренеров единоборств.
Использует **общий бэкенд** с веб-версией (Express.js + PostgreSQL).

## Архитектура

```
flutter_app/
├── lib/
│   ├── main.dart                 # Точка входа
│   ├── models/                   # Модели данных (строгая типизация)
│   │   ├── user.dart             # Пользователь (тренер/админ)
│   │   ├── student.dart          # Ученик
│   │   ├── group.dart            # Тренировочная группа
│   │   ├── transaction.dart      # Финансовая транзакция
│   │   ├── tournament.dart       # Внешний турнир
│   │   ├── internal_tournament.dart  # Внутренний турнир (сетка)
│   │   ├── news.dart             # Новость/объявление
│   │   ├── material.dart         # Учебный материал (видео)
│   │   ├── attendance.dart       # Посещаемость
│   │   ├── club.dart             # Клуб
│   │   ├── author_info.dart      # Информация об авторе
│   │   ├── pending_registration.dart  # Заявка на регистрацию
│   │   └── app_data.dart         # Совокупная модель данных
│   ├── services/                 # Сервисы
│   │   ├── api_service.dart      # HTTP клиент для API
│   │   └── auth_service.dart     # Безопасное хранение авторизации
│   ├── providers/                # Провайдеры состояния (Provider)
│   │   ├── auth_provider.dart    # Аутентификация
│   │   ├── data_provider.dart    # Данные приложения
│   │   └── theme_provider.dart   # Тёмная/светлая тема
│   ├── screens/                  # Экраны приложения
│   │   ├── login_screen.dart     # Вход
│   │   ├── register_screen.dart  # Регистрация тренера
│   │   ├── main_shell.dart       # Оболочка с навигацией
│   │   ├── dashboard_screen.dart # Главная (статистика, новости)
│   │   ├── cash_screen.dart      # Касса (финансы)
│   │   ├── team_screen.dart      # Команда (ученики)
│   │   ├── tournaments_screen.dart    # Турниры
│   │   ├── profile_screen.dart   # Профиль
│   │   ├── student_detail_screen.dart # Детали ученика
│   │   ├── add_student_screen.dart    # Добавление ученика
│   │   ├── groups_screen.dart    # Группы
│   │   └── materials_screen.dart # Материалы (видеотека)
│   ├── widgets/                  # Переиспользуемые виджеты
│   │   ├── glass_card.dart       # Карточка Liquid Glass
│   │   ├── glass_bottom_nav.dart # Нижняя навигация
│   │   ├── glass_button.dart     # Кнопка Liquid Glass
│   │   ├── glass_modal.dart      # Модальное окно
│   │   ├── avatar_widget.dart    # Аватар пользователя
│   │   └── page_header.dart      # Заголовок страницы
│   ├── theme/
│   │   └── app_theme.dart        # Тема Liquid Glass (iOS стиль)
│   └── utils/                    # Утилиты
│       ├── config.dart           # Конфигурация (URL API)
│       ├── sports.dart           # Справочник видов спорта
│       └── date_utils.dart       # Работа с датами (RU)
├── test/                         # Тесты
│   ├── models/                   # Тесты моделей
│   ├── services/                 # Тесты сервисов
│   └── utils/                    # Тесты утилит
└── pubspec.yaml                  # Зависимости
```

## Дизайн — Liquid Glass

Дизайн приложения полностью повторяет веб-версию:
- **Стеклянные карточки** (GlassCard) с `BackdropFilter` и размытием
- **Полупрозрачные поверхности** как в Apple iOS
- **Тонкие границы** с мягкими тенями
- **Плавные анимации** через `flutter_animate`
- **Тёмная и светлая тема** с переключением
- **Градиентный фон** с мягкими переходами

## Общий бэкенд

Приложение использует тот же самый бэкенд, что и веб-версия:
- **Сервер**: Express.js (`/server/`)
- **База данных**: PostgreSQL
- **Аутентификация**: JWT токены
- **API**: REST (`/api/auth`, `/api/data`, `/api/upload`, `/api/push`)

### Настройка URL бэкенда

В файле `lib/utils/config.dart`:
```dart
static const String apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:3000', // Android эмулятор
);
```

Для запуска с другим URL:
```bash
flutter run --dart-define=API_BASE_URL=https://your-domain.com
```

## Роли пользователей

| Роль | Доступ |
|------|--------|
| **Суперадмин** | Всё: тренеры, турниры, клубы, заявки |
| **Тренер** | Ученики, группы, касса, материалы, внутренние турниры |
| **Ученик** | Просмотр: дашборд, команда, турниры, профиль |

## Функциональность

- Авторизация (тренер / ученик / суперадмин)
- Регистрация нового тренера (с одобрением)
- Дашборд со статистикой
- Управление учениками (CRUD)
- Тренировочные группы
- Финансовый учёт (доходы/расходы)
- Внешние и внутренние турниры
- Учебные видеоматериалы
- Посещаемость
- Клубы (суперадмин)
- Тёмная/светлая тема
- Pull-to-refresh для обновления данных

## Запуск

```bash
# Установка зависимостей
flutter pub get

# Запуск на эмуляторе
flutter run

# Запуск с указанием URL бэкенда
flutter run --dart-define=API_BASE_URL=http://192.168.1.100:3000

# Запуск тестов
flutter test

# Сборка APK
flutter build apk --release
```

## Тесты

Тесты находятся в директории `test/`:
- `test/models/` — тесты моделей данных (парсинг JSON, конвертация, логика)
- `test/services/` — тесты API сервиса
- `test/utils/` — тесты утилит

Запуск:
```bash
flutter test
```

## Строгая типизация

Проект использует строгий анализ Dart:
- `strict-casts: true` — запрет неявных приведений
- `strict-inference: true` — обязательный вывод типов
- `strict-raw-types: true` — запрет raw types
- `avoid_dynamic_calls: true` — запрет вызовов на dynamic

## Технологический стек

- **Flutter** 3.2+ / Dart 3.2+
- **Provider** — управление состоянием
- **http** — HTTP клиент
- **flutter_secure_storage** — безопасное хранение токенов
- **flutter_animate** — анимации
- **lucide_icons** — иконки (как в веб-версии)
- **cached_network_image** — кэширование изображений
- **intl** — локализация и форматирование дат
