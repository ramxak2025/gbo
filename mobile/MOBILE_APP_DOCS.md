# iBorcuha - React Native Mobile App

## Overview
Полноценное мобильное приложение на React Native (Expo) для платформы управления единоборствами iBorcuha. Полностью повторяет функционал и дизайн веб-версии.

## Tech Stack
- **Framework:** React Native 0.81 + Expo SDK 54
- **Navigation:** React Navigation 7 (Native Stack + Bottom Tabs)
- **State:** React Context (Auth, Data, Theme)
- **Storage:** expo-secure-store (токены, настройки)
- **Icons:** @expo/vector-icons (Ionicons, MaterialCommunityIcons)
- **QR:** react-native-qrcode-svg (генерация), expo-camera (сканирование)
- **Images:** expo-image-picker (загрузка аватаров)

## Project Structure
```
mobile/
├── App.js                    # Entry point
├── app.json                  # Expo config
├── eas.json                  # EAS Build config
├── src/
│   ├── context/
│   │   ├── AuthContext.js    # JWT auth, login/logout
│   │   ├── DataContext.js    # All data CRUD operations
│   │   └── ThemeContext.js   # Dark/light theme
│   ├── utils/
│   │   ├── api.js            # REST API client (45+ endpoints)
│   │   ├── sports.js         # Sport types, belts, ranks, brackets
│   │   ├── theme.js          # Color palettes
│   │   └── asyncStorage.js   # SecureStore wrapper
│   ├── components/
│   │   ├── GlassCard.js      # Glass-morphism card
│   │   ├── Avatar.js         # User avatar
│   │   ├── PageHeader.js     # Navigation header
│   │   ├── Modal.js          # Bottom sheet modal
│   │   ├── PhoneInput.js     # Russian phone input
│   │   └── QRGenerator.js    # QR code display
│   ├── screens/
│   │   ├── LoginScreen.js           # Login + registration
│   │   ├── DashboardScreen.js       # Role-based dashboard
│   │   ├── ProfileScreen.js         # User profile
│   │   ├── CashScreen.js            # Financial dashboard
│   │   ├── TeamScreen.js            # Team management
│   │   ├── StudentDetailScreen.js   # Student profile
│   │   ├── TrainerDetailScreen.js   # Trainer profile
│   │   ├── GroupsScreen.js          # Training groups
│   │   ├── AttendanceScreen.js      # Attendance tracking
│   │   ├── TournamentsScreen.js     # Tournaments list
│   │   ├── TournamentDetailScreen.js # Tournament details
│   │   ├── AddTournamentScreen.js   # Create tournament
│   │   ├── InternalTournamentDetailScreen.js # Bracket view
│   │   ├── CreateInternalTournamentScreen.js # Create internal tournament
│   │   ├── MaterialsScreen.js       # Video library
│   │   ├── ClubsScreen.js           # Clubs list
│   │   ├── ClubDetailScreen.js      # Club details
│   │   ├── ClubBranchesScreen.js    # Club branches
│   │   ├── ClubTrainersScreen.js    # Club trainers
│   │   ├── AddStudentScreen.js      # Add student form
│   │   ├── AddTrainerScreen.js      # Add trainer form
│   │   ├── ParentClubScreen.js      # Parent view
│   │   ├── NotificationSettingsScreen.js # Push settings
│   │   ├── AuthorScreen.js          # About/author
│   │   └── QRCheckinScreen.js       # QR scanner
│   └── navigation/
│       └── AppNavigator.js   # Tab + Stack navigation
```

## Roles & Navigation
| Role | Bottom Tabs |
|------|-------------|
| superadmin | Главная, Клубы, Люди, Турниры, Профиль |
| trainer | Главная, Касса, Команда, Турниры, Материалы |
| club_owner | Главная, Филиалы, Тренеры, Автор, Профиль |
| club_admin | Главная, Филиалы, Тренеры, Автор, Профиль |
| organizer | Главная, Турниры, Автор, Профиль |
| student | Главная, Команда, Турниры, Автор, Материалы |
| parent | Главная, Клуб, Турниры, Автор, Материалы |

## API Connection
Все запросы идут на `https://iborcuha.ru/api`. JWT-токен хранится в SecureStore.

## Build & Deploy

### Development
```bash
cd mobile
npm start
```

### Build APK (через EAS)
```bash
# Установить EAS CLI
npm install -g eas-cli

# Логин в Expo
eas login

# Собрать APK
eas build --platform android --profile preview
```

APK будет доступен для скачивания на https://expo.dev

### Production Build
```bash
eas build --platform android --profile production
```

## Design System
- **Dark mode** по умолчанию (переключается)
- **Glass-morphism** карточки
- **Цветовая схема:** фиолетовый акцент, тёмный фон #050505
- **Иконки:** Ionicons + MaterialCommunityIcons
- **Анимации:** нативные transition'ы React Navigation
