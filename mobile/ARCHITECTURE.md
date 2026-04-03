# iBorcuha Mobile App - Architecture Documentation

## Overview
React Native (Expo SDK 54) mobile app for the iBorcuha martial arts club management platform.
Mirrors the web app at https://iborcuha.ru with native enhancements.

## Tech Stack
- **Framework**: React Native 0.81 + Expo SDK 54
- **Navigation**: React Navigation 7 (Native Stack + Bottom Tabs)
- **State**: React Context (AuthContext, DataContext, ThemeContext)
- **Storage**: expo-secure-store (tokens), @react-native-async-storage/async-storage (data cache)
- **Icons**: Custom SVG icons via react-native-svg (NO @expo/vector-icons to avoid font crash)
- **Camera**: expo-camera (QR scanning)
- **Build**: EAS Build (expo.dev)

## Critical Design Decisions

### 1. NO @expo/vector-icons
Previous builds crashed with "Cannot read property 'regular' of undefined" due to font loading issues.
**Solution**: Use react-native-svg with custom icon components. Zero font dependencies.

### 2. Provider Order
```
ThemeProvider → AuthProvider → DataProvider → NavigationContainer
```
Auth must be available before Data loads (Data fetches require auth token).

### 3. New Architecture Disabled
`newArchEnabled: false` in app.json for maximum compatibility.

### 4. Legacy Peer Deps
`.npmrc` with `legacy-peer-deps=true` for EAS Build compatibility.

---

## Project Structure
```
mobile/
├── app.json                 # Expo config
├── package.json
├── .npmrc                   # legacy-peer-deps=true
├── babel.config.js
├── index.js                 # Entry point
├── App.js                   # Root component (providers + navigation)
├── assets/
│   ├── icon.png             # 1024x1024 app icon
│   ├── adaptive-icon.png    # Android adaptive icon (with padding)
│   └── splash.png           # Splash screen
├── src/
│   ├── api/
│   │   └── client.js        # API client with auth headers
│   ├── context/
│   │   ├── AuthContext.js    # Authentication state + login/logout
│   │   ├── DataContext.js    # App data (students, groups, tournaments, etc.)
│   │   └── ThemeContext.js   # Dark/light theme
│   ├── utils/
│   │   ├── sports.js         # Sport types, belts, ranks, brackets
│   │   ├── storage.js        # SecureStore + AsyncStorage helpers
│   │   └── constants.js      # Colors, spacing, shared values
│   ├── icons/
│   │   └── index.js          # Custom SVG icon components
│   ├── components/
│   │   ├── GlassCard.js      # Glassmorphic card container
│   │   ├── Modal.js          # Bottom sheet modal
│   │   ├── Avatar.js         # User avatar
│   │   ├── PageHeader.js     # Screen header with back/title/actions
│   │   ├── PhoneInput.js     # Phone number input
│   │   ├── QRScanner.js      # Camera-based QR reader
│   │   ├── QRGenerator.js    # QR code display
│   │   ├── BracketView.js    # Tournament bracket visualization
│   │   ├── DateButton.js     # Date picker button
│   │   └── LiquidGlassTabBar.js  # iOS 26 liquid glass bottom nav
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── CashScreen.js
│   │   ├── TeamScreen.js
│   │   ├── StudentDetailScreen.js
│   │   ├── TournamentsScreen.js
│   │   ├── TournamentDetailScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── AddStudentScreen.js
│   │   ├── AddTournamentScreen.js
│   │   ├── AddTrainerScreen.js
│   │   ├── TrainerDetailScreen.js
│   │   ├── GroupsScreen.js
│   │   ├── AuthorScreen.js
│   │   ├── NotificationSettingsScreen.js
│   │   ├── CreateInternalTournamentScreen.js
│   │   ├── InternalTournamentDetailScreen.js
│   │   ├── AttendanceScreen.js
│   │   ├── MaterialsScreen.js
│   │   ├── ClubsScreen.js
│   │   ├── ClubDetailScreen.js
│   │   ├── QRCheckinScreen.js
│   │   ├── ParentClubScreen.js
│   │   ├── ClubBranchesScreen.js
│   │   ├── ClubTrainersScreen.js
│   │   └── CatalogScreen.js
│   └── navigation/
│       └── AppNavigator.js   # Stack + Tab navigation setup
```

---

## Design System

### Colors
| Token | Dark | Light |
|-------|------|-------|
| Background | #050505 | #f5f5f7 |
| Card BG | rgba(255,255,255,0.05) | rgba(255,255,255,0.7) |
| Card Border | rgba(255,255,255,0.07) | rgba(255,255,255,0.6) |
| Text Primary | #ffffff | #1a1a1a |
| Text Secondary | rgba(255,255,255,0.5) | #6b7280 |
| Accent | #8b5cf6 | #7c3aed |
| Accent Light | rgba(139,92,246,0.15) | rgba(124,58,237,0.1) |
| Success | #22c55e | #16a34a |
| Danger | #ef4444 | #dc2626 |

### Component Specs
- **GlassCard**: borderRadius 20, padding 16, blur backdrop
- **Modal**: bottom sheet, borderTopRadius 32, maxHeight 85%
- **PageHeader**: sticky top, blur backdrop on scroll
- **Bottom Tabs**: iOS 26 liquid glass, borderRadius 22, height 60, blur backdrop
- **Press animation**: scale(0.97) on press

### Typography
- Headers: bold, uppercase, italic (matching web)
- Body: system font (San Francisco on iOS, Roboto on Android)

---

## Navigation Structure

### Bottom Tabs (by role)

| Role | Tab 1 | Tab 2 | Tab 3 | Tab 4 | Tab 5 |
|------|-------|-------|-------|-------|-------|
| superadmin | Home | Clubs | People | Tournaments | Profile |
| trainer | Home | Cash | Team | Tournaments | Materials |
| club_owner | Home | Branches | Trainers | Author | Catalog |
| club_admin | Home | Branches | Trainers | Author | Catalog |
| organizer | Home | Tournaments | Author | Profile | - |
| student | Home | Team | Tournaments | Author | Materials |
| parent | Home | Club | Tournaments | Author | Materials |

### Stack Screens (pushed on top of tabs)
- StudentDetail, TournamentDetail, TrainerDetail, ClubDetail
- AddStudent, AddTournament, AddTrainer
- Groups, Attendance, CreateInternalTournament, InternalTournamentDetail
- QRCheckin, NotificationSettings, Profile

---

## API Endpoints

Base URL: `https://iborcuha.ru/api`

### Auth
- POST `/auth/login` - Login with phone + password
- POST `/auth/logout` - Logout
- GET `/auth/me` - Verify token / get user info
- POST `/auth/register` - Register new user

### Data
- GET `/data` - Full data load (all entities for user's role)

### CRUD Operations
| Entity | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| Students | POST /data/students | via /data | PUT /data/students/:id | DELETE /data/students/:id |
| Groups | POST /data/groups | via /data | PUT /data/groups/:id | DELETE /data/groups/:id |
| Transactions | POST /data/transactions | via /data | PUT /data/transactions/:id | DELETE /data/transactions/:id |
| Tournaments | POST /data/tournaments | via /data | PUT /data/tournaments/:id | DELETE /data/tournaments/:id |
| News | POST /data/news | via /data | - | DELETE /data/news/:id |
| Trainers | POST /data/trainers | via /data | PUT /data/trainers/:id | DELETE /data/trainers/:id |
| Materials | POST /data/materials | via /data | PUT /data/materials/:id | DELETE /data/materials/:id |
| Clubs | POST /data/clubs | via /data | PUT /data/clubs/:id | DELETE /data/clubs/:id |
| Parents | POST /data/parents | via /data | PUT /data/parents/:id | DELETE /data/parents/:id |
| Branches | POST /data/branches | via /data | PUT /data/branches/:id | DELETE /data/branches/:id |
| Internal Tournaments | POST /data/internal-tournaments | via /data | PUT /data/internal-tournaments/:id | DELETE /data/internal-tournaments/:id |

### Special Endpoints
- POST `/data/tournament-registrations` - Register for tournament
- DELETE `/data/tournament-registrations` - Unregister
- POST `/data/attendance/bulk` - Save attendance records
- POST `/data/attendance/qr-checkin` - QR check-in
- GET/POST `/data/qr-token/:groupId` - QR tokens
- PUT `/data/student-groups/:studentId` - Multi-group assignment
- POST `/data/clubs/:clubId/trainers` - Assign trainer to club
- DELETE `/data/clubs/:clubId/trainers/:trainerId` - Remove trainer
- POST `/data/registrations/:id/approve` - Approve registration
- POST `/data/registrations/:id/reject` - Reject registration
- PUT `/data/author` - Update author info

### Push Notifications
- GET `/push/vapid-key`
- POST `/push/subscribe`
- POST `/push/unsubscribe`
- GET `/push/settings`
- PUT `/push/settings`

---

## User Roles & Access

| Feature | superadmin | trainer | club_owner | club_admin | organizer | student | parent |
|---------|-----------|---------|------------|------------|-----------|---------|--------|
| Dashboard | Full stats | Own stats | Club stats | Club stats | Events | Own data | Child data |
| Clubs | CRUD all | View own | Own club | Own club | - | - | - |
| Students | View all | CRUD own | View club | View club | - | - | View child |
| Groups | View all | CRUD own | View club | View club | - | View own | - |
| Cash | - | Full access | - | - | - | - | - |
| Tournaments | CRUD all | View/register | View | View | CRUD own | View/register | View |
| Materials | View all | CRUD own | - | - | - | View | View |
| Trainers | CRUD all | - | View club | View club | - | - | - |
| Author | - | - | Edit own | Edit own | Edit own | View | View |
| Attendance | View all | Mark own | - | - | - | View own | View child |
| Branches | - | - | CRUD own | CRUD own | - | - | - |
| Profile | Edit own | Edit own | Edit own | Edit own | Edit own | View | View |

---

## EAS Build Config

```json
{
  "expo": {
    "name": "iBorcuha",
    "slug": "iborcuha",
    "owner": "ramxak",
    "version": "2.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "iborcuha",
    "newArchEnabled": false,
    "android": {
      "package": "com.iborcuha.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#050505"
      }
    },
    "ios": {
      "bundleIdentifier": "com.iborcuha.app"
    },
    "extra": {
      "eas": {
        "projectId": "93f016a7-8af0-4dc9-a653-377fa2886f2a"
      }
    }
  }
}
```

## Testing Checklist
- [ ] App launches without crash
- [ ] Login/logout flow works
- [ ] Each role sees correct bottom tabs
- [ ] All screens render correctly
- [ ] CRUD operations work (add/edit/delete)
- [ ] QR scanning works
- [ ] Theme toggle (dark/light)
- [ ] Pull-to-refresh on data screens
- [ ] Navigation back buttons work
- [ ] Modal sheets open/close correctly
- [ ] Search/filter functionality
- [ ] Tournament bracket display
- [ ] Attendance marking
- [ ] File upload (avatar, materials)
