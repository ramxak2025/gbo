/**
 * LoginScreen — 1-в-1 копия PWA Login.jsx
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable,
  KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator, Linking,
} from 'react-native';
import { Eye, EyeOff, Phone, Lock, LogIn, UserPlus, ArrowLeft, User, Building2, MapPin, Dumbbell, Send, CheckSquare, Square, ChevronDown, ChevronUp, MessageCircle, Sun, Moon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { formatPhone, cleanPhone } from '../components/PhoneInput';

const { width: W } = Dimensions.get('window');

const SPORT_TYPES = [
  { id: 'bjj', label: 'BJJ' }, { id: 'mma', label: 'MMA' }, { id: 'boxing', label: 'Бокс' },
  { id: 'wrestling', label: 'Борьба' }, { id: 'judo', label: 'Дзюдо' }, { id: 'karate', label: 'Карате' },
  { id: 'kickboxing', label: 'Кикбоксинг' }, { id: 'muaythai', label: 'Муай-тай' },
  { id: 'grappling', label: 'Грэпплинг' }, { id: 'other', label: 'Другое' },
];

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
  const [reg, setReg] = useState({ name: '', phone: '', password: '', clubName: '', sportType: '', city: '', consent: false });

  const bg = dark ? '#050505' : '#f5f5f7';
  const textPrimary = dark ? '#fff' : '#111';
  const textMuted = dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.40)';
  const inputBg = dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.80)';
  const inputBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.60)';
  const cardBg = dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.80)';
  const cardBorder = dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.60)';

  const inputStyle = {
    backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, paddingLeft: 44,
    color: textPrimary, fontSize: 15,
  };

  const handleLogin = async () => {
    setError(''); setErrorType(null);
    const digits = cleanPhone(phone);
    if (digits.length < 11) { setError('Введите полный номер телефона'); return; }
    if (!password) { setError('Введите пароль'); return; }
    setLoading(true);
    try { await login(digits, password); if (onLogin) onLogin(); }
    catch (err) { setError(err.message || 'Ошибка входа'); setErrorType(err.errorType || null); }
    finally { setLoading(false); }
  };

  const handleDemo = async (p, pw) => {
    setError(''); setErrorType(null); setLoading(true);
    try { await login(p, pw); if (onLogin) onLogin(); }
    catch (err) { setError(err.message || 'Ошибка'); }
    finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Background blobs */}
      <View style={{ position: 'absolute', top: '-40%', left: '-30%', width: '80%', height: '80%', borderRadius: 9999, opacity: dark ? 0.3 : 0.4, backgroundColor: dark ? '#581c87' : '#e9d5ff' }} />
      <View style={{ position: 'absolute', bottom: '-30%', right: '-20%', width: '60%', height: '60%', borderRadius: 9999, opacity: dark ? 0.2 : 0.3, backgroundColor: dark ? '#7f1d1d' : '#fecaca' }} />

      {/* Theme toggle */}
      <Pressable onPress={toggle} style={{ position: 'absolute', right: 20, top: insets.top + 16, zIndex: 20, padding: 10, borderRadius: 12, backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.60)' }}>
        {dark ? <Sun size={18} color="rgba(255,255,255,0.6)" /> : <Moon size={18} color="rgba(0,0,0,0.5)" />}
      </Pressable>

      {/* Back for register/success */}
      {mode !== 'login' && (
        <Pressable onPress={() => { setMode('login'); setError(''); }} style={{ position: 'absolute', left: 20, top: insets.top + 16, zIndex: 20, flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 12 }}>
          <ArrowLeft size={18} color={textPrimary} />
          <Text style={{ fontSize: 14, fontWeight: '500', color: textPrimary, marginLeft: 4 }}>Назад</Text>
        </Pressable>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 24, paddingTop: insets.top + 60 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ maxWidth: 400, width: '100%', alignSelf: 'center' }}>

            {/* === LOGIN === */}
            {mode === 'login' && (
              <>
                {/* Logo */}
                <View style={{ alignItems: 'center', marginBottom: 32 }}>
                  <View style={{ width: 88, height: 88, borderRadius: 24, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 24 }}>
                    <Text style={{ fontSize: 40, fontWeight: '900', color: '#fff' }}>iB</Text>
                  </View>
                  <Text style={{ fontSize: 30, fontWeight: '900', letterSpacing: -1, marginTop: 20, color: textPrimary }}>
                    <Text style={{ color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }}>i</Text>
                    <Text style={{ color: '#8b5cf6' }}>Borcuha</Text>
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: '500', letterSpacing: 3, marginTop: 4, color: dark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.40)', textTransform: 'uppercase' }}>
                    Платформа для единоборств
                  </Text>
                </View>

                {/* Login card */}
                <View style={{ borderRadius: 24, padding: 20, marginBottom: 16, backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}>
                  {/* Phone */}
                  <View style={{ marginBottom: 12, position: 'relative' }}>
                    <View style={{ position: 'absolute', left: 14, top: 14, zIndex: 1 }}>
                      <Phone size={16} color={textMuted} />
                    </View>
                    <TextInput value={phone} onChangeText={v => setPhone(formatPhone(v))} placeholder="8 (900) 123-45-67" placeholderTextColor={textMuted} keyboardType="phone-pad" maxLength={18} style={inputStyle} />
                  </View>

                  {/* Password */}
                  <View style={{ marginBottom: 12, position: 'relative' }}>
                    <View style={{ position: 'absolute', left: 14, top: 14, zIndex: 1 }}>
                      <Lock size={16} color={textMuted} />
                    </View>
                    <TextInput value={password} onChangeText={setPassword} placeholder="Пароль" placeholderTextColor={textMuted} secureTextEntry={!showPw} style={inputStyle} />
                    <Pressable onPress={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: 12, padding: 4 }}>
                      {showPw ? <EyeOff size={16} color={textMuted} /> : <Eye size={16} color={textMuted} />}
                    </Pressable>
                  </View>

                  {/* Error */}
                  {!!error && (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={{ color: '#dc2626', fontSize: 14, fontWeight: '500', textAlign: 'center' }}>{error}</Text>
                      {errorType === 'student' && <Text style={{ color: textMuted, fontSize: 12, textAlign: 'center', marginTop: 4 }}>Обратитесь к тренеру за паролем</Text>}
                      {errorType === 'trainer' && (
                        <Pressable onPress={() => Linking.openURL('https://wa.me/89884444436')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#16a34a', alignSelf: 'center' }}>
                          <MessageCircle size={16} color="#fff" />
                          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>8-988-444-44-36</Text>
                        </Pressable>
                      )}
                    </View>
                  )}

                  {/* Login button */}
                  <Pressable onPress={handleLogin} disabled={loading} style={({ pressed }) => ({ backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.5 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.96 : 1 }], shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16 })}>
                    {loading ? <ActivityIndicator size="small" color="#fff" /> : <><LogIn size={18} color="#fff" /><Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Войти</Text></>}
                  </Pressable>
                </View>

                {/* Register CTA */}
                <Pressable onPress={() => { setMode('register'); setError(''); }} style={({ pressed }) => ({ paddingVertical: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.60)', borderWidth: 1, borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', opacity: pressed ? 0.7 : 1 })}>
                  <UserPlus size={15} color={dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }}>Я тренер — хочу зарегистрироваться</Text>
                </Pressable>

                {/* Demo */}
                <View style={{ marginTop: 20 }}>
                  <Pressable onPress={() => setShowDemo(!showDemo)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 2, color: dark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.40)', textTransform: 'uppercase' }}>Демо-доступ</Text>
                    {showDemo ? <ChevronUp size={14} color={textMuted} /> : <ChevronDown size={14} color={textMuted} />}
                  </Pressable>
                  {showDemo && (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <Pressable onPress={() => handleDemo('89999999999', 'demo123')} disabled={loading} style={({ pressed }) => ({ flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center', gap: 4, backgroundColor: dark ? 'rgba(59,130,246,0.10)' : '#eff6ff', borderWidth: 1, borderColor: dark ? 'rgba(59,130,246,0.15)' : '#bfdbfe', opacity: pressed ? 0.7 : 1 })}>
                        <Text style={{ fontSize: 22 }}>🥋</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: dark ? '#60a5fa' : '#2563eb' }}>Тренер</Text>
                      </Pressable>
                      <Pressable onPress={() => handleDemo('89990000001', 'demo123')} disabled={loading} style={({ pressed }) => ({ flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center', gap: 4, backgroundColor: dark ? 'rgba(34,197,94,0.10)' : '#f0fdf4', borderWidth: 1, borderColor: dark ? 'rgba(34,197,94,0.15)' : '#bbf7d0', opacity: pressed ? 0.7 : 1 })}>
                        <Text style={{ fontSize: 22 }}>🤼</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: dark ? '#4ade80' : '#16a34a' }}>Спортсмен</Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                {/* Sport tags */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 20 }}>
                  {['BJJ', 'MMA', 'Самбо', 'Дзюдо', 'Грэпплинг'].map(tag => (
                    <View key={tag} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.60)', borderWidth: 1, borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.40)' }}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* === REGISTER === */}
            {mode === 'register' && (
              <View style={{ borderRadius: 24, padding: 20, backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: textPrimary, marginBottom: 16 }}>Регистрация тренера</Text>
                {[
                  { icon: User, value: reg.name, key: 'name', placeholder: 'ФИО' },
                  { icon: Phone, value: reg.phone, key: 'phone', placeholder: '8 (900) 123-45-67', keyboardType: 'phone-pad' },
                  { icon: Lock, value: reg.password, key: 'password', placeholder: 'Пароль (мин. 4 символа)', secure: true },
                  { icon: Building2, value: reg.clubName, key: 'clubName', placeholder: 'Название клуба' },
                  { icon: MapPin, value: reg.city, key: 'city', placeholder: 'Город' },
                ].map(({ icon: Icon, value, key, placeholder, keyboardType, secure }) => (
                  <View key={key} style={{ marginBottom: 12, position: 'relative' }}>
                    <View style={{ position: 'absolute', left: 14, top: 14, zIndex: 1 }}><Icon size={16} color={textMuted} /></View>
                    <TextInput
                      value={value}
                      onChangeText={v => setReg(r => ({ ...r, [key]: key === 'phone' ? formatPhone(v) : v }))}
                      placeholder={placeholder}
                      placeholderTextColor={textMuted}
                      keyboardType={keyboardType}
                      secureTextEntry={secure}
                      style={inputStyle}
                    />
                  </View>
                ))}

                {/* Consent */}
                <Pressable onPress={() => setReg(r => ({ ...r, consent: !r.consent }))} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
                  {reg.consent ? <CheckSquare size={20} color="#8b5cf6" /> : <Square size={20} color={textMuted} />}
                  <Text style={{ flex: 1, fontSize: 12, color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', lineHeight: 18 }}>Даю согласие на обработку персональных данных</Text>
                </Pressable>

                {!!error && <Text style={{ color: '#dc2626', fontSize: 14, textAlign: 'center', marginBottom: 12 }}>{error}</Text>}

                <Pressable onPress={() => setMode('success')} disabled={loading} style={({ pressed }) => ({ backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed ? 0.85 : 1 })}>
                  <Send size={16} color="#fff" /><Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Отправить заявку</Text>
                </Pressable>
              </View>
            )}

            {/* === SUCCESS === */}
            {mode === 'success' && (
              <View style={{ alignItems: 'center', padding: 32 }}>
                <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <CheckSquare size={32} color="#fff" />
                </View>
                <Text style={{ fontSize: 22, fontWeight: '800', color: textPrimary, marginBottom: 8, textAlign: 'center' }}>Заявка отправлена!</Text>
                <Text style={{ fontSize: 14, color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>Ожидайте одобрения администратора. Мы свяжемся с вами.</Text>
                <Pressable onPress={() => setMode('login')} style={({ pressed }) => ({ paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14, backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', opacity: pressed ? 0.7 : 1 })}>
                  <Text style={{ color: textPrimary, fontWeight: '600' }}>Вернуться к входу</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
