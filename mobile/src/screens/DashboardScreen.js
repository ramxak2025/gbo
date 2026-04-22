/**
 * DashboardScreen — редизайн iOS 26 Liquid Glass
 *
 * - Parallax hero с градиентом по роли
 * - Анимированные stat карточки
 * - LiquidGlassCard везде
 * - Staggered entrance animations
 */
import React, { useMemo } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Users, TrendingUp, TrendingDown, AlertCircle, Newspaper, Calendar, Flame,
  Trophy, ChevronRight, Wallet, Shield, Dumbbell, Activity, MapPin,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/Avatar';
import { LiquidGlassCard, HapticPressable, AmbientBackground } from '../design';
import { colors, radius, spacing, typography } from '../design/tokens';
import { getSportLabel } from '../utils/sports';

const { width: W } = Dimensions.get('window');

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}
function isExpired(dateStr) {
  if (!dateStr) return true;
  return new Date(dateStr) < new Date();
}

export default function DashboardScreen({ navigation }) {
  const { auth } = useAuth();
  const { data } = useData();
  const { dark } = useTheme();

  const isTrainer = auth.role === 'trainer';
  const isAdmin = auth.role === 'superadmin';
  const isStudent = auth.role === 'student';

  const myStudents = isAdmin ? data.students : data.students.filter(s => s.trainerId === auth.userId);
  const myGroups = isAdmin ? data.groups : data.groups.filter(g => g.trainerId === auth.userId);
  const myTx = isAdmin ? data.transactions : data.transactions.filter(tx => tx.trainerId === auth.userId);
  const activeStudents = myStudents.filter(s => !isExpired(s.subscriptionExpiresAt));
  const debtors = myStudents.filter(s => isExpired(s.subscriptionExpiresAt));

  const income = myTx.filter(tx => tx.type === 'income').reduce((s, tx) => s + Number(tx.amount || 0), 0);
  const expense = myTx.filter(tx => tx.type === 'expense').reduce((s, tx) => s + Number(tx.amount || 0), 0);
  const balance = income - expense;

  const user = data.users.find(u => u.id === auth.userId);
  const student = isStudent ? data.students.find(s => s.id === auth.studentId) : null;
  const myTrainer = isStudent ? data.users.find(u => u.id === student?.trainerId) : null;
  const studentGroup = isStudent ? data.groups.find(g => g.id === student?.groupId) : null;

  const theme = dark ? colors.dark : colors.light;

  // Gradient по роли
  const heroGradient = isAdmin
    ? colors.gradients.admin
    : isTrainer
      ? colors.gradients.trainer
      : colors.gradients.student;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AmbientBackground dark={dark} variant={isAdmin ? 'warm' : isTrainer ? 'cool' : 'default'} />

      <ScrollView
        contentContainerStyle={{ paddingTop: 60, paddingBottom: 140, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <Animated.View entering={FadeInDown.springify().damping(15).mass(0.8)}>
          <HapticPressable onPress={() => navigation.navigate('ProfilePage')} haptic="light">
            <LiquidGlassCard dark={dark} radius={radius.xxl} padding={0} intensity="strong">
              <LinearGradient
                colors={heroGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: radius.xxl, padding: 20 }}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0)']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 0.7 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: radius.xxl }}
                  pointerEvents="none"
                />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    borderWidth: 3,
                    borderColor: 'rgba(255,255,255,0.35)',
                    borderRadius: 40,
                    padding: 3,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                  }}>
                    <Avatar src={user?.avatar} name={user?.name} size={64} />
                  </View>
                  <View style={{ marginLeft: 16, flex: 1 }}>
                    <Text style={{ ...typography.title1, color: '#fff', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }} numberOfLines={1}>
                      {isStudent ? student?.name : user?.clubName || user?.name}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600', marginTop: 2 }} numberOfLines={1}>
                      {isStudent ? `${studentGroup?.name || 'Без группы'}` : user?.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
                      {user?.sportType && (
                        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}>
                          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{getSportLabel(user.sportType)}</Text>
                        </View>
                      )}
                      {user?.city && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} color="rgba(255,255,255,0.8)" />
                          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{user.city}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <ChevronRight size={24} color="rgba(255,255,255,0.7)" />
                </View>
              </LinearGradient>
            </LiquidGlassCard>
          </HapticPressable>
        </Animated.View>

        {/* Stats grid (тренер/админ) */}
        {(isTrainer || isAdmin) && (
          <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginTop: 14, flexDirection: 'row', gap: 10 }}>
            <StatCard icon={<Users size={22} color="#3b82f6" />} value={myStudents.length} label="Ученики" dark={dark} delay={0} />
            <StatCard icon={<Activity size={22} color="#22c55e" />} value={activeStudents.length} label="Активные" dark={dark} delay={80} />
            <StatCard icon={<AlertCircle size={22} color="#ef4444" />} value={debtors.length} label="Долги" dark={dark} delay={160} />
          </Animated.View>
        )}

        {/* Balance (тренер) */}
        {isTrainer && (
          <Animated.View entering={FadeInDown.delay(200).springify()} style={{ marginTop: 14 }}>
            <HapticPressable onPress={() => navigation.navigate('Cash')} haptic="light">
              <LiquidGlassCard dark={dark} radius={radius.xxl} padding={20}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <LinearGradient
                    colors={['#6366f1', '#8b5cf6']}
                    style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Wallet size={22} color="#fff" strokeWidth={2.5} />
                  </LinearGradient>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textTertiary, letterSpacing: 1, textTransform: 'uppercase' }}>
                      Общий баланс
                    </Text>
                    <Text style={{ ...typography.title1, color: balance >= 0 ? '#22c55e' : '#ef4444', marginTop: 2 }}>
                      {balance.toLocaleString('ru-RU')} ₽
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TrendingUp size={14} color="#22c55e" />
                    <Text style={{ color: '#22c55e', fontWeight: '700', fontSize: 14 }}>+{income.toLocaleString('ru-RU')}</Text>
                  </View>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TrendingDown size={14} color="#ef4444" />
                    <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 14 }}>−{expense.toLocaleString('ru-RU')}</Text>
                  </View>
                </View>
              </LiquidGlassCard>
            </HapticPressable>
          </Animated.View>
        )}

        {/* Student: status + subscription */}
        {isStudent && student && (
          <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginTop: 14, flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <LiquidGlassCard dark={dark} radius={radius.xl} padding={14}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textTertiary, letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' }}>
                  Статус
                </Text>
                <Text style={{ color: '#22c55e', fontSize: 16, fontWeight: '800' }}>В строю</Text>
              </LiquidGlassCard>
            </View>
            <View style={{ flex: 1 }}>
              <LiquidGlassCard dark={dark} radius={radius.xl} padding={14}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textTertiary, letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' }}>
                  Абонемент
                </Text>
                <Text style={{ color: isExpired(student.subscriptionExpiresAt) ? '#ef4444' : '#22c55e', fontSize: 16, fontWeight: '800' }}>
                  {isExpired(student.subscriptionExpiresAt) ? 'Долг' : 'Активен'}
                </Text>
                <Text style={{ color: theme.textTertiary, fontSize: 11, marginTop: 2 }}>
                  до {formatDate(student.subscriptionExpiresAt)}
                </Text>
              </LiquidGlassCard>
            </View>
          </Animated.View>
        )}

        {/* Groups (тренер) */}
        {isTrainer && myGroups.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).springify()} style={{ marginTop: 20 }}>
            <Text style={{ ...typography.title3, color: theme.text, marginBottom: 12, paddingHorizontal: 4 }}>
              Группы
            </Text>
            <View style={{ gap: 10 }}>
              {myGroups.slice(0, 5).map((g, i) => {
                const count = myStudents.filter(s => s.groupId === g.id).length;
                return (
                  <Animated.View key={g.id} entering={FadeInDown.delay(350 + i * 50).springify()}>
                    <HapticPressable onPress={() => navigation.navigate('Attendance', { groupId: g.id })} haptic="light">
                      <LiquidGlassCard dark={dark} radius={radius.lg} padding={16}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <LinearGradient
                            colors={['#8b5cf6', '#6366f1']}
                            style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Dumbbell size={20} color="#fff" />
                          </LinearGradient>
                          <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>{g.name}</Text>
                            <Text style={{ color: theme.textTertiary, fontSize: 12, marginTop: 2 }}>{g.schedule || 'Нет расписания'}</Text>
                          </View>
                          <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}>
                            <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '700' }}>{count} чел.</Text>
                          </View>
                        </View>
                      </LiquidGlassCard>
                    </HapticPressable>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* News */}
        {data.news?.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400).springify()} style={{ marginTop: 20 }}>
            <Text style={{ ...typography.title3, color: theme.text, marginBottom: 12, paddingHorizontal: 4 }}>
              Новости
            </Text>
            <View style={{ gap: 10 }}>
              {data.news.slice(0, 3).map((n, i) => (
                <Animated.View key={n.id} entering={FadeInDown.delay(450 + i * 60).springify()}>
                  <LiquidGlassCard dark={dark} radius={radius.lg} padding={14}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                      <LinearGradient
                        colors={['#f97316', '#dc2626']}
                        style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Newspaper size={18} color="#fff" />
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>{n.title}</Text>
                        {!!n.content && <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 3 }} numberOfLines={2}>{n.content}</Text>}
                        <Text style={{ color: theme.textQuaternary, fontSize: 11, marginTop: 4 }}>{formatDate(n.date)}</Text>
                      </View>
                    </View>
                  </LiquidGlassCard>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Tournaments */}
        {data.tournaments?.length > 0 && (
          <Animated.View entering={FadeInDown.delay(500).springify()} style={{ marginTop: 20 }}>
            <Text style={{ ...typography.title3, color: theme.text, marginBottom: 12, paddingHorizontal: 4 }}>
              Турниры
            </Text>
            <View style={{ gap: 10 }}>
              {data.tournaments.slice(0, 3).map((t, i) => (
                <Animated.View key={t.id} entering={FadeInDown.delay(550 + i * 60).springify()}>
                  <HapticPressable onPress={() => navigation.navigate('TournamentDetail', { id: t.id })} haptic="light">
                    <LiquidGlassCard dark={dark} radius={radius.lg} padding={14}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <LinearGradient
                          colors={colors.gradients.fire}
                          style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trophy size={22} color="#fff" strokeWidth={2.5} />
                        </LinearGradient>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>{t.title}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Calendar size={12} color={theme.textTertiary} />
                              <Text style={{ color: theme.textTertiary, fontSize: 12 }}>{formatDate(t.date)}</Text>
                            </View>
                            {!!t.location && (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <MapPin size={12} color={theme.textTertiary} />
                                <Text style={{ color: theme.textTertiary, fontSize: 12 }} numberOfLines={1}>{t.location}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <ChevronRight size={20} color={theme.textQuaternary} />
                      </View>
                    </LiquidGlassCard>
                  </HapticPressable>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, value, label, dark, delay }) {
  const theme = dark ? colors.dark : colors.light;
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={{ flex: 1 }}>
      <LiquidGlassCard dark={dark} radius={radius.xl} padding={14}>
        <View style={{ alignItems: 'center' }}>
          {icon}
          <Text style={{ ...typography.title2, color: theme.text, marginTop: 8 }}>{value}</Text>
          <Text style={{ color: theme.textTertiary, fontSize: 11, fontWeight: '600', marginTop: 2 }}>{label}</Text>
        </View>
      </LiquidGlassCard>
    </Animated.View>
  );
}
