# Mobile Migration Plan — iBorcuha PWA → React Native

## Общие сведения

- **PWA stack**: React 19 + Tailwind CSS + react-router-dom + Vite
- **Mobile stack**: Expo SDK 54 + React Native 0.81 + React Navigation 7 + Zustand + React Query + TypeScript
- **Backend**: iborcuha.ru (REST API, JWT auth)
- **Текущее состояние mobile/**: содержит настроенные config-файлы (app.json, eas.json, package.json, tsconfig.json) и устаревший App.js

---

## Phase 1 — Cleanup

### 1.1. Архивация android-native/
```
mv android-native/ android-native-archive/
```
Директория содержит нативный Android WebView проект (Kotlin + Gradle). Не нужна для Expo-миграции, сохранить как reference.

### 1.2. Reset mobile/src/
- Удалить всё содержимое `mobile/src/` (устаревшие экраны)
- Удалить `mobile/App.js` (будет пересоздан как App.tsx)
- Сохранить:
  - `mobile/app.json` — Expo config (slug: gbo, version 1.2.0, scheme: iborcuha)
  - `mobile/eas.json` — EAS Build profiles (preview=APK, production=AAB)
  - `mobile/package.json` — зависимости уже настроены
  - `mobile/tsconfig.json`
  - `mobile/babel.config.js`
  - `mobile/assets/` — иконки и splash

### 1.3. Структура каталогов mobile/
```
mobile/
├── app.json
├── eas.json
├── package.json
├── tsconfig.json
├── babel.config.js
├── index.js
├── App.tsx                       # Entry point
├── assets/
├── src/
│   ├── api/
│   │   ├── client.ts             # Портирован из src/utils/api.js
│   │   └── types.ts              # Zod-схемы для всех API responses
│   ├── auth/
│   │   ├── AuthContext.tsx        # Портирован из src/context/AuthContext.jsx
│   │   └── useAuth.ts
│   ├── data/
│   │   ├── DataContext.tsx        # Портирован из src/context/DataContext.jsx
│   │   ├── useData.ts
│   │   └── queries.ts            # React Query hooks
│   ├── theme/
│   │   ├── ThemeContext.tsx
│   │   ├── colors.ts             # Из docs/design-system.md
│   │   └── spacing.ts
│   ├── components/
│   │   ├── GlassCard.tsx
│   │   ├── BottomNav.tsx
│   │   ├── Modal.tsx             # Bottom sheet (react-native-reanimated)
│   │   ├── PageHeader.tsx
│   │   ├── Avatar.tsx
│   │   ├── PhoneInput.tsx
│   │   ├── DateButton.tsx
│   │   ├── BracketView.tsx
│   │   └── StatusBadge.tsx
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── TeamScreen.tsx
│   │   ├── StudentDetailScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── CashScreen.tsx
│   │   ├── GroupsScreen.tsx
│   │   ├── AttendanceScreen.tsx
│   │   ├── TournamentsScreen.tsx
│   │   ├── TournamentDetailScreen.tsx
│   │   ├── MaterialsScreen.tsx
│   │   ├── NotificationSettingsScreen.tsx
│   │   ├── AddStudentScreen.tsx
│   │   ├── AddTrainerScreen.tsx
│   │   ├── AddTournamentScreen.tsx
│   │   ├── TrainerDetailScreen.tsx
│   │   ├── ClubsScreen.tsx
│   │   ├── ClubDetailScreen.tsx
│   │   ├── CreateInternalTournamentScreen.tsx
│   │   ├── InternalTournamentDetailScreen.tsx
│   │   └── AuthorScreen.tsx
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── TabNavigator.tsx
│   │   └── linking.ts
│   └── utils/
│       ├── sports.ts             # Портирован из src/utils/sports.js
│       ├── storage.ts            # expo-secure-store для token
│       └── format.ts             # Форматирование дат, телефонов
```

---

## Phase 2 — Keep from mobile/ (API & Context)

### 2.1. API Client (из src/utils/api.js)
- Портировать все 40+ endpoint-функций
- Заменить `fetch` на обёртку с expo-secure-store для JWT
- Заменить `localStorage` на `SecureStore`
- Заменить `FormData` upload на expo-file-system `uploadAsync`
- Типизировать все request/response через Zod
- Добавить retry-логику и offline queue

### 2.2. Auth Context (из src/context/AuthContext.jsx)
- Портировать login/logout/me flow
- Заменить localStorage на SecureStore
- Token refresh: добавить interceptor в API client
- Авто-redirect на Login при 401

### 2.3. Data Context (из src/context/DataContext.jsx)
- Портировать DataBundle (users, groups, students, transactions, tournaments, news, tournamentRegistrations, authorInfo, internalTournaments, attendance, pendingRegistrations, materials, clubs)
- Обернуть в React Query для кэширования + invalidation
- Все мутации (addStudent, updateStudent, deleteStudent и т.д.) — через useMutation

### 2.4. Config файлы — оставить как есть
- `app.json` — version 1.2.0, scheme iborcuha, plugins настроены
- `eas.json` — preview (APK), production (AAB)
- `package.json` — все нужные зависимости уже добавлены

---

## Phase 3 — Design System (React Native)

Полная спецификация — см. `docs/design-system.md`.

### Компоненты для портирования:

| PWA Component | RN Component | Особенности |
|---|---|---|
| `GlassCard` | `GlassCard.tsx` | `expo-blur` BlurView, borderRadius 20 |
| `BottomNav` | `TabNavigator.tsx` | `@react-navigation/bottom-tabs`, кастомный tabBar |
| `Modal` | `Modal.tsx` | Bottom sheet на reanimated, gesture handler drag-to-close |
| `PageHeader` | `PageHeader.tsx` | sticky top, blur on scroll, safe area |
| `Avatar` | `Avatar.tsx` | `expo-image` для кэша, initials fallback |
| `PhoneInput` | `PhoneInput.tsx` | Маска `8 (XXX) XXX-XX-XX`, keyboardType="phone-pad" |
| `DateButton` | `DateButton.tsx` | `@react-native-community/datetimepicker` |
| `BracketView` | `BracketView.tsx` | Horizontal ScrollView, `react-native-svg` для линий |

### Новые RN-специфичные компоненты:
- `PressableScale` — замена CSS `press-scale`, `Animated.View` с scale transform
- `Skeleton` — placeholder для загрузки
- `Toast` — нативный feedback вместо alert()

---

## Phase 4 — Экраны (порядок реализации)

### P0 — Must Have (ядро приложения)
| # | Экран | Компонент | Roles |
|---|---|---|---|
| 1 | Login | `LoginScreen` | all |
| 2 | Dashboard | `DashboardScreen` | trainer, student, superadmin (3 варианта) |
| 3 | Team | `TeamScreen` | trainer, student, superadmin (3 варианта) |
| 4 | Student Detail | `StudentDetailScreen` | trainer, superadmin |
| 5 | Profile | `ProfileScreen` | all |

### P1 — Important (финансы, группы, турниры)
| # | Экран | Компонент | Roles |
|---|---|---|---|
| 6 | Cash | `CashScreen` | trainer |
| 7 | Groups | `GroupsScreen` | trainer |
| 8 | Attendance | `AttendanceScreen` | trainer |
| 9 | Tournaments | `TournamentsScreen` | all |
| 10 | Tournament Detail | `TournamentDetailScreen` | all |
| 11 | Materials | `MaterialsScreen` | trainer, student |
| 12 | Notification Settings | `NotificationSettingsScreen` | all |

### P2 — Nice to Have (admin, клубы, внутренние турниры)
| # | Экран | Компонент | Roles |
|---|---|---|---|
| 13 | Add Student | `AddStudentScreen` | trainer |
| 14 | Add Trainer | `AddTrainerScreen` | superadmin |
| 15 | Add Tournament | `AddTournamentScreen` | superadmin |
| 16 | Trainer Detail | `TrainerDetailScreen` | superadmin |
| 17 | Clubs | `ClubsScreen` | superadmin |
| 18 | Club Detail | `ClubDetailScreen` | superadmin, head trainer |
| 19 | Create Internal Tournament | `CreateInternalTournamentScreen` | trainer |
| 20 | Internal Tournament Detail | `InternalTournamentDetailScreen` | trainer, student |
| 21 | Author | `AuthorScreen` | all |

---

## Phase 5 — Testing & Release

### 5.1. TypeScript
- Strict mode: `tsconfig.json` → `strict: true`
- Zod-валидация API responses (`src/api/types.ts`)
- Типизация navigation params: `RootStackParamList`, `TabParamList`

### 5.2. EAS Build
- Preview: `eas build --profile preview --platform android` → APK для тестирования
- Production: `eas build --profile production --platform android` → AAB для Google Play
- iOS: `eas build --profile production --platform ios` → IPA для App Store

### 5.3. Manual Testing Checklist
- См. `docs/testing-checklist.md`
- Тестировать на Android 7+ (minSdk 24) и iOS 15+
- Проверить все 3 роли: superadmin, trainer, student
- Проверить offline-поведение
- Проверить deep linking (scheme: iborcuha://)

### 5.4. OTA Updates
- Настроен `expo-updates` в app.json
- Каналы: preview, production
- `eas update --channel production` для быстрых фиксов

---

## Таймлайн (ориентировочный)

| Phase | Срок | Результат |
|---|---|---|
| Phase 1 — Cleanup | 1 день | Чистый mobile/ каталог |
| Phase 2 — API & Context | 3 дня | Рабочий API client + auth + data |
| Phase 3 — Design System | 3 дня | Все UI-компоненты |
| Phase 4a — P0 экраны | 5 дней | Login → Dashboard → Team → StudentDetail → Profile |
| Phase 4b — P1 экраны | 5 дней | Cash → Groups → Attendance → Tournaments → Materials → Notifications |
| Phase 4c — P2 экраны | 4 дня | Остальные экраны |
| Phase 5 — Testing | 3 дня | APK → ручное тестирование → фикс багов |
| **Итого** | **~24 дня** | |

---

## Ключевые решения

1. **State management**: Zustand (уже в dependencies) для глобального состояния, React Query для серверного кэша
2. **Navigation**: React Navigation 7 (native-stack + bottom-tabs), уже в dependencies
3. **Стилизация**: StyleSheet.create + design tokens из design-system.md (без Tailwind)
4. **Анимации**: react-native-reanimated 4.x (уже в dependencies)
5. **Списки**: @shopify/flash-list (уже в dependencies) для команды, транзакций
6. **Изображения**: expo-image (кэширование, placeholder)
7. **Безопасность**: expo-secure-store для JWT, не AsyncStorage
8. **Push**: expo-notifications (уже настроен plugin в app.json)
