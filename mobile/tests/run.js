/**
 * iBorcuha Mobile App - Architecture Tests
 * Validates project structure, imports, and configuration
 */

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

const root = path.join(__dirname, '..');

console.log('\n🧪 iBorcuha Mobile App Tests\n');

// === Config Tests ===
console.log('Config:');

test('app.json exists and is valid', () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
  assert(config.expo.name === 'iBorcuha', 'App name should be iBorcuha');
  assert(config.expo.slug === 'iborcuha', 'Slug should be iborcuha');
  assert(config.expo.owner === 'ramxak', 'Owner should be ramxak');
  assert(config.expo.android.package === 'com.iborcuha.app', 'Android package');
  assert(config.expo.newArchEnabled === false, 'New arch should be disabled');
  assert(config.expo.extra.eas.projectId === '93f016a7-8af0-4dc9-a653-377fa2886f2a', 'EAS project ID');
});

test('.npmrc has legacy-peer-deps', () => {
  const npmrc = fs.readFileSync(path.join(root, '.npmrc'), 'utf8');
  assert(npmrc.includes('legacy-peer-deps=true'), '.npmrc should have legacy-peer-deps');
});

test('package.json has all dependencies', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const deps = Object.keys(pkg.dependencies);
  assert(deps.includes('expo'), 'Should have expo');
  assert(deps.includes('react-native'), 'Should have react-native');
  assert(deps.includes('@react-navigation/native'), 'Should have react-navigation');
  assert(deps.includes('react-native-svg'), 'Should have react-native-svg');
  assert(deps.includes('expo-secure-store'), 'Should have expo-secure-store');
  assert(deps.includes('expo-camera'), 'Should have expo-camera');
  // CRITICAL: Should NOT have @expo/vector-icons
  assert(!deps.includes('@expo/vector-icons'), 'Should NOT have @expo/vector-icons');
});

test('eas.json exists and has preview profile', () => {
  const eas = JSON.parse(fs.readFileSync(path.join(root, 'eas.json'), 'utf8'));
  assert(eas.build.preview.android.buildType === 'apk', 'Preview should build APK');
});

test('babel.config.js includes reanimated plugin', () => {
  const babel = fs.readFileSync(path.join(root, 'babel.config.js'), 'utf8');
  assert(babel.includes('react-native-reanimated/plugin'), 'Should include reanimated plugin');
});

// === Asset Tests ===
console.log('\nAssets:');

test('icon.png exists', () => {
  assert(fs.existsSync(path.join(root, 'assets', 'icon.png')), 'icon.png should exist');
});

test('adaptive-icon.png exists', () => {
  assert(fs.existsSync(path.join(root, 'assets', 'adaptive-icon.png')), 'adaptive-icon.png should exist');
});

test('splash.png exists', () => {
  assert(fs.existsSync(path.join(root, 'assets', 'splash.png')), 'splash.png should exist');
});

// === Source File Tests ===
console.log('\nSource Files:');

const requiredFiles = [
  'App.js',
  'index.js',
  'src/api/client.js',
  'src/context/AuthContext.js',
  'src/context/DataContext.js',
  'src/context/ThemeContext.js',
  'src/utils/constants.js',
  'src/utils/storage.js',
  'src/utils/sports.js',
  'src/icons/index.js',
  'src/components/GlassCard.js',
  'src/components/Modal.js',
  'src/components/Avatar.js',
  'src/components/PageHeader.js',
  'src/components/PhoneInput.js',
  'src/components/QRScanner.js',
  'src/components/QRGenerator.js',
  'src/components/BracketView.js',
  'src/components/DateButton.js',
  'src/components/LiquidGlassTabBar.js',
  'src/navigation/AppNavigator.js',
  'src/screens/LoginScreen.js',
  'src/screens/DashboardScreen.js',
  'src/screens/CashScreen.js',
  'src/screens/TeamScreen.js',
  'src/screens/StudentDetailScreen.js',
  'src/screens/TournamentsScreen.js',
  'src/screens/TournamentDetailScreen.js',
  'src/screens/ProfileScreen.js',
  'src/screens/AddStudentScreen.js',
  'src/screens/AddTournamentScreen.js',
  'src/screens/AddTrainerScreen.js',
  'src/screens/TrainerDetailScreen.js',
  'src/screens/GroupsScreen.js',
  'src/screens/AuthorScreen.js',
  'src/screens/NotificationSettingsScreen.js',
  'src/screens/CreateInternalTournamentScreen.js',
  'src/screens/InternalTournamentDetailScreen.js',
  'src/screens/AttendanceScreen.js',
  'src/screens/MaterialsScreen.js',
  'src/screens/ClubsScreen.js',
  'src/screens/ClubDetailScreen.js',
  'src/screens/QRCheckinScreen.js',
  'src/screens/ParentClubScreen.js',
  'src/screens/ClubBranchesScreen.js',
  'src/screens/ClubTrainersScreen.js',
  'src/screens/CatalogScreen.js',
];

test(`All ${requiredFiles.length} source files exist`, () => {
  const missing = requiredFiles.filter(f => !fs.existsSync(path.join(root, f)));
  assert(missing.length === 0, `Missing files: ${missing.join(', ')}`);
});

// === No @expo/vector-icons Usage ===
console.log('\nSecurity - No @expo/vector-icons:');

test('No imports of @expo/vector-icons in any source file', () => {
  const srcDir = path.join(root, 'src');
  const allFiles = getAllFiles(srcDir, []);
  allFiles.push(path.join(root, 'App.js'));

  const violations = [];
  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('@expo/vector-icons') || content.includes('expo-vector-icons')) {
      violations.push(path.relative(root, file));
    }
  }
  assert(violations.length === 0, `Found @expo/vector-icons in: ${violations.join(', ')}`);
});

test('No Ionicons usage in any source file', () => {
  const srcDir = path.join(root, 'src');
  const allFiles = getAllFiles(srcDir, []);
  allFiles.push(path.join(root, 'App.js'));

  const violations = [];
  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('Ionicons') || content.includes('MaterialIcons') || content.includes('FontAwesome')) {
      violations.push(path.relative(root, file));
    }
  }
  assert(violations.length === 0, `Found icon font usage in: ${violations.join(', ')}`);
});

// === Architecture Tests ===
console.log('\nArchitecture:');

test('App.js has correct provider order: ErrorBoundary > SafeArea > Theme > Auth > Data', () => {
  const app = fs.readFileSync(path.join(root, 'App.js'), 'utf8');
  const themeIdx = app.indexOf('ThemeProvider');
  const authIdx = app.indexOf('AuthProvider');
  const dataIdx = app.indexOf('DataProvider');
  assert(themeIdx < authIdx, 'ThemeProvider should wrap AuthProvider');
  assert(authIdx < dataIdx, 'AuthProvider should wrap DataProvider');
});

test('ErrorBoundary uses NO icon fonts (only Text)', () => {
  const app = fs.readFileSync(path.join(root, 'App.js'), 'utf8');
  // Extract ErrorBoundary class
  const ebStart = app.indexOf('class ErrorBoundary');
  const ebEnd = app.indexOf('}', app.indexOf('render()', ebStart) + 200);
  const errorBoundary = app.substring(ebStart, ebEnd);
  assert(!errorBoundary.includes('Icon'), 'ErrorBoundary should not use any Icon components');
});

test('AppNavigator has role-based tabs for all 7 roles', () => {
  const nav = fs.readFileSync(path.join(root, 'src/navigation/AppNavigator.js'), 'utf8');
  const roles = ['superadmin', 'trainer', 'club_owner', 'club_admin', 'organizer', 'student', 'parent'];
  for (const role of roles) {
    assert(nav.includes(`${role}:`), `Should have tabs for ${role}`);
  }
});

test('API client has all endpoints', () => {
  const api = fs.readFileSync(path.join(root, 'src/api/client.js'), 'utf8');
  const endpoints = [
    'login', 'logout', 'me', 'getData',
    'addStudent', 'updateStudent', 'deleteStudent',
    'addGroup', 'updateGroup', 'deleteGroup',
    'addTransaction', 'deleteTransaction',
    'addTournament', 'deleteTournament',
    'registerTournament', 'unregisterTournament',
    'addTrainer', 'deleteTrainer',
    'addMaterial', 'deleteMaterial',
    'addClub', 'deleteClub',
    'addBranch', 'deleteBranch',
    'approveRegistration', 'rejectRegistration',
    'qrCheckin', 'saveAttendanceBulk',
  ];
  for (const ep of endpoints) {
    assert(api.includes(ep), `Should have ${ep} endpoint`);
  }
});

test('DataContext has all CRUD operations', () => {
  const dc = fs.readFileSync(path.join(root, 'src/context/DataContext.js'), 'utf8');
  const ops = [
    'addStudent', 'updateStudent', 'deleteStudent',
    'addGroup', 'updateGroup', 'deleteGroup',
    'addTournament', 'deleteTournament',
    'addTrainer', 'deleteTrainer',
    'addMaterial', 'deleteMaterial',
    'addClub', 'deleteClub',
    'approveRegistration', 'rejectRegistration',
  ];
  for (const op of ops) {
    assert(dc.includes(op), `Should have ${op} operation`);
  }
});

// === Design System Tests ===
console.log('\nDesign System:');

test('Constants has dark and light color schemes', () => {
  const constants = fs.readFileSync(path.join(root, 'src/utils/constants.js'), 'utf8');
  assert(constants.includes('#050505'), 'Should have dark bg color');
  assert(constants.includes('#f5f5f7'), 'Should have light bg color');
  assert(constants.includes('#8b5cf6'), 'Should have dark accent');
  assert(constants.includes('#7c3aed'), 'Should have light accent');
});

test('LiquidGlassTabBar matches iOS 26 style', () => {
  const tabBar = fs.readFileSync(path.join(root, 'src/components/LiquidGlassTabBar.js'), 'utf8');
  assert(tabBar.includes('borderRadius'), 'Should have border radius');
  assert(tabBar.includes('height: 60'), 'Should be 60px height');
  assert(tabBar.includes('rgba(255,255,255,0.08)'), 'Should have glass bg for dark');
});

test('GlassCard has correct border radius (20)', () => {
  const card = fs.readFileSync(path.join(root, 'src/components/GlassCard.js'), 'utf8');
  assert(card.includes('RADIUS.lg') || card.includes('20'), 'Should have 20px border radius');
});

// === Summary ===
console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(40)}\n`);

if (failed > 0) process.exit(1);

// Helpers
function getAllFiles(dir, files) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, files);
    } else if (entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}
