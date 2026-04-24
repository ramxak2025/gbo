/**
 * DashboardScreen — 1-в-1 копия PWA Dashboard.jsx
 * 3 разных вида для superadmin/trainer/student
 */
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import {
  Users, TrendingUp, TrendingDown, AlertCircle, Newspaper, Calendar,
  Flame, Trophy, ChevronRight, Dumbbell, CreditCard, Shield, MapPin,
  Wallet, ClipboardList, UserPlus, Check, X, Megaphone, Trash2, Plus,
  Play, Film, Clock,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}
function isExpired(d) { return !d || new Date(d) < new Date(); }
function getSportLabel(s) {
  const m = { bjj:'BJJ', mma:'MMA', boxing:'Бокс', wrestling:'Борьба', judo:'Дзюдо', karate:'Карате', kickboxing:'Кикбоксинг', muaythai:'Муай-тай', grappling:'Грэпплинг' };
  return m[s] || s || '—';
}

export default function DashboardScreen({ navigation }) {
  const { auth } = useAuth();
  const { data, addNews, deleteNews, approveRegistration, rejectRegistration } = useData();
  const { dark } = useTheme();
  const insets = useSafeAreaInsets();

  const isTrainer = auth.role === 'trainer';
  const isStudent = auth.role === 'student';
  const isAdmin = auth.role === 'superadmin';

  const user = data.users?.find(u => u.id === auth.userId);
  const student = isStudent ? data.students?.find(s => s.id === auth.studentId) : null;

  const myStudents = useMemo(() =>
    isAdmin ? data.students : data.students?.filter(s => s.trainerId === auth.userId) || [], [data.students, auth.userId, isAdmin]);
  const myGroups = useMemo(() =>
    isAdmin ? data.groups : data.groups?.filter(g => g.trainerId === auth.userId) || [], [data.groups, auth.userId, isAdmin]);
  const myTx = useMemo(() =>
    isAdmin ? data.transactions : data.transactions?.filter(t => t.trainerId === auth.userId) || [], [data.transactions, auth.userId, isAdmin]);

  const active = myStudents.filter(s => !isExpired(s.subscriptionExpiresAt));
  const debtors = myStudents.filter(s => isExpired(s.subscriptionExpiresAt));
  const income = myTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
  const expense = myTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
  const balance = income - expense;

  const studentGroup = isStudent ? data.groups?.find(g => g.id === student?.groupId) : null;
  const myTrainer = isStudent ? data.users?.find(u => u.id === student?.trainerId) : null;

  const [newsModal, setNewsModal] = useState(false);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');

  const t = dark ? '#fff' : '#111';
  const t2 = dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const t3 = dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';
  const bg = dark ? '#050505' : '#f5f5f7';

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Background blobs */}
      <View style={{ position: 'absolute', top: '-30%', left: '-20%', width: '60%', height: '60%', borderRadius: 9999, backgroundColor: dark ? 'rgba(88,28,135,0.20)' : 'rgba(233,213,255,0.30)' }} />
      <View style={{ position: 'absolute', bottom: '-20%', right: '-15%', width: '50%', height: '50%', borderRadius: 9999, backgroundColor: dark ? 'rgba(127,29,29,0.15)' : 'rgba(254,202,202,0.20)' }} />

      <ScrollView contentContainerStyle={{ paddingBottom: 128 }} showsVerticalScrollIndicator={false}>
        <PageHeader title="iBorcuha" gradient />

        <View style={{ paddingHorizontal: 16 }}>

          {/* ===== TRAINER DASHBOARD ===== */}
          {isTrainer && (
            <>
              {/* Hero */}
              <GlassCard onPress={() => navigation.navigate('ProfilePage')} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ borderWidth: 3, borderColor: dark ? 'rgba(139,92,246,0.4)' : 'rgba(139,92,246,0.3)', borderRadius: 40, padding: 2 }}>
                    <Avatar src={user?.avatar} name={user?.name} size={56} />
                  </View>
                  <View style={{ marginLeft: 14, flex: 1 }}>
                    <Text style={{ fontSize: 22, fontWeight: '900', color: t }} numberOfLines={1}>{user?.clubName || user?.name}</Text>
                    <Text style={{ fontSize: 14, color: t2, marginTop: 2 }}>{user?.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      {user?.sportType && (
                        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(220,38,38,0.12)', borderWidth: 1, borderColor: 'rgba(220,38,38,0.20)' }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#dc2626' }}>{getSportLabel(user.sportType)}</Text>
                        </View>
                      )}
                      {user?.city && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <MapPin size={11} color={t2} />
                          <Text style={{ fontSize: 12, color: t2 }}>{user.city}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <ChevronRight size={20} color={t3} />
                </View>
              </GlassCard>

              {/* Stats */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <GlassCard style={{ flex: 1 }}><View style={{ alignItems: 'center' }}>
                  <Users size={20} color="#3b82f6" /><Text style={{ fontSize: 22, fontWeight: '800', color: t, marginTop: 6 }}>{myStudents.length}</Text><Text style={{ fontSize: 10, color: t2, fontWeight: '600', textTransform: 'uppercase' }}>Всего</Text>
                </View></GlassCard>
                <GlassCard style={{ flex: 1 }}><View style={{ alignItems: 'center' }}>
                  <TrendingUp size={20} color="#22c55e" /><Text style={{ fontSize: 22, fontWeight: '800', color: t, marginTop: 6 }}>{active.length}</Text><Text style={{ fontSize: 10, color: t2, fontWeight: '600', textTransform: 'uppercase' }}>Активных</Text>
                </View></GlassCard>
                <GlassCard style={{ flex: 1 }}><View style={{ alignItems: 'center' }}>
                  <AlertCircle size={20} color="#ef4444" /><Text style={{ fontSize: 22, fontWeight: '800', color: t, marginTop: 6 }}>{debtors.length}</Text><Text style={{ fontSize: 10, color: t2, fontWeight: '600', textTransform: 'uppercase' }}>Должников</Text>
                </View></GlassCard>
              </View>

              {/* Balance */}
              <GlassCard onPress={() => navigation.navigate('Cash')} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ flex: 1 }}>
                    <Text style={{ fontSize: 28, fontWeight: '900', color: balance >= 0 ? '#22c55e' : '#ef4444' }}>{balance >= 0 ? '+' : ''}{balance.toLocaleString('ru-RU')} ₽</Text>
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <TrendingUp size={14} color="#22c55e" /><Text style={{ color: '#22c55e', fontWeight: '700', fontSize: 13 }}>+{income.toLocaleString('ru-RU')}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <TrendingDown size={14} color="#ef4444" /><Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 13 }}>−{expense.toLocaleString('ru-RU')}</Text>
                  </View>
                </View>
              </GlassCard>

              {/* Groups */}
              {myGroups.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: t, marginBottom: 10 }}>Группы</Text>
                  {myGroups.map(g => {
                    const cnt = myStudents.filter(s => s.groupId === g.id).length;
                    return (
                      <GlassCard key={g.id} style={{ marginBottom: 8 }} onPress={() => g.attendanceEnabled ? navigation.navigate('Attendance', { groupId: g.id }) : null}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Dumbbell size={18} color="#8b5cf6" />
                          <View style={{ marginLeft: 10, flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: t }}>{g.name}</Text>
                            <Text style={{ fontSize: 12, color: t2 }}>{g.schedule || ''}</Text>
                          </View>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: t2 }}>{cnt} чел. · {(g.subscriptionCost || 0).toLocaleString()} ₽</Text>
                          {g.attendanceEnabled && <ClipboardList size={16} color="#22c55e" style={{ marginLeft: 8 }} />}
                        </View>
                      </GlassCard>
                    );
                  })}
                </View>
              )}

              {/* Add news */}
              <Pressable onPress={() => setNewsModal(true)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(220,38,38,0.12)', borderWidth: 1, borderColor: 'rgba(220,38,38,0.20)', marginBottom: 16, opacity: pressed ? 0.7 : 1 })}>
                <Megaphone size={16} color="#dc2626" />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#dc2626' }}>Добавить новость</Text>
              </Pressable>

              {/* News */}
              {data.news?.filter(n => n.trainerId === auth.userId).slice(0, 3).map(n => (
                <GlassCard key={n.id} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Newspaper size={16} color={t2} />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: t }} numberOfLines={1}>{n.title}</Text>
                      {!!n.content && <Text style={{ fontSize: 13, color: t2, marginTop: 2 }} numberOfLines={2}>{n.content}</Text>}
                    </View>
                    <Pressable onPress={() => Alert.alert('Удалить?', '', [{ text: 'Отмена' }, { text: 'Удалить', style: 'destructive', onPress: () => deleteNews(n.id) }])} style={{ padding: 4 }}>
                      <Trash2 size={14} color="rgba(239,68,68,0.6)" />
                    </Pressable>
                  </View>
                </GlassCard>
              ))}
            </>
          )}

          {/* ===== STUDENT DASHBOARD ===== */}
          {isStudent && student && (
            <>
              {/* Hero */}
              <GlassCard onPress={() => navigation.navigate('ProfilePage')} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ borderWidth: 3, borderColor: dark ? 'rgba(34,197,94,0.4)' : 'rgba(34,197,94,0.3)', borderRadius: 40, padding: 2 }}>
                    <Avatar src={student?.avatar || user?.avatar} name={student?.name || user?.name} size={56} />
                  </View>
                  <View style={{ marginLeft: 14, flex: 1 }}>
                    <Text style={{ fontSize: 22, fontWeight: '900', color: t }} numberOfLines={1}>{student.name}</Text>
                    <Text style={{ fontSize: 14, color: t2 }}>{user?.clubName} — {studentGroup?.name || 'Без группы'}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      {user?.sportType && (
                        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(220,38,38,0.12)' }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#dc2626' }}>{getSportLabel(user.sportType)}</Text>
                        </View>
                      )}
                      {student.belt && (
                        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: t2 }}>{student.belt}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <ChevronRight size={20} color={t3} />
                </View>
                {/* Trainer info */}
                {myTrainer && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                    <Shield size={14} color={t2} />
                    <Text style={{ fontSize: 12, color: t2 }}>Тренер: <Text style={{ fontWeight: '600', color: t }}>{myTrainer.name}</Text></Text>
                  </View>
                )}
              </GlassCard>

              {/* Status + Subscription */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <GlassCard style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: t2, textTransform: 'uppercase', marginBottom: 4 }}>Статус</Text>
                  {student.status ? <StatusBadge status={student.status} /> : <Text style={{ fontSize: 14, fontWeight: '700', color: '#22c55e' }}>В строю</Text>}
                </GlassCard>
                <GlassCard style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: t2, textTransform: 'uppercase', marginBottom: 4 }}>Абонемент</Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: isExpired(student.subscriptionExpiresAt) ? '#ef4444' : '#22c55e' }}>
                    {isExpired(student.subscriptionExpiresAt) ? 'Долг' : 'Активен'}
                  </Text>
                  <Text style={{ fontSize: 11, color: t2, marginTop: 2 }}>до {formatDate(student.subscriptionExpiresAt)}</Text>
                </GlassCard>
              </View>

              {/* Tournaments */}
              {data.tournaments?.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: t, marginBottom: 10 }}>Турниры</Text>
                  {data.tournaments.slice(0, 3).map(tr => (
                    <GlassCard key={tr.id} onPress={() => navigation.navigate('TournamentDetail', { id: tr.id })} style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Trophy size={18} color="#fbbf24" />
                        <View style={{ marginLeft: 10, flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: t }} numberOfLines={1}>{tr.title}</Text>
                          <Text style={{ fontSize: 12, color: t2 }}>{formatDate(tr.date)} · {tr.location}</Text>
                        </View>
                        <ChevronRight size={16} color={t3} />
                      </View>
                    </GlassCard>
                  ))}
                </View>
              )}

              {/* News */}
              {data.news?.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: t, marginBottom: 10 }}>Новости</Text>
                  {data.news.slice(-3).reverse().map(n => (
                    <GlassCard key={n.id} style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <Newspaper size={16} color={t2} />
                        <View style={{ marginLeft: 10, flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: t }} numberOfLines={1}>{n.title}</Text>
                          {!!n.content && <Text style={{ fontSize: 13, color: t2, marginTop: 2 }} numberOfLines={2}>{n.content}</Text>}
                        </View>
                      </View>
                    </GlassCard>
                  ))}
                </View>
              )}
            </>
          )}

          {/* ===== SUPERADMIN DASHBOARD ===== */}
          {isAdmin && (
            <>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <GlassCard style={{ flex: 1 }}><View style={{ alignItems: 'center' }}>
                  <Users size={20} color="#3b82f6" /><Text style={{ fontSize: 22, fontWeight: '800', color: t, marginTop: 6 }}>{data.users?.filter(u => u.role === 'trainer').length || 0}</Text><Text style={{ fontSize: 10, color: t2, fontWeight: '600', textTransform: 'uppercase' }}>Тренеры</Text>
                </View></GlassCard>
                <GlassCard style={{ flex: 1 }}><View style={{ alignItems: 'center' }}>
                  <Users size={20} color="#22c55e" /><Text style={{ fontSize: 22, fontWeight: '800', color: t, marginTop: 6 }}>{data.students?.length || 0}</Text><Text style={{ fontSize: 10, color: t2, fontWeight: '600', textTransform: 'uppercase' }}>Спортсмены</Text>
                </View></GlassCard>
              </View>

              {/* Pending registrations */}
              {data.pendingRegistrations?.filter(r => r.status === 'pending').length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <UserPlus size={18} color="#dc2626" />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: t }}>Заявки</Text>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: 'rgba(220,38,38,0.15)' }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#dc2626' }}>{data.pendingRegistrations.filter(r => r.status === 'pending').length}</Text>
                    </View>
                  </View>
                  {data.pendingRegistrations.filter(r => r.status === 'pending').map(reg => (
                    <GlassCard key={reg.id} style={{ marginBottom: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: t }}>{reg.name}</Text>
                      <Text style={{ fontSize: 12, color: t2 }}>{reg.clubName} · {reg.phone}</Text>
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                        <Pressable onPress={() => approveRegistration(reg.id)} style={{ flex: 1, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(34,197,94,0.15)', alignItems: 'center' }}>
                          <Check size={18} color="#22c55e" />
                        </Pressable>
                        <Pressable onPress={() => rejectRegistration(reg.id)} style={{ flex: 1, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.15)', alignItems: 'center' }}>
                          <X size={18} color="#ef4444" />
                        </Pressable>
                      </View>
                    </GlassCard>
                  ))}
                </View>
              )}

              {/* Trainers */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: t, marginBottom: 10 }}>Тренеры</Text>
                {data.users?.filter(u => u.role === 'trainer').slice(0, 10).map(tr => (
                  <GlassCard key={tr.id} onPress={() => navigation.navigate('TrainerDetail', { id: tr.id })} style={{ marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Avatar src={tr.avatar} name={tr.name} size={40} />
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: t }}>{tr.name}</Text>
                        <Text style={{ fontSize: 12, color: t2 }}>{tr.clubName || ''} · {tr.city || ''}</Text>
                      </View>
                      <ChevronRight size={16} color={t3} />
                    </View>
                  </GlassCard>
                ))}
              </View>

              {/* Tournaments */}
              {data.tournaments?.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: t, marginBottom: 10 }}>Ближайшие турниры</Text>
                  {data.tournaments.slice(0, 3).map(tr => (
                    <GlassCard key={tr.id} onPress={() => navigation.navigate('TournamentDetail', { id: tr.id })} style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Trophy size={18} color="#fbbf24" />
                        <View style={{ marginLeft: 10, flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: t }}>{tr.title}</Text>
                          <Text style={{ fontSize: 12, color: t2 }}>{formatDate(tr.date)} · {tr.location}</Text>
                        </View>
                      </View>
                    </GlassCard>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* News Modal */}
      <Modal open={newsModal} onClose={() => setNewsModal(false)} title="Новая новость">
        <TextInput value={newsTitle} onChangeText={setNewsTitle} placeholder="Заголовок" placeholderTextColor={t3} style={{ backgroundColor: dark ? 'rgba(255,255,255,0.06)' : '#fff', borderRadius: 14, padding: 14, color: t, fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />
        <TextInput value={newsContent} onChangeText={setNewsContent} placeholder="Текст новости" placeholderTextColor={t3} multiline numberOfLines={4} style={{ backgroundColor: dark ? 'rgba(255,255,255,0.06)' : '#fff', borderRadius: 14, padding: 14, color: t, fontSize: 15, marginBottom: 16, minHeight: 100, borderWidth: 1, borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', textAlignVertical: 'top' }} />
        <Pressable onPress={() => { if (newsTitle.trim()) { addNews({ title: newsTitle.trim(), content: newsContent.trim() }); setNewsTitle(''); setNewsContent(''); setNewsModal(false); } }} style={({ pressed }) => ({ backgroundColor: '#dc2626', borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: pressed ? 0.85 : 1 })}>
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Опубликовать</Text>
        </Pressable>
      </Modal>
    </View>
  );
}
