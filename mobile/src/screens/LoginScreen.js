import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

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
  const { dark, t } = useTheme();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 11) { setError('Введите полный номер телефона'); return; }
    if (!password) { setError('Введите пароль'); return; }
    setLoading(true);
    try {
      await login(digits, password);
      if (onLogin) onLogin();
    } catch (err) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoPhone, demoPw) => {
    setError(''); setLoading(true);
    try {
      await login(demoPhone, demoPw);
      if (onLogin) onLogin();
    } catch (err) { setError(err.message || 'Ошибка'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: t.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={[styles.logoBox, { backgroundColor: t.accent + '30' }]}>
            <Text style={styles.logoEmoji}>🥋</Text>
          </View>
          <Text style={styles.logoTitle}>
            <Text style={{ color: t.textMuted }}>i</Text>
            <Text style={{ color: t.accent }}>Borcuha</Text>
          </Text>
          <Text style={[styles.logoSub, { color: t.textMuted }]}>
            ПЛАТФОРМА ДЛЯ ЕДИНОБОРСТВ
          </Text>
        </View>

        {/* Login card */}
        <View style={[styles.card, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
          <TextInput
            style={[styles.input, { backgroundColor: t.input, borderColor: t.inputBorder, color: t.text }]}
            placeholder="8 (900) 123-45-67"
            placeholderTextColor={t.textMuted}
            value={phone}
            onChangeText={v => setPhone(formatPhone(v))}
            keyboardType="phone-pad"
            maxLength={18}
          />

          <View>
            <TextInput
              style={[styles.input, { backgroundColor: t.input, borderColor: t.inputBorder, color: t.text }]}
              placeholder="Пароль"
              placeholderTextColor={t.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPw(!showPw)}
            >
              <Text style={{ color: t.textMuted, fontSize: 16 }}>
                {showPw ? '🙈' : '👁'}
              </Text>
            </TouchableOpacity>
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.loginBtn, { opacity: loading ? 0.6 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Войти</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Demo */}
        <Text style={[styles.demoLabel, { color: t.textMuted }]}>ДЕМО-ДОСТУП</Text>
        <View style={styles.demoRow}>
          <TouchableOpacity
            style={[styles.demoBtn, { backgroundColor: '#3b82f620', borderColor: '#3b82f630' }]}
            onPress={() => handleDemoLogin('89999999999', 'demo123')}
            disabled={loading}
          >
            <Text style={styles.demoEmoji}>🥋</Text>
            <Text style={[styles.demoBtnText, { color: '#60a5fa' }]}>Тренер</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.demoBtn, { backgroundColor: '#22c55e20', borderColor: '#22c55e30' }]}
            onPress={() => handleDemoLogin('89990000001', 'demo123')}
            disabled={loading}
          >
            <Text style={styles.demoEmoji}>🤼</Text>
            <Text style={[styles.demoBtnText, { color: '#4ade80' }]}>Спортсмен</Text>
          </TouchableOpacity>
        </View>

        {/* Sport tags */}
        <View style={styles.tags}>
          {['BJJ', 'MMA', 'Самбо', 'Дзюдо', 'Грэпплинг'].map(s => (
            <View key={s} style={[styles.tag, { backgroundColor: t.tabActive }]}>
              <Text style={[styles.tagText, { color: t.textMuted }]}>{s}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoBox: { width: 80, height: 80, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoEmoji: { fontSize: 40 },
  logoTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  logoSub: { fontSize: 10, letterSpacing: 3, marginTop: 4, fontWeight: '600' },
  card: { borderRadius: 22, borderWidth: 1, padding: 18, gap: 12 },
  input: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  eyeBtn: { position: 'absolute', right: 14, top: 14 },
  error: { color: '#ef4444', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  loginBtn: {
    borderRadius: 14, paddingVertical: 15, alignItems: 'center',
    backgroundColor: '#7c3aed',
  },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  demoLabel: { textAlign: 'center', fontSize: 10, letterSpacing: 3, fontWeight: '600', marginTop: 24, marginBottom: 10 },
  demoRow: { flexDirection: 'row', gap: 10 },
  demoBtn: {
    flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 14,
    alignItems: 'center', gap: 4,
  },
  demoEmoji: { fontSize: 22 },
  demoBtnText: { fontSize: 12, fontWeight: '700' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 24 },
  tag: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 10, fontWeight: '600' },
});
