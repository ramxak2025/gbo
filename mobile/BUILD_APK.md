# Сборка APK для Android

## Вариант 1: EAS Build (рекомендуется, без Android Studio)

```bash
cd mobile
npm install
npx eas-cli login         # войти в Expo аккаунт (бесплатный)
npx eas-cli build --platform android --profile preview
```
APK будет собран в облаке и скачан по ссылке.

## Вариант 2: Локальная сборка (нужна Android Studio)

### Требования:
- Node.js 18+
- JDK 17
- Android Studio с Android SDK 35
- Android SDK Build Tools

### Шаги:

```bash
cd mobile
npm install

# Сгенерировать нативный проект
npx expo prebuild --platform android --clean

# Собрать APK
cd android
./gradlew assembleRelease
```

APK будет в: `android/app/build/outputs/apk/release/app-release.apk`

## Настройка API сервера

Перед сборкой укажите адрес вашего бэкенда в файле:
`src/utils/api.js` — строка 4:

```js
const BASE_URL = 'https://ваш-домен.ru';
```

## Структура проекта

```
mobile/
├── App.js                    # Точка входа
├── src/
│   ├── context/              # Auth, Data, Theme (как в вебе)
│   ├── utils/                # API клиент, спорт-утилиты
│   ├── components/           # Avatar, GlassCard, Modal, PageHeader
│   ├── screens/              # Все экраны
│   │   ├── LoginScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── CashScreen.js
│   │   ├── TeamScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── TournamentsScreen.js
│   │   ├── MaterialsScreen.js
│   │   ├── StudentDetailScreen.js
│   │   ├── GroupsScreen.js
│   │   ├── AddStudentScreen.js
│   │   ├── TournamentDetailScreen.js
│   │   └── NotificationSettingsScreen.js
│   └── navigation/
│       └── AppNavigator.js   # React Navigation с ролевыми табами
├── app.json                  # Конфиг Expo
└── eas.json                  # Конфиг EAS Build
```
