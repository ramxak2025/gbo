import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Linking, StyleSheet } from 'react-native';
import { LiquidGlassCard, HapticPressable, AmbientBackground } from '../design';
import { colors, radius, spacing, typography } from '../design/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Search, Play, Trash2, BookOpen, Heart } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';

export default function MaterialsScreen() {
  const { auth } = useAuth();
  const { data, addMaterial, deleteMaterial } = useData();
  const { t, dark } = useTheme();
  const theme = dark ? colors.dark : colors.light;

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [favorites, setFavorites] = useState({});

  const materials = data.materials || [];
  const categories = ['all', ...new Set(materials.map(m => m.category).filter(Boolean))];

  const filtered = materials.filter(m => {
    if (category !== 'all' && m.category !== category) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openVideo = (url) => {
    if (url) Linking.openURL(url);
  };

  const toggleFav = (id) => {
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <View style={[styles.root, { backgroundColor: dark ? colors.dark.bg : colors.light.bg }]}>
      <AmbientBackground dark={dark} variant="cool" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={colors.gradients.trainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerIcon}
            >
              <BookOpen size={22} color="#fff" strokeWidth={2.5} />
            </LinearGradient>
            <Text style={[typography.title1, { color: theme.text }]}>Материалы</Text>
          </View>
        </Animated.View>

        {/* Search bar with glass styling */}
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <LiquidGlassCard
            dark={dark}
            intensity="subtle"
            radius={radius.lg}
            padding={0}
            style={styles.searchCard}
          >
            <View style={styles.searchInner}>
              <Search size={18} color={theme.textTertiary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Поиск материалов..."
                placeholderTextColor={theme.textTertiary}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </LiquidGlassCard>
        </Animated.View>

        {/* Category pills */}
        {categories.length > 1 && (
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.catScroll}
              contentContainerStyle={styles.catContainer}
            >
              {categories.map(cat => {
                const isActive = category === cat;
                return (
                  <HapticPressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    haptic="selection"
                    style={styles.catPill}
                  >
                    {isActive ? (
                      <LinearGradient
                        colors={colors.gradients.trainer}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.catGradient}
                      >
                        <Text style={[typography.caption, { color: '#fff' }]}>
                          {cat === 'all' ? 'Все' : cat}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.catInactive, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
                        <Text style={[typography.caption, { color: theme.textSecondary }]}>
                          {cat === 'all' ? 'Все' : cat}
                        </Text>
                      </View>
                    )}
                  </HapticPressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        {/* Materials list */}
        {filtered.map((m, index) => (
          <Animated.View
            key={m.id}
            entering={FadeInDown.delay(150 + index * 70).springify()}
          >
            <LiquidGlassCard
              dark={dark}
              intensity="regular"
              radius={radius.lg}
              padding={spacing.lg}
              onPress={() => openVideo(m.videoUrl)}
              style={styles.materialCard}
            >
              <View style={styles.materialRow}>
                <LinearGradient
                  colors={colors.accent.warmGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.playIcon}
                >
                  <Play size={18} color="#fff" fill="#fff" strokeWidth={2} />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.callout, { color: theme.text }]} numberOfLines={1}>
                    {m.title}
                  </Text>
                  {m.category && (
                    <Text style={[typography.micro, { color: theme.textTertiary, marginTop: 2, textTransform: 'uppercase' }]}>
                      {m.category}
                    </Text>
                  )}
                  {m.description && (
                    <Text
                      style={[{ color: theme.textSecondary, fontSize: 12, marginTop: spacing.xs }]}
                      numberOfLines={2}
                    >
                      {m.description}
                    </Text>
                  )}
                </View>
                <View style={styles.actions}>
                  <HapticPressable
                    onPress={() => toggleFav(m.id)}
                    haptic="selection"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Heart
                      size={18}
                      color={favorites[m.id] ? colors.accent[500] : theme.textTertiary}
                      fill={favorites[m.id] ? colors.accent[500] : 'transparent'}
                      strokeWidth={2}
                    />
                  </HapticPressable>
                  {auth.role === 'trainer' && (
                    <HapticPressable
                      onPress={() => deleteMaterial(m.id)}
                      haptic="medium"
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2 size={16} color={theme.textTertiary} />
                    </HapticPressable>
                  )}
                </View>
              </View>
            </LiquidGlassCard>
          </Animated.View>
        ))}

        {filtered.length === 0 && (
          <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.emptyWrap}>
            <LinearGradient
              colors={colors.gradients.trainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIcon}
            >
              <BookOpen size={28} color="#fff" strokeWidth={2} />
            </LinearGradient>
            <Text style={[typography.body, { color: theme.textTertiary, marginTop: spacing.md }]}>
              Нет материалов
            </Text>
          </Animated.View>
        )}

        <View style={{ height: 140 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCard: { marginBottom: spacing.md },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500', padding: 0 },
  catScroll: { marginBottom: spacing.lg },
  catContainer: { gap: spacing.sm },
  catPill: {},
  catGradient: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  catInactive: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  materialCard: { marginBottom: spacing.sm },
  materialRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  playIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { gap: spacing.md, alignItems: 'center' },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.huge },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
