import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import PageHeader from '../components/PageHeader';
import PhoneInput, { cleanPhone } from '../components/PhoneInput';
import DateButton from '../components/DateButton';

export default function AddStudentScreen({ navigation }) {
  const { auth } = useAuth();
  const { data, addStudent } = useData();
  const { dark } = useTheme();
  const myGroups = data.groups?.filter(g => g.trainerId === auth.userId) || [];
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [groupId, setGroupId] = useState(myGroups[0]?.id || '');
  const [weight, setWeight] = useState('');
  const [belt, setBelt] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [trainingStart, setTrainingStart] = useState(new Date().toISOString().split('T')[0]);
  const [subExpires, setSubExpires] = useState('');
  const [password, setPassword] = useState('student123');
  const [loading, setLoading] = useState(false);
  const t = dark ? '#fff' : '#111';
  const t2 = dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)';
  const inputStyle = { backgroundColor: dark ? 'rgba(255,255,255,0.07)' : '#fff', borderWidth: 1, borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderRadius: 14, padding: 14, color: t, fontSize: 15, marginBottom: 12 };

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert('Введите ФИО'); return; }
    const digits = cleanPhone(phone);
    if (digits.length < 11) { Alert.alert('Введите полный номер телефона'); return; }
    setLoading(true);
    try {
      await addStudent({ name: name.trim(), phone: digits, groupId: groupId || null, weight: weight ? parseFloat(weight) : null, belt: belt || null, birthDate: birthDate || null, trainingStartDate: trainingStart || null, subscriptionExpiresAt: subExpires || null, password });
      navigation.goBack();
    } catch (e) { Alert.alert('Ошибка', e.message); }
    finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: dark ? '#050505' : '#f5f5f7' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 128 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <PageHeader title="Добавить ученика" back />
        <View style={{ paddingHorizontal: 16 }}>
          <TextInput value={name} onChangeText={setName} placeholder="ФИО" placeholderTextColor={t2} style={inputStyle} />
          <PhoneInput value={phone} onChange={setPhone} placeholderTextColor={t2} style={inputStyle} />
          {myGroups.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: t2, marginBottom: 6 }}>Группа</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {myGroups.map(g => (
                  <Pressable key={g.id} onPress={() => setGroupId(g.id)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: groupId === g.id ? 'rgba(220,38,38,0.15)' : (dark ? 'rgba(255,255,255,0.06)' : '#fff'), borderWidth: 1, borderColor: groupId === g.id ? 'rgba(220,38,38,0.30)' : (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: groupId === g.id ? '#dc2626' : t2 }}>{g.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          <TextInput value={weight} onChangeText={setWeight} placeholder="Вес (кг)" placeholderTextColor={t2} keyboardType="decimal-pad" style={inputStyle} />
          <TextInput value={belt} onChangeText={setBelt} placeholder="Пояс / ранг" placeholderTextColor={t2} style={inputStyle} />
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <DateButton label="Рождение" value={birthDate} onChange={setBirthDate} style={{ flex: 1 }} />
            <DateButton label="Тренируется с" value={trainingStart} onChange={setTrainingStart} style={{ flex: 1 }} />
          </View>
          <DateButton label="Абонемент до" value={subExpires} onChange={setSubExpires} style={{ marginBottom: 12 }} />
          <TextInput value={password} onChangeText={setPassword} placeholder="Пароль" placeholderTextColor={t2} style={inputStyle} />
          <Pressable onPress={handleSubmit} disabled={loading} style={({ pressed }) => ({ backgroundColor: '#dc2626', borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: loading ? 0.5 : pressed ? 0.85 : 1, marginTop: 8 })}>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Добавить ученика</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
