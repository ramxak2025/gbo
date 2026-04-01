import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import { SPORT_TYPES } from '../utils/sports';
import { api } from '../utils/api';
import GlassCard from '../components/GlassCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SPORT_TAGS = ['BJJ', 'MMA', 'Самбо', 'Дзюдо', 'Грэпплинг'];

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return '';
  let d = digits;
  if (d.startsWith('7') || d.startsWith('8')) d = d.slice(1);
  if (d.length === 0) return '8 ';
  let result = '8 (' + d.slice(0, 3);
  if (d.length > 3) result += ') ' + d.slice(3, 6);
  if (d.length > 6) result += '-' + d.slice(6, 8);
  if (d.length > 8) result += '-' + d.slice(8, 10);
  return result;
}

function unformatPhone(formatted) {
  const digits = formatted.replace(/\D/g, '');
  if (digits.startsWith('8')) return '8' + digits.slice(1);
  if (digits.startsWith('7')) return '8' + digits.slice(1);
  return '8' + digits;
}

export default function LoginScreen() {
  const { dark, toggle } = useTheme();
  const { login } = useAuth();
  const { reload } = useData();
  const c = getColors(dark);

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'success'
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  // Registration fields
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regClubName, setRegClubName] = useState('');
  const [regSport, setRegSport] = useState('bjj');
  const [regCity, setRegCity] = useState('');
  const [regConsent, setRegConsent] = useState(false);
  const [showSportPicker, setShowSportPicker] = useState(false);

  const passwordRef = useRef(null);

  const handlePhoneChange = useCallback((text) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 11) {
      setPhone(formatPhone(text));
    }
  }, []);

  const handleRegPhoneChange = useCallback((text) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 11) {
      setRegPhone(formatPhone(text));
    }
  }, []);

  const handleLogin = useCallback(async (phoneOverride, passwordOverride) => {
    const loginPhone = phoneOverride || unformatPhone(phone);
    const loginPassword = passwordOverride || password;

    if (!loginPhone || loginPhone.replace(/\D/g, '').length < 11) {
      setError('Введите корректный номер телефона');
      return;
    }
    if (!loginPassword) {
      setError('Введите пароль');
      return;
    }

    setLoading(true);
    setError('');
    setErrorType(null);

    try {
      await login(loginPhone, loginPassword);
      await reload();
    } catch (e) {
      setError(e.message || 'Ошибка входа');
      setErrorType(e.errorType || null);
    } finally {
      setLoading(false);
    }
  }, [phone, password, login, reload]);

  const handleDemoLogin = useCallback((demoPhone, demoPass) => {
    handleLogin(demoPhone, demoPass);
  }, [handleLogin]);

  const handleRegister = useCallback(async () => {
    if (!regName.trim()) { setError('Введите имя'); return; }
    if (!regPhone || regPhone.replace(/\D/g, '').length < 11) { setError('Введите корректный номер телефона'); return; }
    if (!regPassword || regPassword.length < 4) { setError('Пароль минимум 4 символа'); return; }
    if (!regClubName.trim()) { setError('Введите название клуба'); return; }
    if (!regCity.trim()) { setError('Введите город'); return; }
    if (!regConsent) { setError('Необходимо согласие на обработку данных'); return; }

    setLoading(true);
    setError('');
    try {
      await api.register({
        name: regName.trim(),
        phone: unformatPhone(regPhone),
        password: regPassword,
        clubName: regClubName.trim(),
        sportType: regSport,
        city: regCity.trim(),
      });
      setMode('success');
    } catch (e) {
      setError(e.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  }, [regName, regPhone, regPassword, regClubName, regSport, regCity, regConsent]);

  const resetToLogin = useCallback(() => {
    setMode('login');
    setError('');
    setErrorType(null);
  }, []);

  const renderDecoCircles = () => (
    <View style={styles.decoContainer} pointerEvents="none">
      <View style={[styles.decoCircle, { top: -60, left: -40, backgroundColor: c.purple, opacity: 0.08 }]} />
      <View style={[styles.decoCircle, { top: 120, right: -60, width: 200, height: 200, backgroundColor: c.blue, opacity: 0.06 }]} />
      <View style={[styles.decoCircle, { bottom: 100, left: -30, width: 150, height: 150, backgroundColor: c.accent, opacity: 0.05 }]} />
    </View>
  );

  const renderError = () => {
    if (!error) return null;
    let extraMessage = null;
    if (errorType === 'student') {
      extraMessage = 'Ученики входят через номер телефона, указанный тренером при регистрации.';
    } else if (errorType === 'trainer') {
      extraMessage = 'Если вы тренер, убедитесь что ваша заявка одобрена администратором.';
    }
    return (
      <View style={[styles.errorBox, { backgroundColor: c.redBg, borderColor: c.red }]}>
        <Ionicons name="alert-circle" size={18} color={c.red} />
        <View style={styles.errorTextWrap}>
          <Text style={[styles.errorText, { color: c.red }]}>{error}</Text>
          {extraMessage && (
            <Text style={[styles.errorHint, { color: c.red, opacity: 0.8 }]}>{extraMessage}</Text>
          )}
        </View>
      </View>
    );
  };

  const renderSuccessScreen = () => (
    <View style={styles.successContainer}>
      <View style={[styles.successIcon, { backgroundColor: c.greenBg }]}>
        <Ionicons name="checkmark-circle" size={64} color={c.green} />
      </View>
      <Text style={[styles.successTitle, { color: c.text }]}>Заявка отправлена!</Text>
      <Text style={[styles.successText, { color: c.textSecondary }]}>
        Ваша заявка на регистрацию отправлена. После проверки администратором вы сможете войти в систему.
      </Text>
      <TouchableOpacity
        style={[styles.loginButton, { backgroundColor: c.purple }]}
        onPress={resetToLogin}
      >
        <Text style={styles.loginButtonText}>Вернуться к входу</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRegisterForm = () => (
    <View>
      <Text style={[styles.sectionTitle, { color: c.text }]}>Регистрация тренера</Text>
      <Text style={[styles.sectionSubtitle, { color: c.textSecondary }]}>
        Заполните форму для создания аккаунта тренера
      </Text>

      {renderError()}

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: c.textSecondary }]}>ФИО</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          placeholder="Иванов Иван Иванович"
          placeholderTextColor={c.placeholder}
          value={regName}
          onChangeText={setRegName}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Телефон</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          placeholder="8 (900) 123-45-67"
          placeholderTextColor={c.placeholder}
          value={regPhone}
          onChangeText={handleRegPhoneChange}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Пароль</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          placeholder="Минимум 4 символа"
          placeholderTextColor={c.placeholder}
          value={regPassword}
          onChangeText={setRegPassword}
          secureTextEntry
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Название клуба</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          placeholder="Название вашего клуба"
          placeholderTextColor={c.placeholder}
          value={regClubName}
          onChangeText={setRegClubName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Вид спорта</Text>
        <TouchableOpacity
          style={[styles.input, styles.pickerButton, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}
          onPress={() => setShowSportPicker(!showSportPicker)}
        >
          <Text style={{ color: c.text }}>
            {SPORT_TYPES.find(s => s.id === regSport)?.label || 'Выберите'}
          </Text>
          <Ionicons name={showSportPicker ? 'chevron-up' : 'chevron-down'} size={18} color={c.textSecondary} />
        </TouchableOpacity>
        {showSportPicker && (
          <View style={[styles.pickerList, { backgroundColor: c.card, borderColor: c.border }]}>
            {SPORT_TYPES.map(sport => (
              <TouchableOpacity
                key={sport.id}
                style={[
                  styles.pickerItem,
                  regSport === sport.id && { backgroundColor: c.purpleBg },
                ]}
                onPress={() => { setRegSport(sport.id); setShowSportPicker(false); }}
              >
                <Text style={{ color: regSport === sport.id ? c.purple : c.text }}>{sport.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Город</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          placeholder="Ваш город"
          placeholderTextColor={c.placeholder}
          value={regCity}
          onChangeText={setRegCity}
        />
      </View>

      <TouchableOpacity
        style={styles.consentRow}
        onPress={() => setRegConsent(!regConsent)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.checkbox,
          { borderColor: regConsent ? c.purple : c.inputBorder, backgroundColor: regConsent ? c.purple : 'transparent' },
        ]}>
          {regConsent && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
        <Text style={[styles.consentText, { color: c.textSecondary }]}>
          Согласен на обработку персональных данных
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.loginButton, { backgroundColor: c.purple, opacity: loading ? 0.7 : 1 }]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.loginButtonText}>Отправить заявку</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderLoginForm = () => (
    <View>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={[styles.logoText, { color: c.purple }]}>i</Text>
        <Text style={[styles.logoText, { color: c.text }]}>Borcuha</Text>
      </View>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>
        Управление клубом единоборств
      </Text>

      {renderError()}

      {/* Phone Input */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Телефон</Text>
        <View style={[styles.inputRow, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
          <Ionicons name="call-outline" size={18} color={c.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.inputField, { color: c.text }]}
            placeholder="8 (900) 123-45-67"
            placeholderTextColor={c.placeholder}
            value={phone}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
        </View>
      </View>

      {/* Password Input */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Пароль</Text>
        <View style={[styles.inputRow, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
          <Ionicons name="lock-closed-outline" size={18} color={c.textSecondary} style={styles.inputIcon} />
          <TextInput
            ref={passwordRef}
            style={[styles.inputField, { color: c.text }]}
            placeholder="Введите пароль"
            placeholderTextColor={c.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            returnKeyType="go"
            onSubmitEditing={() => handleLogin()}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={c.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Login Button */}
      <TouchableOpacity
        style={[styles.loginButton, { backgroundColor: c.purple, opacity: loading ? 0.7 : 1 }]}
        onPress={() => handleLogin()}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="log-in-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.loginButtonText}>Войти</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Register Link */}
      <TouchableOpacity
        style={styles.registerLink}
        onPress={() => { setMode('register'); setError(''); }}
      >
        <Text style={[styles.registerText, { color: c.textSecondary }]}>
          Вы тренер?{' '}
        </Text>
        <Text style={[styles.registerTextBold, { color: c.purple }]}>Зарегистрироваться</Text>
      </TouchableOpacity>

      {/* Demo Access Section */}
      <GlassCard style={styles.demoCard}>
        <TouchableOpacity
          style={styles.demoHeader}
          onPress={() => setDemoOpen(!demoOpen)}
          activeOpacity={0.7}
        >
          <View style={styles.demoHeaderLeft}>
            <Ionicons name="flask-outline" size={18} color={c.purple} />
            <Text style={[styles.demoTitle, { color: c.text }]}>Демо доступ</Text>
          </View>
          <Ionicons
            name={demoOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={c.textSecondary}
          />
        </TouchableOpacity>

        {demoOpen && (
          <View style={styles.demoBody}>
            <TouchableOpacity
              style={[styles.demoButton, { backgroundColor: c.purpleBg }]}
              onPress={() => handleDemoLogin('89999999999', 'demo123')}
            >
              <Ionicons name="school-outline" size={18} color={c.purple} />
              <View style={styles.demoButtonText}>
                <Text style={[styles.demoButtonTitle, { color: c.text }]}>Тренер</Text>
                <Text style={[styles.demoButtonSub, { color: c.textSecondary }]}>89999999999 / demo123</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoButton, { backgroundColor: c.blueBg }]}
              onPress={() => handleDemoLogin('89990000001', 'demo123')}
            >
              <Ionicons name="person-outline" size={18} color={c.blue} />
              <View style={styles.demoButtonText}>
                <Text style={[styles.demoButtonTitle, { color: c.text }]}>Ученик</Text>
                <Text style={[styles.demoButtonSub, { color: c.textSecondary }]}>89990000001 / demo123</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </GlassCard>

      {/* Sport Tags */}
      <View style={styles.sportTags}>
        {SPORT_TAGS.map(tag => (
          <View key={tag} style={[styles.sportTag, { backgroundColor: c.glass, borderColor: c.glassBorder }]}>
            <Text style={[styles.sportTagText, { color: c.textSecondary }]}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {renderDecoCircles()}

      {/* Theme Toggle */}
      <TouchableOpacity style={styles.themeToggle} onPress={toggle}>
        <Ionicons name={dark ? 'sunny-outline' : 'moon-outline'} size={22} color={c.textSecondary} />
      </TouchableOpacity>

      {/* Back Button */}
      {mode !== 'login' && (
        <TouchableOpacity style={styles.backButton} onPress={resetToLogin}>
          <Ionicons name="arrow-back" size={22} color={c.textSecondary} />
        </TouchableOpacity>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          {mode === 'login' && renderLoginForm()}
          {mode === 'register' && renderRegisterForm()}
          {mode === 'success' && renderSuccessScreen()}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  decoContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  decoCircle: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
  },
  themeToggle: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  backButton: {
    position: 'absolute',
    top: 56,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 80,
  },
  formContainer: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  eyeButton: {
    padding: 6,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    marginTop: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  registerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  registerText: {
    fontSize: 14,
  },
  registerTextBold: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  errorTextWrap: {
    flex: 1,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorHint: {
    fontSize: 12,
    marginTop: 4,
  },
  demoCard: {
    marginTop: 24,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  demoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  demoBody: {
    marginTop: 12,
    gap: 8,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  demoButtonText: {
    flex: 1,
  },
  demoButtonTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  demoButtonSub: {
    fontSize: 12,
    marginTop: 2,
  },
  sportTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 32,
    gap: 8,
  },
  sportTag: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  sportTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerList: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
  },
  pickerItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consentText: {
    flex: 1,
    fontSize: 13,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  successText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
});
