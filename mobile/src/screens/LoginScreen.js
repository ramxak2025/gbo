/**
 * LoginScreen — iOS 26 Liquid Glass modern design
 * Gradient hero, glass cards, blur effects, haptic feedback
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, KeyboardAvoidingView,
  Platform, Dimensions, ActivityIndicator, Linking, Alert, Animated as RNAnimated,
  Keyboard, StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Eye, EyeOff, Phone, Lock, LogIn, UserPlus, ArrowLeft, User, Building2, MapPin, Send, CheckSquare, Square, ChevronDown, ChevronUp, MessageCircle, Sun, Moon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { formatPhone, cleanPhone } from '../components/PhoneInput';

const { width: W } = Dimensions.get('window');

export default function LoginScreen({ onLogin }) {
  const { dark, toggle } = useTheme();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [reg, setReg] = useState({ name: '', phone: '', password: '', clubName: '', city: '', consent: false });

  // Entrance animation
  const fadeAnim = useState(new RNAnimated.Value(0))[0];
  const slideAnim = useState(new RNAnimated.Value(30))[0];
  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      RNAnimated.spring(slideAnim, { toValue: 0, damping: 15, stiffness: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  const bg = dark ? '#050505' : '#f5f5f7';
  const t = dark ? '#fff' : '#111';
  const t2 = dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)';
  const inputBg = dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.80)';
  const inputBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.60)';
  const inputStyle = { backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, paddingLeft: 44, color: t, fontSize: 15 };

  const handleLogin = async () => {
    setError(''); setErrorType(null);
    const digits = cleanPhone(phone);
    if (digits.length < 11) { setError('Введите полный номер телефона'); return; }
    if (!password) { setError('Введите пароль'); return; }
    setLoading(true);
    try {
      await login(digits, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (onLogin) onLogin();
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setError(err.message || 'Ошибка входа');
      setErrorType(err.errorType || null);
    } finally { setLoading(false); }
  };

  const handleDemo = async (p, pw) => {
    setError(''); setErrorType(null); setLoading(true);
    try {
      await login(p, pw);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (onLogin) onLogin();
    } catch (err) { setError(err.message || 'Ошибка'); }
    finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Atmospheric blobs */}
      <View style={{ position: 'absolute', top: '-35%', left: '-25%', width: W * 0.8, height: W * 0.8, borderRadius: W, backgroundColor: dark ? 'rgba(88,28,135,0.25)' : 'rgba(233,213,255,0.40)' }} />
      <View style={{ position: 'absolute', bottom: '-25%', right: '-15%', width: W * 0.65, height: W * 0.65, borderRadius: W, backgroundColor: dark ? 'rgba(127,29,29,0.20)' : 'rgba(254,202,202,0.30)' }} />
      <View style={{ position: 'absolute', top: '40%', right: '-10%', width: W * 0.5, height: W * 0.5, borderRadius: W, backgroundColor: dark ? 'rgba(99,102,241,0.12)' : 'rgba(165,180,252,0.20)' }} />

      {/* Theme toggle */}
      <Pressable onPress={() => { toggle(); Haptics.selectionAsync().catch(() => {}); }} style={{ position: 'absolute', right: 20, top: insets.top + 16, zIndex: 20, padding: 10, borderRadius: 12, backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.60)' }}>
        {dark ? <Sun size={18} color="rgba(255,255,255,0.6)" /> : <Moon size={18} color="rgba(0,0,0,0.5)" />}
      </Pressable>

      {mode !== 'login' && (
        <Pressable onPress={() => { setMode('login'); setError(''); }} style={{ position: 'absolute', left: 20, top: insets.top + 16, zIndex: 20, flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 12 }}>
          <ArrowLeft size={18} color={t} /><Text style={{ fontSize: 14, fontWeight: '500', color: t, marginLeft: 4 }}>Назад</Text>
        </Pressable>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 24, paddingTop: insets.top + 60 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} onScrollBeginDrag={Keyboard.dismiss}>
          <RNAnimated.View style={{ maxWidth: 400, width: '100%', alignSelf: 'center', opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {mode === 'login' && (
              <>
                {/* Logo with gradient glow */}
                <View style={{ alignItems: 'center', marginBottom: 36 }}>
                  <View style={{ position: 'relative' }}>
                    <View style={{ position: 'absolute', top: -8, left: -8, right: -8, bottom: -8, borderRadius: 32, backgroundColor: dark ? 'rgba(139,92,246,0.30)' : 'rgba(139,92,246,0.15)' }} />
                    <LinearGradient
                      colors={['#7c3aed', '#6366f1', '#4f46e5']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={{ width: 88, height: 88, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 12 }}
                    >
                      <Text style={{ fontSize: 40, fontWeight: '900', color: '#fff', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}>iB</Text>
                    </LinearGradient>
                  </View>
                  <Text style={{ fontSize: 30, fontWeight: '900', letterSpacing: -1, marginTop: 20, color: t }}>
                    <Text style={{ color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }}>i</Text>
                    <Text style={{ color: '#8b5cf6' }}>Borcuha</Text>
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: '500', letterSpacing: 3, marginTop: 4, color: dark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.40)', textTransform: 'uppercase' }}>
                    Платформа для единоборств
                  </Text>
                </View>

                {/* Login card with glass */}
                <View style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 16 }}>
                  <BlurView intensity={dark ? 40 : 20} tint={dark ? 'dark' : 'light'} style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]} />
                  <View style={[StyleSheet.absoluteFillObject, { backgroundColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.80)', borderRadius: 24 }]} />
                  <View style={[StyleSheet.absoluteFillObject, { borderRadius: 24, borderWidth: 1, borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.60)' }]} pointerEvents="none" />
                  <View style={{ padding: 20, zIndex: 1 }}>
                    {/* Phone */}
                    <View style={{ marginBottom: 12, position: 'relative' }}>
                      <View style={{ position: 'absolute', left: 14, top: 14, zIndex: 1 }}><Phone size={16} color={t2} /></View>
                      <TextInput value={phone} onChangeText={v => setPhone(formatPhone(v))} placeholder="8 (900) 123-45-67" placeholderTextColor={t2} keyboardType="phone-pad" maxLength={18} style={inputStyle} />
                    </View>
                    {/* Password */}
                    <View style={{ marginBottom: 12, position: 'relative' }}>
                      <View style={{ position: 'absolute', left: 14, top: 14, zIndex: 1 }}><Lock size={16} color={t2} /></View>
                      <TextInput value={password} onChangeText={setPassword} placeholder="Пароль" placeholderTextColor={t2} secureTextEntry={!showPw} style={inputStyle} />
                      <Pressable onPress={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: 12, padding: 4 }}>
                        {showPw ? <EyeOff size={16} color={t2} /> : <Eye size={16} color={t2} />}
                      </Pressable>
                    </View>

                    {/* Error */}
                    {!!error && (
                      <View style={{ marginBottom: 12, padding: 10, borderRadius: 12, backgroundColor: 'rgba(220,38,38,0.10)' }}>
                        <Text style={{ color: '#dc2626', fontSize: 14, fontWeight: '500', textAlign: 'center' }}>{error}</Text>
                        {errorType === 'student' && <Text style={{ color: t2, fontSize: 12, textAlign: 'center', marginTop: 4 }}>Обратитесь к тренеру за паролем</Text>}
                        {errorType === 'trainer' && (
                          <Pressable onPress={() => Linking.openURL('https://wa.me/89884444436')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#16a34a', alignSelf: 'center' }}>
                            <MessageCircle size={16} color="#fff" /><Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>8-988-444-44-36</Text>
                          </Pressable>
                        )}
                      </View>
                    )}

                    {/* Login button — gradient */}
                    <Pressable onPress={handleLogin} disabled={loading} style={({ pressed }) => ({ borderRadius: 14, overflow: 'hidden', opacity: loading ? 0.5 : pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
                      <LinearGradient colors={['#7c3aed', '#6366f1', '#4f46e5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 }}>
                        {loading ? <ActivityIndicator size="small" color="#fff" /> : <><LogIn size={18} color="#fff" /><Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Войти</Text></>}
                      </LinearGradient>
                    </Pressable>
                  </View>
                </View>

                {/* Register CTA */}
                <Pressable onPress={() => { setMode('register'); setError(''); Haptics.selectionAsync().catch(() => {}); }} style={({ pressed }) => ({ paddingVertical: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.60)', borderWidth: 1, borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', opacity: pressed ? 0.7 : 1 })}>
                  <UserPlus size={15} color={dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }}>Я тренер — хочу зарегистрироваться</Text>
                </Pressable>

                {/* Demo */}
                <View style={{ marginTop: 20 }}>
                  <Pressable onPress={() => { setShowDemo(!showDemo); Haptics.selectionAsync().catch(() => {}); }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 2, color: dark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.40)', textTransform: 'uppercase' }}>Демо-доступ</Text>
                    {showDemo ? <ChevronUp size={14} color={t2} /> : <ChevronDown size={14} color={t2} />}
                  </Pressable>
                  {showDemo && (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <Pressable onPress={() => handleDemo('89999999999', 'demo123')} disabled={loading} style={({ pressed }) => ({ flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', gap: 6, overflow: 'hidden', opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16, backgroundColor: dark ? 'rgba(59,130,246,0.10)' : '#eff6ff', borderWidth: 1, borderColor: dark ? 'rgba(59,130,246,0.15)' : '#bfdbfe' }} />
                        <Text style={{ fontSize: 24 }}>🥋</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: dark ? '#60a5fa' : '#2563eb' }}>Тренер</Text>
                      </Pressable>
                      <Pressable onPress={() => handleDemo('89990000001', 'demo123')} disabled={loading} style={({ pressed }) => ({ flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', gap: 6, overflow: 'hidden', opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16, backgroundColor: dark ? 'rgba(34,197,94,0.10)' : '#f0fdf4', borderWidth: 1, borderColor: dark ? 'rgba(34,197,94,0.15)' : '#bbf7d0' }} />
                        <Text style={{ fontSize: 24 }}>🤼</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: dark ? '#4ade80' : '#16a34a' }}>Спортсмен</Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                {/* Sport tags */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 24 }}>
                  {['BJJ', 'MMA', 'Самбо', 'Дзюдо', 'Грэпплинг'].map(tag => (
                    <View key={tag} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.60)', borderWidth: 1, borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.40)' }}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {mode === 'register' && (
              <View style={{ borderRadius: 24, overflow: 'hidden' }}>
                <BlurView intensity={40} tint={dark ? 'dark' : 'light'} style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]} />
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.80)' }]} />
                <View style={{ padding: 20, zIndex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: t, marginBottom: 16 }}>Регистрация тренера</Text>
                  {[
                    { icon: User, value: reg.name, key: 'name', placeholder: 'ФИО' },
                    { icon: Phone, value: reg.phone, key: 'phone', placeholder: '8 (900) 123-45-67', keyboardType: 'phone-pad' },
                    { icon: Lock, value: reg.password, key: 'password', placeholder: 'Пароль (мин. 4 символа)', secure: true },
                    { icon: Building2, value: reg.clubName, key: 'clubName', placeholder: 'Название клуба' },
                    { icon: MapPin, value: reg.city, key: 'city', placeholder: 'Город' },
                  ].map(({ icon: Icon, value, key, placeholder, keyboardType, secure }) => (
                    <View key={key} style={{ marginBottom: 12, position: 'relative' }}>
                      <View style={{ position: 'absolute', left: 14, top: 14, zIndex: 1 }}><Icon size={16} color={t2} /></View>
                      <TextInput value={value} onChangeText={v => setReg(r => ({ ...r, [key]: key === 'phone' ? formatPhone(v) : v }))} placeholder={placeholder} placeholderTextColor={t2} keyboardType={keyboardType} secureTextEntry={secure} style={inputStyle} />
                    </View>
                  ))}
                  <Pressable onPress={() => setReg(r => ({ ...r, consent: !r.consent }))} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
                    {reg.consent ? <CheckSquare size={20} color="#8b5cf6" /> : <Square size={20} color={t2} />}
                    <Text style={{ flex: 1, fontSize: 12, color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', lineHeight: 18 }}>Даю согласие на обработку персональных данных</Text>
                  </Pressable>
                  {!!error && <Text style={{ color: '#dc2626', fontSize: 14, textAlign: 'center', marginBottom: 12 }}>{error}</Text>}
                  <Pressable onPress={() => setMode('success')} style={({ pressed }) => ({ borderRadius: 14, overflow: 'hidden', opacity: pressed ? 0.9 : 1 })}>
                    <LinearGradient colors={['#7c3aed', '#6366f1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Send size={16} color="#fff" /><Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Отправить заявку</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}

            {mode === 'success' && (
              <View style={{ alignItems: 'center', padding: 32 }}>
                <LinearGradient colors={['#22c55e', '#10b981']} style={{ width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: '#22c55e', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 }}>
                  <CheckSquare size={32} color="#fff" />
                </LinearGradient>
                <Text style={{ fontSize: 22, fontWeight: '800', color: t, marginBottom: 8, textAlign: 'center' }}>Заявка отправлена!</Text>
                <Text style={{ fontSize: 14, color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>Ожидайте одобрения администратора.</Text>
                <Pressable onPress={() => setMode('login')} style={({ pressed }) => ({ paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14, backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', opacity: pressed ? 0.7 : 1 })}>
                  <Text style={{ color: t, fontWeight: '600' }}>Вернуться к входу</Text>
                </Pressable>
              </View>
            )}
          </RNAnimated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
