import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Linking,
  StyleSheet,
} from 'react-native';
import {
  Plus,
  Trash2,
  Film,
  Play,
  X,
  Link2,
  Search,
  Heart,
  Video,
  Upload,
  Edit3,
  Layers,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import { api } from '../utils/api';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';

const CATEGORIES = [
  'Все',
  'Техника',
  'Разминка',
  'Растяжка',
  'Сила',
  'Тактика',
  'Соревнования',
];

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

function getThumbnail(url) {
  const ytId = getYouTubeId(url);
  if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  return null;
}

export default function MaterialsScreen({ navigation }) {
  const { dark } = useTheme();
  const c = getColors(dark);
  const { auth } = useAuth();
  const { data, addMaterial, updateMaterial, deleteMaterial } = useData();

  const isTrainer = auth?.role === 'trainer' || auth?.role === 'admin';

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Все');
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [categoryDrawer, setCategoryDrawer] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    category: 'Техника',
    groupId: '',
  });

  const groups = data.groups || [];

  const filtered = useMemo(() => {
    let list = data.materials || [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.title?.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q),
      );
    }
    if (category !== 'Все') {
      list = list.filter((m) => m.category === category);
    }
    if (showFavorites) {
      list = list.filter((m) => favorites.includes(m.id));
    }
    return list;
  }, [data.materials, search, category, showFavorites, favorites]);

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm({ title: '', description: '', videoUrl: '', category: 'Техника', groupId: '' });
    setModalVisible(true);
  };

  const openEdit = (material) => {
    setEditingId(material.id);
    setForm({
      title: material.title || '',
      description: material.description || '',
      videoUrl: material.videoUrl || '',
      category: material.category || 'Техника',
      groupId: material.groupId || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert('Ошибка', 'Введите название');
      return;
    }
    try {
      if (editingId) {
        await updateMaterial(editingId, form);
      } else {
        await addMaterial(form);
      }
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Удалить материал?', 'Это действие нельзя отменить', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMaterial(id);
          } catch (e) {
            Alert.alert('Ошибка', e.message);
          }
        },
      },
    ]);
  };

  const openVideo = (url) => {
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader title="Материалы" back onBack={() => navigation.goBack()}>
        {isTrainer && (
          <TouchableOpacity onPress={openAdd} style={styles.headerBtn}>
            <Plus size={20} color={c.purple} />
          </TouchableOpacity>
        )}
      </PageHeader>

      {/* Search + filters */}
      <View style={styles.filterRow}>
        <View style={[styles.searchWrap, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
          <Search size={18} color={c.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: c.text }]}
            placeholder="Поиск..."
            placeholderTextColor={c.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color={c.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}
          onPress={() => setCategoryDrawer(true)}
        >
          <Layers size={18} color={c.purple} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            { backgroundColor: showFavorites ? c.redBg : c.inputBg, borderColor: showFavorites ? c.red : c.inputBorder },
          ]}
          onPress={() => setShowFavorites((v) => !v)}
        >
          <Heart
            size={18}
            color={showFavorites ? c.red : c.textTertiary}
            fill={showFavorites ? c.red : 'none'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 && (
          <View style={styles.centered}>
            <Film size={48} color={c.textTertiary} />
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>
              Нет материалов
            </Text>
          </View>
        )}

        {filtered.map((material) => {
          const thumb = getThumbnail(material.videoUrl);
          const isFav = favorites.includes(material.id);

          return (
            <GlassCard key={material.id} style={styles.materialCard}>
              {/* Thumbnail */}
              <TouchableOpacity
                style={styles.thumbnailWrap}
                onPress={() => openVideo(material.videoUrl)}
                activeOpacity={0.8}
              >
                {thumb ? (
                  <Image source={{ uri: thumb }} style={styles.thumbnail} />
                ) : (
                  <View style={[styles.thumbnailPlaceholder, { backgroundColor: c.purpleBg }]}>
                    <Video size={32} color={c.purple} />
                  </View>
                )}
                <View style={styles.playOverlay}>
                  <View style={styles.playBtn}>
                    <Play size={20} color="#fff" fill="#fff" />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Content */}
              <View style={styles.materialContent}>
                <View style={styles.materialHeader}>
                  <Text style={[styles.materialTitle, { color: c.text }]} numberOfLines={2}>
                    {material.title}
                  </Text>
                  <TouchableOpacity onPress={() => toggleFavorite(material.id)}>
                    <Heart
                      size={20}
                      color={isFav ? c.red : c.textTertiary}
                      fill={isFav ? c.red : 'none'}
                    />
                  </TouchableOpacity>
                </View>

                {material.description ? (
                  <Text
                    style={[styles.materialDesc, { color: c.textSecondary }]}
                    numberOfLines={2}
                  >
                    {material.description}
                  </Text>
                ) : null}

                <View style={styles.materialFooter}>
                  {material.category ? (
                    <View style={[styles.categoryBadge, { backgroundColor: c.purpleBg }]}>
                      <Text style={[styles.categoryBadgeText, { color: c.purple }]}>
                        {material.category}
                      </Text>
                    </View>
                  ) : null}

                  {isTrainer && (
                    <View style={styles.materialActions}>
                      <TouchableOpacity
                        onPress={() => openEdit(material)}
                        style={styles.actionBtn}
                      >
                        <Edit3 size={16} color={c.purple} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(material.id)}
                        style={styles.actionBtn}
                      >
                        <Trash2 size={16} color={c.red} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </GlassCard>
          );
        })}
      </ScrollView>

      {/* Category drawer */}
      <Modal
        visible={categoryDrawer}
        onClose={() => setCategoryDrawer(false)}
        title="Категории"
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryItem,
              { borderColor: c.inputBorder },
              category === cat && { borderColor: c.purple, backgroundColor: c.purpleBg },
            ]}
            onPress={() => {
              setCategory(cat);
              setCategoryDrawer(false);
            }}
          >
            <Text
              style={[
                styles.categoryItemText,
                { color: c.textSecondary },
                category === cat && { color: c.purple },
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </Modal>

      {/* Add/Edit modal */}
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={editingId ? 'Редактировать' : 'Новый материал'}
      >
        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Название</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          value={form.title}
          onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
          placeholderTextColor={c.textTertiary}
          placeholder="Название видео"
        />

        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Описание</Text>
        <TextInput
          style={[styles.input, styles.inputMulti, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          value={form.description}
          onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
          placeholderTextColor={c.textTertiary}
          placeholder="Описание материала"
          multiline
          numberOfLines={3}
        />

        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Ссылка на видео</Text>
        <View style={[styles.urlRow, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
          <Link2 size={16} color={c.textTertiary} />
          <TextInput
            style={[styles.urlInput, { color: c.text }]}
            value={form.videoUrl}
            onChangeText={(v) => setForm((f) => ({ ...f, videoUrl: v }))}
            placeholderTextColor={c.textTertiary}
            placeholder="https://youtube.com/..."
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Категория</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.filter((ct) => ct !== 'Все').map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.chip,
                { borderColor: c.inputBorder, backgroundColor: c.inputBg },
                form.category === cat && { borderColor: c.purple, backgroundColor: c.purpleBg },
              ]}
              onPress={() => setForm((f) => ({ ...f, category: cat }))}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: c.textSecondary },
                  form.category === cat && { color: c.purple },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Группа (доступ)</Text>
        <View style={styles.chipRow}>
          <TouchableOpacity
            style={[
              styles.chip,
              { borderColor: c.inputBorder, backgroundColor: c.inputBg },
              !form.groupId && { borderColor: c.purple, backgroundColor: c.purpleBg },
            ]}
            onPress={() => setForm((f) => ({ ...f, groupId: '' }))}
          >
            <Text
              style={[
                styles.chipText,
                { color: c.textSecondary },
                !form.groupId && { color: c.purple },
              ]}
            >
              Все группы
            </Text>
          </TouchableOpacity>
          {groups.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[
                styles.chip,
                { borderColor: c.inputBorder, backgroundColor: c.inputBg },
                form.groupId === g.id && { borderColor: c.purple, backgroundColor: c.purpleBg },
              ]}
              onPress={() => setForm((f) => ({ ...f, groupId: g.id }))}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: c.textSecondary },
                  form.groupId === g.id && { color: c.purple },
                ]}
              >
                {g.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>
            {editingId ? 'Сохранить' : 'Добавить'}
          </Text>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  materialCard: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  thumbnailWrap: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialContent: {
    padding: 16,
  },
  materialHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  materialTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  materialDesc: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  materialFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  materialActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  categoryItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  inputMulti: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    gap: 8,
  },
  urlInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    marginTop: 24,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#a855f7',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
