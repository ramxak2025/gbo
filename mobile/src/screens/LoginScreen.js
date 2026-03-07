import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  User,
  Building2,
  MapPin,
  Send,
  Check,
  Square,
  CheckSquare,
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { getColors } from '../utils/theme';
import { SPORT_TYPES } from '../utils/sports';

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  let d = digits;
  if (d.length > 0 && d[0] === '7' && d.length <= 11) d = '8' + d.slice(1);
  if (d.length > 0 && d[0] !== '8') d = '8' + d;
  let result = d[0] || '';
  if (d.length > 1) result += ' (' + d.slice(1, 4);
  if (d.length >= 4) result += ') ';
  if (d.length > 4) result += d.slice(4, 7);
  if (d.length > 7) result += '-' + d.slice(7, 9);
  if (d.length > 9) result += '-' + d.slice(9, 11);
  return result;
}

function cleanPhone(value) {
  return value.replace(/\D/g, '');
}

export default function LoginScreen({ onLogin }) {
  const { dark, toggle } = useTheme();
  const { login } = useAuth();
  const c = getColors(dark);

  const [mode, setMode] = useState('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const [reg, setReg] = useState({
    name: '',
    phone: '',
    password: '',
    clubName: '',
    sportType: '',
    city: '',
    consent: false,
  });
  const [regShowPw, setRegShowPw] = useState(false);
  const [showSportPicker, setShowSportPicker] = useState(false);

  const handleDemoLogin = async (demoPhone, demoPassword) => {
    setError('');
    setErrorType(null);
    setLoading(true);
    try {
      await login(demoPhone, demoPassword);
      if (onLogin) onLogin();
    } catch (err) {
      setError(err.message || 'Ошибка демо-входа');
      setErrorType(err.errorType || null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setErrorType(null);
    const digits = cleanPhone(phone);
    if (digits.length < 11) {
      setError('Введите полный номер телефона');
      return;
    }
    if (!password) {
      setError('Введите пароль');
      return;
    }
    setLoading(true);
    try {
      await login(digits, password);
      if (onLogin) onLogin();
    } catch (err) {
      setError(err.message || 'Ошибка входа');
      setErrorType(err.errorType || null);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    if (!reg.name.trim()) {
      setError('Введите ФИО');
      return;
    }
    const digits = cleanPhone(reg.phone);
    if (digits.length < 11) {
      setError('Введите полный номер телефона');
      return;
    }
    if (!reg.password || reg.password.length < 4) {
      setError('Пароль минимум 4 символа');
      return;
    }
    if (!reg.clubName.trim()) {
      setError('Введите название клуба');
      return;
    }
    if (!reg.consent) {
      setError('Необходимо согласие на обработку персональных данных');
      return;
    }
    setLoading(true);
    try {
      await api.register({
        name: reg.name.trim(),
        phone: digits,
        password: reg.password,
        clubName: reg.clubName.trim(),
        sportType: reg.sportType || null,
        city: reg.city.trim() || null,
        consent: reg.consent,
      });
      setMode('success');
    } catch (err) {
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  const switchToRegister = () => {
    setMode('register');
    setError('');
    setReg({
      name: '',
      phone: '',
      password: '',
      clubName: '',
      sportType: '',
      city: '',
      consent: false,
    });
  };

  const goBack = () => {
    setMode('login');
    setError('');
  };

  const sportLabel =
    SPORT_TYPES.find((s) => s.id === reg.sportType)?.label || '';

  // Dynamic styles based on theme
  const bgColor = dark ? '#050505' : '#f5f5f7';
  const cardBg = dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)';
  const cardBorder = dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.6)';
  const inputBg = dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.8)';
  const inputBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)';
  const textColor = dark ? '#ffffff' : '#111827';
  const textSecondary = dark ? 'rgba(255,255,255,0.5)' : '#6b7280';
  const textMuted = dark ? 'rgba(255,255,255,0.2)' : '#9ca3af';
  const placeholderColor = dark ? 'rgba(255,255,255,0.25)' : '#9ca3af';
  const iconColor = dark ? 'rgba(255,255,255,0.2)' : '#6b7280';
  const purple = dark ? '#a855f7' : '#7c3aed';
  const purpleBg = dark ? 'rgba(168,85,247,0.15)' : 'rgba(124,58,237,0.1)';

  const renderInput = ({
    icon: Icon,
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    showToggle,
    toggleShow,
    isVisible,
    keyboardType,
    maxLength,
    autoCapitalize,
  }) => (
    <View style={styles.inputContainer}>
      <View style={styles.inputIconContainer}>
        <Icon size={16} color={iconColor} />
      </View>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: inputBg,
            borderColor: inputBorder,
            color: textColor,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry && !isVisible}
        keyboardType={keyboardType || 'default'}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize || 'none'}
      />
      {showToggle && (
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={toggleShow}
          activeOpacity={0.6}
        >
          {isVisible ? (
            <EyeOff size={16} color={iconColor} />
          ) : (
            <Eye size={16} color={iconColor} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  // ===== LOGIN MODE =====
  const renderLogin = () => (
    <View style={styles.modeContainer}>
      {/* Logo area */}
      <View style={styles.logoContainer}>
        {/* Purple glow behind logo */}
        <View
          style={[
            styles.logoGlow,
            {
              backgroundColor: dark
                ? 'rgba(168,85,247,0.3)'
                : 'rgba(168,85,247,0.2)',
            },
          ]}
        />
        {/* Logo placeholder */}
        <View
          style={[
            styles.logoBox,
            {
              backgroundColor: dark
                ? 'rgba(168,85,247,0.2)'
                : 'rgba(168,85,247,0.15)',
            },
          ]}
        >
          <Text style={[styles.logoText, { color: purple }]}>iB</Text>
        </View>

        {/* Title */}
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.titleI,
              { color: dark ? 'rgba(255,255,255,0.6)' : '#6b7280' },
            ]}
          >
            i
          </Text>
          <Text style={[styles.titleBorcuha, { color: purple }]}>Borcuha</Text>
        </View>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: textMuted }]}>
          ПЛАТФОРМА ДЛЯ ЕДИНОБОРСТВ
        </Text>
      </View>

      {/* Login card */}
      <View
        style={[
          styles.card,
          styles.glassCard,
          {
            borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.7)',
          },
        ]}
      >
        <BlurView
          intensity={dark ? 40 : 30}
          tint={dark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: cardBg }]} />
        {renderInput({
          icon: Phone,
          placeholder: '8 (900) 123-45-67',
          value: phone,
          onChangeText: (text) => setPhone(formatPhone(text)),
          keyboardType: 'phone-pad',
          maxLength: 18,
        })}

        <View style={{ height: 12 }} />

        {renderInput({
          icon: Lock,
          placeholder: 'Пароль',
          value: password,
          onChangeText: setPassword,
          secureTextEntry: true,
          showToggle: true,
          toggleShow: () => setShowPw(!showPw),
          isVisible: showPw,
        })}

        {/* Errors */}
        {error && errorType === 'student' && (
          <View style={styles.errorBlock}>
            <Text style={[styles.errorText, { color: c.red }]}>{error}</Text>
            <Text style={[styles.errorHint, { color: textSecondary }]}>
              Обратитесь к тренеру за паролем
            </Text>
          </View>
        )}
        {error && errorType === 'trainer' && (
          <View style={styles.errorBlock}>
            <Text style={[styles.errorText, { color: c.red }]}>{error}</Text>
            <Text style={[styles.errorHint, { color: textSecondary }]}>
              Свяжитесь с администратором:
            </Text>
            <TouchableOpacity
              style={styles.waButton}
              onPress={() => Linking.openURL('https://wa.me/89884444436')}
              activeOpacity={0.7}
            >
              <Text style={styles.waButtonText}>8-988-444-44-36</Text>
            </TouchableOpacity>
          </View>
        )}
        {error && !errorType && (
          <Text style={[styles.errorText, { color: c.red, marginTop: 12 }]}>
            {error}
          </Text>
        )}

        {/* Login button */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#7c3aed', '#a855f7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <View style={styles.buttonContent}>
                <LogIn size={18} color="#ffffff" />
                <Text style={styles.primaryButtonText}>Войти</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Register CTA */}
      <TouchableOpacity
        style={[
          styles.registerButton,
          {
            borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.7)',
          },
        ]}
        onPress={switchToRegister}
        activeOpacity={0.7}
      >
        <BlurView
          intensity={dark ? 30 : 20}
          tint={dark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: cardBg }]} />
        <UserPlus size={15} color={textSecondary} />
        <Text style={[styles.registerButtonText, { color: textSecondary }]}>
          Я тренер — хочу зарегистрироваться
        </Text>
      </TouchableOpacity>

      {/* Demo section */}
      <View style={styles.demoSection}>
        <TouchableOpacity
          style={styles.demoToggle}
          onPress={() => setShowDemo(!showDemo)}
          activeOpacity={0.6}
        >
          <Text style={[styles.demoToggleText, { color: textMuted }]}>
            ДЕМО-ДОСТУП
          </Text>
          {showDemo ? (
            <ChevronUp size={14} color={textMuted} />
          ) : (
            <ChevronDown size={14} color={textMuted} />
          )}
        </TouchableOpacity>

        {showDemo && (
          <View style={styles.demoButtons}>
            <TouchableOpacity
              style={[
                styles.demoButton,
                {
                  backgroundColor: dark
                    ? 'rgba(59,130,246,0.1)'
                    : 'rgba(59,130,246,0.06)',
                  borderColor: dark
                    ? 'rgba(59,130,246,0.15)'
                    : 'rgba(59,130,246,0.2)',
                },
              ]}
              onPress={() => handleDemoLogin('89999999999', 'demo123')}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.demoEmoji}>🥋</Text>
              <Text
                style={[
                  styles.demoLabel,
                  { color: dark ? '#60a5fa' : '#2563eb' },
                ]}
              >
                Тренер
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.demoButton,
                {
                  backgroundColor: dark
                    ? 'rgba(34,197,94,0.1)'
                    : 'rgba(34,197,94,0.06)',
                  borderColor: dark
                    ? 'rgba(34,197,94,0.15)'
                    : 'rgba(34,197,94,0.2)',
                },
              ]}
              onPress={() => handleDemoLogin('89990000001', 'demo123')}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.demoEmoji}>🤼</Text>
              <Text
                style={[
                  styles.demoLabel,
                  { color: dark ? '#4ade80' : '#16a34a' },
                ]}
              >
                Спортсмен
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Sport tags */}
      <View style={styles.sportTags}>
        {['BJJ', 'MMA', 'Самбо', 'Дзюдо', 'Грэпплинг'].map((s) => (
          <View
            key={s}
            style={[
              styles.sportTag,
              {
                backgroundColor: dark
                  ? 'rgba(255,255,255,0.04)'
                  : 'rgba(0,0,0,0.04)',
              },
            ]}
          >
            <Text style={[styles.sportTagText, { color: textMuted }]}>
              {s}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  // ===== REGISTER MODE =====
  const renderRegister = () => (
    <View style={styles.modeContainer}>
      {/* Header */}
      <View style={styles.regHeader}>
        <View
          style={[
            styles.regIconBox,
            { backgroundColor: purpleBg },
          ]}
        >
          <UserPlus size={26} color={purple} />
        </View>
        <Text style={[styles.regTitle, { color: textColor }]}>
          Регистрация тренера
        </Text>
        <Text style={[styles.regSubtitle, { color: textSecondary }]}>
          Заполните данные для подачи заявки
        </Text>
      </View>

      {/* Registration card */}
      <View
        style={[
          styles.card,
          styles.glassCard,
          {
            borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.7)',
          },
        ]}
      >
        <BlurView
          intensity={dark ? 40 : 30}
          tint={dark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: cardBg }]} />
        {renderInput({
          icon: User,
          placeholder: 'ФИО *',
          value: reg.name,
          onChangeText: (text) => setReg((r) => ({ ...r, name: text })),
          autoCapitalize: 'words',
        })}

        <View style={{ height: 12 }} />

        {renderInput({
          icon: Phone,
          placeholder: 'Телефон *',
          value: reg.phone,
          onChangeText: (text) =>
            setReg((r) => ({ ...r, phone: formatPhone(text) })),
          keyboardType: 'phone-pad',
          maxLength: 18,
        })}

        <View style={{ height: 12 }} />

        {renderInput({
          icon: Lock,
          placeholder: 'Пароль *',
          value: reg.password,
          onChangeText: (text) => setReg((r) => ({ ...r, password: text })),
          secureTextEntry: true,
          showToggle: true,
          toggleShow: () => setRegShowPw(!regShowPw),
          isVisible: regShowPw,
        })}

        {/* Separator */}
        <View
          style={[
            styles.separator,
            {
              backgroundColor: dark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.04)',
            },
          ]}
        />

        {renderInput({
          icon: Building2,
          placeholder: 'Название клуба *',
          value: reg.clubName,
          onChangeText: (text) => setReg((r) => ({ ...r, clubName: text })),
          autoCapitalize: 'sentences',
        })}

        <View style={{ height: 12 }} />

        {/* Sport type picker */}
        <TouchableOpacity
          style={[
            styles.pickerButton,
            {
              backgroundColor: inputBg,
              borderColor: inputBorder,
            },
          ]}
          onPress={() => setShowSportPicker(!showSportPicker)}
          activeOpacity={0.7}
        >
          <View style={styles.inputIconContainer}>
            <LogIn size={16} color={iconColor} />
          </View>
          <Text
            style={[
              styles.pickerText,
              {
                color: sportLabel ? textColor : placeholderColor,
              },
            ]}
          >
            {sportLabel || 'Вид спорта'}
          </Text>
          <ChevronDown size={14} color={iconColor} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        {showSportPicker && (
          <View
            style={[
              styles.pickerDropdown,
              {
                backgroundColor: dark
                  ? 'rgba(30,30,40,0.98)'
                  : 'rgba(255,255,255,0.98)',
                borderColor: cardBorder,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.pickerOption,
                {
                  borderBottomColor: dark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.04)',
                },
              ]}
              onPress={() => {
                setReg((r) => ({ ...r, sportType: '' }));
                setShowSportPicker(false);
              }}
            >
              <Text style={[styles.pickerOptionText, { color: textSecondary }]}>
                Не выбрано
              </Text>
            </TouchableOpacity>
            {SPORT_TYPES.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.pickerOption,
                  reg.sportType === s.id && {
                    backgroundColor: purpleBg,
                  },
                  {
                    borderBottomColor: dark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(0,0,0,0.04)',
                  },
                ]}
                onPress={() => {
                  setReg((r) => ({ ...r, sportType: s.id }));
                  setShowSportPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    {
                      color:
                        reg.sportType === s.id ? purple : textColor,
                    },
                  ]}
                >
                  {s.label}
                </Text>
                {reg.sportType === s.id && (
                  <Check size={14} color={purple} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 12 }} />

        {renderInput({
          icon: MapPin,
          placeholder: 'Город',
          value: reg.city,
          onChangeText: (text) => setReg((r) => ({ ...r, city: text })),
          autoCapitalize: 'sentences',
        })}

        {/* Separator */}
        <View
          style={[
            styles.separator,
            {
              backgroundColor: dark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.04)',
            },
          ]}
        />

        {/* Consent checkbox */}
        <TouchableOpacity
          style={[
            styles.consentButton,
            reg.consent
              ? {
                  backgroundColor: dark
                    ? 'rgba(34,197,94,0.1)'
                    : 'rgba(34,197,94,0.06)',
                  borderColor: dark
                    ? 'rgba(34,197,94,0.2)'
                    : 'rgba(34,197,94,0.3)',
                }
              : {
                  backgroundColor: dark
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(255,255,255,0.8)',
                  borderColor: dark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(255,255,255,0.6)',
                },
          ]}
          onPress={() => setReg((r) => ({ ...r, consent: !r.consent }))}
          activeOpacity={0.7}
        >
          {reg.consent ? (
            <CheckSquare
              size={18}
              color={dark ? '#4ade80' : '#16a34a'}
              style={{ marginTop: 2 }}
            />
          ) : (
            <Square
              size={18}
              color={iconColor}
              style={{ marginTop: 2 }}
            />
          )}
          <Text
            style={[
              styles.consentText,
              { color: textSecondary },
            ]}
          >
            Даю согласие на обработку персональных данных в соответствии с ФЗ
            №152 «О персональных данных» *
          </Text>
        </TouchableOpacity>

        {/* Error */}
        {error ? (
          <Text style={[styles.errorText, { color: c.red, marginTop: 12 }]}>
            {error}
          </Text>
        ) : null}

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            { marginTop: 16 },
            loading && styles.buttonDisabled,
          ]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#7c3aed', '#a855f7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <View style={styles.buttonContent}>
                <Send size={16} color="#ffffff" />
                <Text style={styles.primaryButtonText}>Отправить заявку</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ===== SUCCESS MODE =====
  const renderSuccess = () => (
    <View style={[styles.modeContainer, styles.successContainer]}>
      {/* Green glow */}
      <View
        style={[
          styles.successGlow,
          {
            backgroundColor: dark
              ? 'rgba(34,197,94,0.2)'
              : 'rgba(34,197,94,0.15)',
          },
        ]}
      />
      <View
        style={[
          styles.successIcon,
          {
            backgroundColor: dark
              ? 'rgba(34,197,94,0.2)'
              : 'rgba(34,197,94,0.15)',
          },
        ]}
      >
        <CheckSquare size={36} color={dark ? '#4ade80' : '#16a34a'} />
      </View>

      <Text style={[styles.successTitle, { color: textColor }]}>
        Заявка отправлена!
      </Text>
      <Text style={[styles.successText, { color: textSecondary }]}>
        Администратор рассмотрит вашу заявку.{'\n'}После одобрения войдите с
        указанным номером и паролем.
      </Text>

      <TouchableOpacity
        style={[styles.primaryButton, { marginTop: 32, width: '100%' }]}
        onPress={goBack}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#16a34a', '#22c55e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientButton}
        >
          <View style={styles.buttonContent}>
            <LogIn size={16} color="#ffffff" />
            <Text style={styles.primaryButtonText}>Вернуться к входу</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Background blobs */}
        <View style={styles.blobContainer} pointerEvents="none">
          <View
            style={[
              styles.blobTop,
              {
                backgroundColor: dark
                  ? 'rgba(126,34,206,0.25)'
                  : 'rgba(192,132,252,0.25)',
              },
            ]}
          />
          <View
            style={[
              styles.blobBottom,
              {
                backgroundColor: dark
                  ? 'rgba(239,68,68,0.15)'
                  : 'rgba(252,165,165,0.2)',
              },
            ]}
          />
        </View>

        {/* Theme toggle */}
        <View style={styles.topBar}>
          {mode !== 'login' && (
            <TouchableOpacity
              style={[
                styles.topButton,
                {
                  backgroundColor: dark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(255,255,255,0.6)',
                },
              ]}
              onPress={goBack}
              activeOpacity={0.7}
            >
              <ArrowLeft size={18} color={textColor} />
              <Text style={[styles.backText, { color: textColor }]}>
                Назад
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.topSpacer} />
          <TouchableOpacity
            style={[
              styles.topButton,
              {
                backgroundColor: dark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(255,255,255,0.6)',
              },
            ]}
            onPress={toggle}
            activeOpacity={0.7}
          >
            {dark ? (
              <Sun size={18} color={textColor} />
            ) : (
              <Moon size={18} color={textColor} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {mode === 'login' && renderLogin()}
          {mode === 'register' && renderRegister()}
          {mode === 'success' && renderSuccess()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  blobContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blobTop: {
    position: 'absolute',
    top: '-40%',
    left: '-30%',
    width: '80%',
    height: '80%',
    borderRadius: 9999,
    opacity: 0.8,
  },
  blobBottom: {
    position: 'absolute',
    bottom: '-30%',
    right: '-20%',
    width: '60%',
    height: '60%',
    borderRadius: 9999,
    opacity: 0.8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    zIndex: 20,
  },
  topSpacer: {
    flex: 1,
  },
  topButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  modeContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoGlow: {
    position: 'absolute',
    top: -10,
    width: 108,
    height: 108,
    borderRadius: 28,
    opacity: 0.6,
  },
  logoBox: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 20,
  },
  titleI: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  titleBorcuha: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 3,
    marginTop: 6,
  },

  // Card
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  glassCard: {
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#a855f7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  // Input
  inputContainer: {
    position: 'relative',
  },
  inputIconContainer: {
    position: 'absolute',
    left: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  input: {
    width: '100%',
    paddingLeft: 42,
    paddingRight: 44,
    paddingVertical: Platform.OS === 'ios' ? 14 : 11,
    borderRadius: 14,
    fontSize: 15,
    borderWidth: 1,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  // Primary button
  primaryButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  gradientButton: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },

  // Register CTA
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 4,
    overflow: 'hidden',
  },
  registerButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Demo
  demoSection: {
    marginTop: 20,
  },
  demoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  demoToggleText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
  },
  demoButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  demoButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  demoEmoji: {
    fontSize: 20,
  },
  demoLabel: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Sport tags
  sportTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  sportTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  sportTagText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Register form
  regHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  regIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  regTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  regSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  separator: {
    height: 1,
    marginVertical: 16,
  },

  // Picker
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 42,
    paddingRight: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  pickerText: {
    fontSize: 15,
    flex: 1,
  },
  pickerDropdown: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  pickerOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Consent
  consentButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  consentText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },

  // Error
  errorBlock: {
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 12,
    textAlign: 'center',
  },
  waButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  waButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Success
  successContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successGlow: {
    position: 'absolute',
    top: 10,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.5,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
});
