/**
 * LoginScreen — редизайн в стиле iOS 26 Liquid Glass
 *
 * - AmbientBackground с плавающими блобами
 * - LiquidGlassCard как контейнер формы
 * - GlowButton для primary CTA
 * - Анимированные переходы между Login/Register
 * - Haptic feedback
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Dimensions,
} from 'react-native';
import Animated, {
  FadeIn, FadeOut, FadeInDown, FadeInUp, Layout,
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Eye, EyeOff, Phone, Lock, User, Building2, MapPin, Send, ArrowLeft, LogIn, UserPlus, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LiquidGlassCard, GlowButton, HapticPressable, AmbientBackground } from '../design';
import { colors, radius, spacing, typography, springs } from '../design/tokens';

const { width: W, height: H } = Dimensions.get('window');

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

export default function LoginScreen({ onLogin }) {
  const { dark } = useTheme();
  const { login } = useAuth();
  const [mode, setMode] = useState('login'); // login | register | success
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [clubName, setClubName] = useState('');
  const [city, setCity] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const logoRotate = useSharedValue(0);

  React.useEffect(() => {
    logoRotate.value = withRepeat(
      withTiming(1, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(logoRotate.value, [0, 1], [0, 360])}deg` }],
  }));

  const handleLogin = async () => {
    setError('');
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 11) { setError('Введите полный номер телефона'); return; }
    if (!password) { setError('Введите пароль'); return; }
    setLoading(true);
    try {
      await login(digits, password);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      if (onLogin) onLogin();
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      setError(err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (p, pw) => {
    setError(''); setLoading(true);
    try {
      await login(p, pw);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      if (onLogin) onLogin();
    } catch (err) { setError(err.message || 'Ошибка'); }
    finally { setLoading(false); }
  };

  const theme = dark ? colors.dark : colors.light;

  const inputStyle = {
    backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)',
    borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingLeft: 48,
    color: theme.text,
    fontSize: 16,
    fontWeight: '500',
  };

  const iconColor = dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AmbientBackground dark={dark} variant="fire" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 80, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Логотип + заголовок */}
          <Animated.View
            entering={FadeInDown.springify().damping(15).mass(0.8)}
            style={{ alignItems: 'center', marginBottom: 40 }}
          >
            {/* Logo glow */}
            <View style={{ position: 'relative', marginBottom: 24 }}>
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    width: 100, height: 100, borderRadius: 50,
                    top: 0, left: 0,
                  },
                  logoStyle,
                ]}
              >
                <LinearGradient
                  colors={['#dc2626', '#f97316', '#fbbf24', '#dc2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1, borderRadius: 50, opacity: 0.7 }}
                />
              </Animated.View>
              <View
                style={{
                  width: 100, height: 100, borderRadius: 50,
                  alignItems: 'center', justifyContent: 'center',
                  shadowColor: '#dc2626', shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.5, shadowRadius: 24, elevation: 12,
                }}
              >
                <LinearGradient
                  colors={colors.gradients.brand}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 48, fontWeight: '900', color: '#fff', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}>iB</Text>
                </LinearGradient>
              </View>
            </View>

            <Text style={{ ...typography.hero, color: theme.text, marginBottom: 6 }}>iBorcuha</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 3, color: theme.textTertiary, textTransform: 'uppercase' }}>
              Платформа для тренеров
            </Text>
          </Animated.View>

          {/* Ошибка */}
          {!!error && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              style={{ marginBottom: 12 }}
            >
              <LiquidGlassCard dark={dark} radius={radius.md} padding={14} tintColor="rgba(239,68,68,0.15)">
                <Text style={{ color: dark ? '#fca5a5' : '#b91c1c', fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
                  {error}
                </Text>
              </LiquidGlassCard>
            </Animated.View>
          )}

          {mode === 'login' && (
            <Animated.View entering={FadeInUp.springify().damping(15)} layout={Layout.springify()}>
              <LiquidGlassCard dark={dark} radius={radius.xxl} padding={24}>
                <Text style={{ ...typography.title2, color: theme.text, marginBottom: 20 }}>Вход</Text>

                {/* Phone input */}
                <View style={{ marginBottom: 14, position: 'relative' }}>
                  <View style={{ position: 'absolute', left: 16, top: 14, zIndex: 10 }}>
                    <Phone size={20} color={iconColor} strokeWidth={2} />
                  </View>
                  <TextInput
                    value={phone}
                    onChangeText={(v) => setPhone(formatPhone(v))}
                    placeholder="8 (900) 123-45-67"
                    placeholderTextColor={theme.textQuaternary}
                    keyboardType="phone-pad"
                    style={inputStyle}
                  />
                </View>

                {/* Password input */}
                <View style={{ marginBottom: 20, position: 'relative' }}>
                  <View style={{ position: 'absolute', left: 16, top: 14, zIndex: 10 }}>
                    <Lock size={20} color={iconColor} strokeWidth={2} />
                  </View>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Пароль"
                    placeholderTextColor={theme.textQuaternary}
                    secureTextEntry={!showPw}
                    style={inputStyle}
                  />
                  <HapticPressable
                    haptic="selection"
                    onPress={() => setShowPw(!showPw)}
                    style={{ position: 'absolute', right: 12, top: 12, padding: 6 }}
                  >
                    {showPw ? <EyeOff size={20} color={iconColor} /> : <Eye size={20} color={iconColor} />}
                  </HapticPressable>
                </View>

                <GlowButton
                  title={loading ? 'Вход...' : 'Войти'}
                  onPress={handleLogin}
                  disabled={loading}
                  icon={<LogIn size={20} color="#fff" strokeWidth={2.5} />}
                  gradient={colors.gradients.brand}
                  haptic="medium"
                />

                <HapticPressable
                  onPress={() => { setMode('register'); setError(''); }}
                  haptic="light"
                  style={{ marginTop: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', paddingVertical: 10 }}
                >
                  <UserPlus size={16} color={theme.textSecondary} />
                  <Text style={{ marginLeft: 8, color: theme.textSecondary, fontSize: 14, fontWeight: '600' }}>
                    Я тренер — регистрация
                  </Text>
                </HapticPressable>
              </LiquidGlassCard>

              {/* Demo */}
              <View style={{ marginTop: 16 }}>
                <Text style={{ ...typography.caption, color: theme.textTertiary, textAlign: 'center', marginBottom: 10, textTransform: 'uppercase' }}>
                  Демо-доступ
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <HapticPressable
                    style={{ flex: 1 }}
                    haptic="medium"
                    onPress={() => handleDemo('89999999999', 'demo123')}
                  >
                    <LiquidGlassCard dark={dark} radius={radius.md} padding={16}>
                      <Text style={{ fontSize: 28, textAlign: 'center', marginBottom: 4 }}>🥋</Text>
                      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13, textAlign: 'center' }}>Тренер</Text>
                    </LiquidGlassCard>
                  </HapticPressable>
                  <HapticPressable
                    style={{ flex: 1 }}
                    haptic="medium"
                    onPress={() => handleDemo('89990000001', 'demo123')}
                  >
                    <LiquidGlassCard dark={dark} radius={radius.md} padding={16}>
                      <Text style={{ fontSize: 28, textAlign: 'center', marginBottom: 4 }}>🤼</Text>
                      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13, textAlign: 'center' }}>Спортсмен</Text>
                    </LiquidGlassCard>
                  </HapticPressable>
                </View>
              </View>
            </Animated.View>
          )}

          {mode === 'register' && (
            <Animated.View entering={FadeInUp.springify().damping(15)} exiting={FadeOut.duration(200)}>
              <LiquidGlassCard dark={dark} radius={radius.xxl} padding={24}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                  <HapticPressable onPress={() => { setMode('login'); setError(''); }} haptic="selection" style={{ padding: 4, marginRight: 8 }}>
                    <ArrowLeft size={22} color={theme.text} />
                  </HapticPressable>
                  <Text style={{ ...typography.title2, color: theme.text }}>Регистрация тренера</Text>
                </View>

                <InputRow icon={<User size={20} color={iconColor} />} value={name} onChangeText={setName} placeholder="ФИО" theme={theme} inputStyle={inputStyle} />
                <InputRow icon={<Phone size={20} color={iconColor} />} value={phone} onChangeText={(v) => setPhone(formatPhone(v))} placeholder="8 (900) 123-45-67" theme={theme} inputStyle={inputStyle} keyboardType="phone-pad" />
                <InputRow icon={<Lock size={20} color={iconColor} />} value={password} onChangeText={setPassword} placeholder="Пароль (мин. 6 символов)" theme={theme} inputStyle={inputStyle} secureTextEntry />
                <InputRow icon={<Building2 size={20} color={iconColor} />} value={clubName} onChangeText={setClubName} placeholder="Название клуба" theme={theme} inputStyle={inputStyle} />
                <InputRow icon={<MapPin size={20} color={iconColor} />} value={city} onChangeText={setCity} placeholder="Город" theme={theme} inputStyle={inputStyle} />

                <GlowButton
                  title="Отправить заявку"
                  icon={<Send size={18} color="#fff" strokeWidth={2.5} />}
                  gradient={colors.gradients.brand}
                  onPress={() => setMode('success')}
                  haptic="medium"
                />
              </LiquidGlassCard>
            </Animated.View>
          )}

          {mode === 'success' && (
            <Animated.View entering={FadeIn.duration(400)}>
              <LiquidGlassCard dark={dark} radius={radius.xxl} padding={32}>
                <View style={{ alignItems: 'center' }}>
                  <View style={{ marginBottom: 20 }}>
                    <LinearGradient
                      colors={['#22c55e', '#10b981']}
                      style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <CheckCircle2 size={48} color="#fff" strokeWidth={2.5} />
                    </LinearGradient>
                  </View>
                  <Text style={{ ...typography.title1, color: theme.text, marginBottom: 10, textAlign: 'center' }}>
                    Заявка отправлена!
                  </Text>
                  <Text style={{ color: theme.textSecondary, textAlign: 'center', fontSize: 15, marginBottom: 24, lineHeight: 22 }}>
                    Мы свяжемся с вами в ближайшее время после одобрения администратором.
                  </Text>
                  <GlowButton
                    title="Вернуться к входу"
                    onPress={() => setMode('login')}
                    variant="secondary"
                    dark={dark}
                  />
                </View>
              </LiquidGlassCard>
            </Animated.View>
          )}

          {/* Теги видов спорта */}
          <Animated.View
            entering={FadeIn.delay(300)}
            style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 24 }}
          >
            {['BJJ', 'MMA', 'Самбо', 'Дзюдо', 'Грэпплинг'].map((t, i) => (
              <Animated.View key={t} entering={FadeInDown.delay(400 + i * 60)}>
                <View style={{
                  paddingHorizontal: 12, paddingVertical: 6,
                  borderRadius: radius.pill,
                  backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
                  borderWidth: 1,
                  borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, letterSpacing: 0.5 }}>{t}</Text>
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function InputRow({ icon, value, onChangeText, placeholder, theme, inputStyle, secureTextEntry, keyboardType }) {
  return (
    <View style={{ marginBottom: 12, position: 'relative' }}>
      <View style={{ position: 'absolute', left: 16, top: 14, zIndex: 10 }}>{icon}</View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textQuaternary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        style={inputStyle}
      />
    </View>
  );
}
