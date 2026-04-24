/**
 * ProfileScreen — iOS 26 Liquid Glass redesign
 *
 * - AmbientBackground + LiquidGlassCard hero
 * - Gradient ring avatar by role
 * - Stats grid, info rows, theme toggle
 * - Staggered entrance animations
 * - GlowButton for logout
 */
import React from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Phone, Building2, Dumbbell, MapPin, Award, Sun, Moon,
  Layers, ChevronRight, LogOut, User, Users, Calendar,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/Avatar';
import { LiquidGlassCard, HapticPressable, AmbientBackground, GlowButton } from '../design';
import { colors, radius, spacing, typography } from '../design/tokens';
import { getSportLabel } from '../utils/sports';

export default function ProfileScreen({ navigation }) {
  const { auth, logout } = useAuth();
  const { data } = useData();
  const { t, dark, toggle } = useTheme();

  const user = auth.role === 'student'
    ? data.students.find(s => s.id === auth.studentId)
    : data.users.find(u => u.id === auth.userId) || auth.user;

  const handleLogout = () => {
    Alert.alert('Выход', 'Вы уверены, что хотите выйти?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: logout },
    ]);
  };

  const theme = dark ? colors.dark : colors.light;

  // Gradient by role
  const heroGradient = auth.role === 'superadmin'
    ? colors.gradients.admin
    : auth.role === 'trainer'
      ? colors.gradients.trainer
      : colors.gradients.student;

  const roleLabel = auth.role === 'superadmin'
    ? 'Администратор'
    : auth.role === 'trainer'
      ? 'Тренер'
      : 'Спортсмен';

  // Stats for trainer/admin
  const isTrainer = auth.role === 'trainer';
  const isAdmin = auth.role === 'superadmin';
  const myStudents = isAdmin ? data.students : data.students.filter(s => s.trainerId === auth.userId);
  const myGroups = isAdmin ? data.groups : data.groups.filter(g => g.trainerId === auth.userId);

  const infoRows = [
    user?.phone && { icon: Phone, label: user.phone },
    user?.clubName && { icon: Building2, label: user.clubName },
    user?.sportType && { icon: Dumbbell, label: getSportLabel(user.sportType) },
    user?.city && { icon: MapPin, label: user.city },
    user?.belt && { icon: Award, label: user.belt },
  ].filter(Boolean);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AmbientBackground dark={dark} variant={isAdmin ? 'warm' : isTrainer ? 'cool' : 'default'} />

      <ScrollView
        contentContainerStyle={{ paddingTop: 60, paddingBottom: 140, paddingHorizontal: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <Animated.View entering={FadeInDown.springify().damping(15).mass(0.8)}>
          <LiquidGlassCard dark={dark} radius={radius.xxl} padding={0} intensity="strong">
            <LinearGradient
              colors={heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: radius.xxl, paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl, alignItems: 'center' }}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0)']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.7 }}
                style={[StyleSheet.absoluteFill, { borderRadius: radius.xxl }]}
                pointerEvents="none"
              />

              {/* Avatar with gradient ring */}
              <View style={{
                borderWidth: 3,
                borderColor: 'rgba(255,255,255,0.4)',
                borderRadius: 50,
                padding: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
              }}>
                <Avatar name={user?.name} src={user?.avatar} size={80} />
              </View>

              <Text style={{
                ...typography.title1,
                color: '#fff',
                marginTop: spacing.md,
                textAlign: 'center',
                textShadowColor: 'rgba(0,0,0,0.3)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              }}>
                {user?.name || '—'}
              </Text>

              <View style={{
                marginTop: spacing.sm,
                paddingHorizontal: 14,
                paddingVertical: 5,
                borderRadius: radius.pill,
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.3)',
              }}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
                  {roleLabel}
                </Text>
              </View>
            </LinearGradient>
          </LiquidGlassCard>
        </Animated.View>

        {/* Stats grid (trainer/admin) */}
        {(isTrainer || isAdmin) && (
          <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginTop: spacing.lg, flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <LiquidGlassCard dark={dark} radius={radius.xl} padding={14}>
                <View style={{ alignItems: 'center' }}>
                  <LinearGradient
                    colors={['#3b82f6', '#6366f1']}
                    style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Users size={20} color="#fff" />
                  </LinearGradient>
                  <Text style={{ ...typography.title2, color: theme.text, marginTop: spacing.sm }}>{myStudents.length}</Text>
                  <Text style={{ color: theme.textTertiary, fontSize: 11, fontWeight: '600', marginTop: 2 }}>Ученики</Text>
                </View>
              </LiquidGlassCard>
            </View>
            <View style={{ flex: 1 }}>
              <LiquidGlassCard dark={dark} radius={radius.xl} padding={14}>
                <View style={{ alignItems: 'center' }}>
                  <LinearGradient
                    colors={['#8b5cf6', '#a855f7']}
                    style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Layers size={20} color="#fff" />
                  </LinearGradient>
                  <Text style={{ ...typography.title2, color: theme.text, marginTop: spacing.sm }}>{myGroups.length}</Text>
                  <Text style={{ color: theme.textTertiary, fontSize: 11, fontWeight: '600', marginTop: 2 }}>Группы</Text>
                </View>
              </LiquidGlassCard>
            </View>
          </Animated.View>
        )}

        {/* Info card */}
        {infoRows.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).springify()} style={{ marginTop: spacing.lg }}>
            <LiquidGlassCard dark={dark} radius={radius.xl} padding={spacing.lg}>
              {infoRows.map((row, i) => {
                const Icon = row.icon;
                return (
                  <View key={i} style={[styles.infoRow, i < infoRows.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: spacing.md, marginBottom: spacing.md }]}>
                    <LinearGradient
                      colors={dark ? ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)'] : ['rgba(0,0,0,0.06)', 'rgba(0,0,0,0.03)']}
                      style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Icon size={16} color={theme.textSecondary} />
                    </LinearGradient>
                    <Text style={{ ...typography.body, color: theme.text, flex: 1, marginLeft: spacing.md }}>{row.label}</Text>
                  </View>
                );
              })}
            </LiquidGlassCard>
          </Animated.View>
        )}

        {/* Theme toggle */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={{ marginTop: spacing.md }}>
          <LiquidGlassCard dark={dark} radius={radius.xl} padding={spacing.lg} onPress={toggle}>
            <View style={styles.infoRow}>
              <LinearGradient
                colors={dark ? ['#fbbf24', '#f97316'] : ['#6366f1', '#8b5cf6']}
                style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }}
              >
                {dark ? <Sun size={16} color="#fff" /> : <Moon size={16} color="#fff" />}
              </LinearGradient>
              <Text style={{ ...typography.body, color: theme.text, flex: 1, marginLeft: spacing.md }}>
                {dark ? 'Светлая тема' : 'Тёмная тема'}
              </Text>
              <ChevronRight size={18} color={theme.textTertiary} />
            </View>
          </LiquidGlassCard>
        </Animated.View>

        {/* Navigation links */}
        {auth.role === 'trainer' && (
          <Animated.View entering={FadeInDown.delay(400).springify()} style={{ marginTop: spacing.md }}>
            <LiquidGlassCard dark={dark} radius={radius.xl} padding={spacing.lg} onPress={() => navigation.navigate('Groups')}>
              <View style={styles.infoRow}>
                <LinearGradient
                  colors={['#8b5cf6', '#6366f1']}
                  style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Layers size={16} color="#fff" />
                </LinearGradient>
                <Text style={{ ...typography.body, color: theme.text, flex: 1, marginLeft: spacing.md }}>
                  Управление группами
                </Text>
                <ChevronRight size={18} color={theme.textTertiary} />
              </View>
            </LiquidGlassCard>
          </Animated.View>
        )}

        {/* Logout button */}
        <Animated.View entering={FadeInDown.delay(500).springify()} style={{ marginTop: spacing.xxl }}>
          <GlowButton
            title="Выйти"
            onPress={handleLogout}
            gradient={['#ef4444', '#dc2626', '#b91c1c']}
            icon={<LogOut size={18} color="#fff" />}
            haptic="heavy"
            dark={dark}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
