import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, Image, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import PhoneInput from '../components/PhoneInput';

export default function LoginScreen() {
  const { dark, colors } = useTheme();
  const { login } = useAuth();
  const [phone, setPhone] = useState('+7');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || phone.length < 12 || !password) {
      Alert.alert('Ошибка', 'Введите телефон и пароль');
      return;
    }
    setLoading(true);
    try {
      await login(phone, password);
    } catch (e) {
      Alert.alert('Ошибка входа', e.message || 'Неверный телефон или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
        />
        <Text style={[styles.title, { color: colors.accent }]}>
          <Text style={{ color: dark ? 'rgba(255,255,255,0.6)' : '#6b7280' }}>i</Text>
          Borcuha
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Управление клубом единоборств
        </Text>

        <View style={styles.form}>
          <PhoneInput value={phone} onChangeText={setPhone} label="Телефон" />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Пароль</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Введите пароль"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, {
              color: colors.text,
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
            }]}
          />

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={[styles.loginBtn, { backgroundColor: colors.accent, opacity: loading ? 0.7 : 1 }]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginText}>Войти</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 32,
  },
  form: {},
  label: { fontSize: 13, marginBottom: 6, fontWeight: '500' },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  loginBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
