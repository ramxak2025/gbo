import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, RefreshControl, Dimensions, Linking, Alert,
  ActivityIndicator, Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', label: 'Все' },
  { id: 'technique', label: 'Техника' },
  { id: 'training', label: 'Тренировки' },
  { id: 'competition', label: 'Соревнования' },
  { id: 'theory', label: 'Теория' },
  { id: 'motivation', label: 'Мотивация' },
  { id: 'other', label: 'Другое' },
];

function detectVideoType(url) {
  if (!url) return null;
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vk.com') || url.includes('vk.video')) return 'vk';
  return 'other';
}

function getYoutubeThumbnail(url) {
  if (!url) return null;
  let videoId = null;
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split(/[?&#]/)[0];
  } else if (url.includes('youtube.com')) {
    const match = url.match(/[?&]v=([^&#]+)/);
    videoId = match?.[1];
  }
  return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
}

function getVideoTypeLabel(type) {
  switch (type) {
    case 'youtube': return 'YouTube';
    case 'vk': return 'VK Video';
    default: return 'Видео';
  }
}

function getVideoTypeColor(type, c) {
  switch (type) {
    case 'youtube': return { bg: c.redBg, text: c.red };
    case 'vk': return { bg: c.blueBg, text: c.blue };
    default: return { bg: c.purpleBg, text: c.purple };
  }
}

export default function MaterialsScreen() {
  const { dark } = useTheme();
  const { auth } = useAuth();
  const { data, loading, reload, addMaterial, deleteMaterial } = useData();
  const c = getColors(dark);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add form state
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState('technique');
  const [newDescription, setNewDescription] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const isAdmin = auth?.role === 'superadmin' || auth?.role === 'trainer' || auth?.role === 'club_admin';

  const filteredMaterials = useMemo(() => {
    let list = data.materials || [];

    if (activeCategory !== 'all') {
      list = list.filter(m => m.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m =>
        m.title?.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q),
      );
    }

    return list;
  }, [data.materials, activeCategory, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const openVideo = useCallback((url) => {
    if (url) Linking.openURL(url).catch(() => {});
  }, []);

  const handleAddMaterial = useCallback(async () => {
    if (!newTitle.trim()) { Alert.alert('Ошибка', 'Введите название'); return; }
    if (!newUrl.trim()) { Alert.alert('Ошибка', 'Введите ссылку'); return; }

    setSaving(true);
    try {
      await addMaterial({
        title: newTitle.trim(),
        url: newUrl.trim(),
        category: newCategory,
        description: newDescription.trim(),
        videoType: detectVideoType(newUrl.trim()),
      });
      setAddModal(false);
      setNewTitle('');
      setNewUrl('');
      setNewCategory('technique');
      setNewDescription('');
    } catch (e) {
      Alert.alert('Ошибка', e.message || 'Не удалось добавить материал');
    } finally {
      setSaving(false);
    }
  }, [newTitle, newUrl, newCategory, newDescription, addMaterial]);

  const handleDelete = useCallback((materialId, title) => {
    Alert.alert('Удалить?', `Удалить "${title}"?`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить', style: 'destructive', onPress: async () => {
          try {
            await deleteMaterial(materialId);
          } catch (e) {
            Alert.alert('Ошибка', e.message);
          }
        },
      },
    ]);
  }, [deleteMaterial]);

  const renderVideoCard = (material) => {
    const videoType = material.videoType || detectVideoType(material.url);
    const thumbnail = videoType === 'youtube' ? getYoutubeThumbnail(material.url) : null;
    const typeColor = getVideoTypeColor(videoType, c);
    const categoryObj = CATEGORIES.find(cat => cat.id === material.category);

    return (
      <TouchableOpacity
        key={material.id}
        activeOpacity={0.7}
        onPress={() => openVideo(material.url)}
      >
        <GlassCard style={styles.videoCard}>
          {/* Thumbnail */}
          {thumbnail ? (
            <View style={styles.thumbnailContainer}>
              <Image
                source={{ uri: thumbnail }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
              <View style={styles.playOverlay}>
                <View style={styles.playButton}>
                  <Ionicons name="play" size={24} color="#fff" />
                </View>
              </View>
            </View>
          ) : (
            <View style={[styles.thumbnailFallback, { backgroundColor: c.glass }]}>
              <MaterialCommunityIcons
                name={videoType === 'vk' ? 'alpha-v-box' : 'play-circle-outline'}
                size={36}
                color={c.textTertiary}
              />
            </View>
          )}

          {/* Content */}
          <View style={styles.videoContent}>
            <View style={styles.videoHeader}>
              <View style={[styles.typeBadge, { backgroundColor: typeColor.bg }]}>
                <Text style={[styles.typeBadgeText, { color: typeColor.text }]}>
                  {getVideoTypeLabel(videoType)}
                </Text>
              </View>
              {categoryObj && categoryObj.id !== 'all' && (
                <View style={[styles.categoryBadge, { backgroundColor: c.purpleBg }]}>
                  <Text style={[styles.categoryBadgeText, { color: c.purple }]}>
                    {categoryObj.label}
                  </Text>
                </View>
              )}
            </View>

            <Text style={[styles.videoTitle, { color: c.text }]} numberOfLines={2}>
              {material.title}
            </Text>

            {material.description && (
              <Text style={[styles.videoDescription, { color: c.textSecondary }]} numberOfLines={2}>
                {material.description}
              </Text>
            )}

            {/* Admin delete */}
            {isAdmin && (
              <View style={styles.videoActions}>
                <TouchableOpacity
                  onPress={() => handleDelete(material.id, material.title)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={18} color={c.red} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <PageHeader title="Материалы" gradient />
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={c.purple} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader
        title="Материалы"
        gradient
        rightAction={
          isAdmin ? (
            <TouchableOpacity
              onPress={() => setAddModal(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.6}
            >
              <Ionicons name="add-circle-outline" size={24} color={c.purple} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchRow, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
          <Ionicons name="search-outline" size={18} color={c.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: c.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Поиск материалов..."
            placeholderTextColor={c.placeholder}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={c.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              {
                borderColor: activeCategory === cat.id ? c.purple : c.glassBorder,
                backgroundColor: activeCategory === cat.id ? c.purpleBg : c.glass,
              },
            ]}
            onPress={() => setActiveCategory(cat.id)}
          >
            <Text style={{
              color: activeCategory === cat.id ? c.purple : c.textSecondary,
              fontSize: 13,
              fontWeight: activeCategory === cat.id ? '700' : '500',
            }}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Materials List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.purple} />
        }
      >
        {filteredMaterials.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="video-off-outline" size={48} color={c.textTertiary} />
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>
              {searchQuery ? 'Ничего не найдено' : 'Нет материалов'}
            </Text>
          </View>
        ) : (
          filteredMaterials.map(m => renderVideoCard(m))
        )}
      </ScrollView>

      {/* Add Material Modal */}
      <Modal visible={addModal} onClose={() => setAddModal(false)} title="Добавить материал">
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: c.textSecondary }]}>Название *</Text>
          <TextInput
            style={[styles.formInput, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="Название видео"
            placeholderTextColor={c.placeholder}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: c.textSecondary }]}>Ссылка *</Text>
          <TextInput
            style={[styles.formInput, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            value={newUrl}
            onChangeText={setNewUrl}
            placeholder="https://youtube.com/watch?v=..."
            placeholderTextColor={c.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          {newUrl ? (
            <View style={[styles.urlPreview, { backgroundColor: c.glass }]}>
              <Text style={[styles.urlPreviewText, { color: c.textSecondary }]}>
                Тип: {getVideoTypeLabel(detectVideoType(newUrl))}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: c.textSecondary }]}>Категория</Text>
          <TouchableOpacity
            style={[styles.formInput, styles.pickerButton, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          >
            <Text style={{ color: c.text, fontSize: 15 }}>
              {CATEGORIES.find(cat => cat.id === newCategory)?.label || 'Выберите'}
            </Text>
            <Ionicons name={showCategoryPicker ? 'chevron-up' : 'chevron-down'} size={18} color={c.textSecondary} />
          </TouchableOpacity>
          {showCategoryPicker && (
            <View style={[styles.pickerList, { backgroundColor: c.card, borderColor: c.border }]}>
              {CATEGORIES.filter(cat => cat.id !== 'all').map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.pickerItem, newCategory === cat.id && { backgroundColor: c.purpleBg }]}
                  onPress={() => { setNewCategory(cat.id); setShowCategoryPicker(false); }}
                >
                  <Text style={{ color: newCategory === cat.id ? c.purple : c.text }}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: c.textSecondary }]}>Описание</Text>
          <TextInput
            style={[styles.formInput, styles.textArea, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            value={newDescription}
            onChangeText={setNewDescription}
            placeholder="Описание материала"
            placeholderTextColor={c.placeholder}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: c.purple, opacity: saving ? 0.7 : 1 }]}
          onPress={handleAddMaterial}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Добавить</Text>
            </>
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    height: 44,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  categoryScroll: {
    maxHeight: 48,
    marginTop: 4,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },

  // Video Card
  videoCard: {
    marginBottom: 12,
    padding: 0,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailFallback: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoContent: {
    padding: 14,
  },
  videoHeader: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: { fontSize: 11, fontWeight: '600' },
  videoTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  videoDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  videoActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: { fontSize: 15, fontWeight: '500' },

  // Form
  formGroup: { marginBottom: 16 },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 2,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  textArea: {
    height: 80,
    paddingTop: 14,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerList: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
  },
  pickerItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  urlPreview: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  urlPreviewText: { fontSize: 12 },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    marginTop: 8,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
