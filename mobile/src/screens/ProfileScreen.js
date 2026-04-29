import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Users, TrendingUp, Dumbbell, Bell, LogOut, MapPin, Shield, Award, Scale, Calendar, CreditCard, Phone, ChevronRight, Crown } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';
import PageHeader from '../components/PageHeader';

function formatDate(iso) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }); }
function isExpired(d) { return !d || new Date(d) < new Date(); }
function getSportLabel(s) { const m={bjj:'BJJ',mma:'MMA',boxing:'Бокс',judo:'Дзюдо',karate:'Карате',grappling:'Грэпплинг',wrestling:'Борьба',kickboxing:'Кикбоксинг',muaythai:'Муай-тай'}; return m[s]||s||''; }

export default function ProfileScreen({ navigation }) {
  const { auth, logout } = useAuth();
  const { data } = useData();
  const { dark } = useTheme();
  const insets = useSafeAreaInsets();

  const user = data.users?.find(u => u.id === auth.userId);
  const student = auth.role === 'student' ? data.students?.find(s => s.id === auth.studentId) : null;
  const myStudents = data.students?.filter(s => s.trainerId === auth.userId) || [];
  const myGroups = data.groups?.filter(g => g.trainerId === auth.userId) || [];
  const studentGroup = student ? data.groups?.find(g => g.id === student.groupId) : null;
  const myTrainer = student ? data.users?.find(u => u.id === student.trainerId) : null;
  const isTrainer = auth.role === 'trainer';
  const isStudent = auth.role === 'student';

  const [loggingOut, setLoggingOut] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  useEffect(() => { Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start(); }, []);

  const t = dark ? '#fff' : '#111';
  const t2 = dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const bg = dark ? '#050505' : '#f5f5f7';
  const ringColor = isTrainer ? 'rgba(139,92,246,0.4)' : isStudent ? 'rgba(34,197,94,0.4)' : 'rgba(251,191,36,0.4)';

  const handleLogout = () => {
    Alert.alert('Выйти?', 'Вы уверены?', [
      { text: 'Отмена' },
      { text: 'Выйти', style: 'destructive', onPress: async () => { setLoggingOut(true); try { await logout(); } finally { setLoggingOut(false); } } },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ position: 'absolute', top: '-30%', left: '-20%', width: '60%', height: '60%', borderRadius: 9999, backgroundColor: dark ? 'rgba(88,28,135,0.15)' : 'rgba(233,213,255,0.25)' }} />

      <ScrollView contentContainerStyle={{ paddingBottom: 128 }} showsVerticalScrollIndicator={false}>
        <PageHeader title="Профиль" back />

        <Animated.View style={{ paddingHorizontal: 16, opacity: fadeAnim }}>
          {/* Hero */}
          <GlassCard style={{ marginBottom: 16, alignItems: 'center', padding: 24 }}>
            <View style={{ borderWidth: 3, borderColor: ringColor, borderRadius: 50, padding: 3, marginBottom: 12 }}>
              <Avatar src={user?.avatar} name={user?.name} size={80} />
            </View>
            {user?.isHeadTrainer && <Crown size={16} color="#fbbf24" style={{ position: 'absolute', top: 20, right: '40%' }} />}
            <Text style={{ fontSize: 24, fontWeight: '900', color: t }}>{user?.name}</Text>
            <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(139,92,246,0.15)', marginTop: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#8b5cf6' }}>
                {auth.role === 'superadmin' ? 'Админ' : isTrainer ? 'Тренер' : 'Спортсмен'}
              </Text>
            </View>
            {user?.sportType && <Text style={{ fontSize: 13, color: t2, marginTop: 6 }}>{getSportLabel(user.sportType)}</Text>}
            {user?.clubName && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}><Shield size={12} color={t2} /><Text style={{ fontSize: 13, color: t2 }}>{user.clubName}</Text></View>}
            {user?.city && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}><MapPin size={12} color={t2} /><Text style={{ fontSize: 13, color: t2 }}>{user.city}</Text></View>}
          </GlassCard>

          {/* Trainer stats */}
          {isTrainer && (
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <GlassCard style={{ flex: 1 }}><View style={{ alignItems: 'center' }}><Users size={18} color="#3b82f6" /><Text style={{ fontSize: 20, fontWeight: '800', color: t, marginTop: 4 }}>{myStudents.length}</Text><Text style={{ fontSize: 10, color: t2 }}>Ученики</Text></View></GlassCard>
              <GlassCard style={{ flex: 1 }}><View style={{ alignItems: 'center' }}><TrendingUp size={18} color="#22c55e" /><Text style={{ fontSize: 20, fontWeight: '800', color: t, marginTop: 4 }}>{myStudents.filter(s => !isExpired(s.subscriptionExpiresAt)).length}</Text><Text style={{ fontSize: 10, color: t2 }}>Активных</Text></View></GlassCard>
              <GlassCard style={{ flex: 1 }}><View style={{ alignItems: 'center' }}><Dumbbell size={18} color="#8b5cf6" /><Text style={{ fontSize: 20, fontWeight: '800', color: t, marginTop: 4 }}>{myGroups.length}</Text><Text style={{ fontSize: 10, color: t2 }}>Групп</Text></View></GlassCard>
            </View>
          )}

          {/* Student info */}
          {isStudent && student && (
            <>
              {[
                { icon: Users, label: 'Группа', value: studentGroup?.name || 'Без группы', color: '#3b82f6' },
                { icon: CreditCard, label: 'Абонемент', value: isExpired(student.subscriptionExpiresAt) ? 'Долг' : `до ${formatDate(student.subscriptionExpiresAt)}`, color: isExpired(student.subscriptionExpiresAt) ? '#ef4444' : '#22c55e' },
                student.belt && { icon: Award, label: 'Пояс', value: student.belt, color: '#f59e0b' },
                student.weight && { icon: Scale, label: 'Вес', value: `${student.weight} кг`, color: '#8b5cf6' },
                student.birthDate && { icon: Calendar, label: 'Рождение', value: formatDate(student.birthDate), color: '#3b82f6' },
                student.trainingStartDate && { icon: Dumbbell, label: 'Тренируется с', value: formatDate(student.trainingStartDate), color: '#22c55e' },
              ].filter(Boolean).map((item, i) => (
                <GlassCard key={i} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <item.icon size={18} color={item.color} />
                    <Text style={{ fontSize: 12, color: t2, marginLeft: 10, flex: 1 }}>{item.label}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: item.color === '#ef4444' ? '#ef4444' : t }}>{item.value}</Text>
                  </View>
                </GlassCard>
              ))}
              {myTrainer && (
                <GlassCard style={{ marginTop: 8, marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Avatar src={myTrainer.avatar} name={myTrainer.name} size={40} />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={{ fontSize: 12, color: t2 }}>Мой тренер</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: t }}>{myTrainer.name}</Text>
                    </View>
                    <Shield size={16} color={t2} />
                  </View>
                </GlassCard>
              )}
            </>
          )}

          {/* Phone */}
          {user?.phone && (
            <GlassCard style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Phone size={18} color="#3b82f6" />
                <Text style={{ fontSize: 14, color: t, marginLeft: 10 }}>{user.phone}</Text>
              </View>
            </GlassCard>
          )}

          {/* Notifications */}
          <GlassCard onPress={() => navigation.navigate('NotificationSettings')} style={{ marginBottom: 8, backgroundColor: 'rgba(59,130,246,0.08)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Bell size={18} color="#3b82f6" />
              <Text style={{ fontSize: 14, fontWeight: '600', color: t, marginLeft: 10, flex: 1 }}>Уведомления</Text>
              <ChevronRight size={16} color={t2} />
            </View>
          </GlassCard>

          {/* Logout */}
          <Pressable onPress={handleLogout} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: 'rgba(239,68,68,0.12)', marginTop: 16, opacity: pressed ? 0.7 : 1 })}>
            <LogOut size={18} color="#ef4444" />
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#ef4444' }}>Выйти из аккаунта</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
