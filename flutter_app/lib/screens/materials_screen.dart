/// Экран материалов (видеотека)
///
/// Список учебных видеоматериалов.
/// Тренер может добавлять, категоризировать
/// и привязывать видео к группам.
library;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../providers/auth_provider.dart';
import '../providers/data_provider.dart';
import '../providers/theme_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import '../widgets/glass_button.dart';
import '../widgets/glass_modal.dart';
import '../widgets/page_header.dart';

/// Экран материалов
class MaterialsScreen extends StatefulWidget {
  const MaterialsScreen({super.key});

  @override
  State<MaterialsScreen> createState() => _MaterialsScreenState();
}

class _MaterialsScreenState extends State<MaterialsScreen> {
  String _categoryFilter = 'all';

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDark;
    final auth = context.watch<AuthProvider>();
    final data = context.watch<DataProvider>();

    final materials = data.materials;
    final filtered = _categoryFilter == 'all'
        ? materials
        : materials.where((m) => m.category == _categoryFilter).toList();

    // Уникальные категории
    final categories = <String>{'all'};
    for (final m in materials) {
      categories.add(m.category);
    }

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LiquidGlassColors.backgroundGradient(isDark: isDark),
        ),
        child: SafeArea(
          child: Column(
            children: [
              PageHeader(
                title: 'Материалы',
                showBack: true,
                actions: auth.isTrainer
                    ? [
                        GestureDetector(
                          onTap: () => _showAddMaterial(context),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: LiquidGlassColors.primary
                                  .withValues(alpha: 0.15),
                            ),
                            child: const Icon(
                              LucideIcons.plus,
                              color: LiquidGlassColors.primary,
                              size: 20,
                            ),
                          ),
                        ),
                      ]
                    : null,
              ),

              // Фильтры категорий
              if (categories.length > 1)
                SizedBox(
                  height: 36,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: categories.map((cat) {
                      final isActive = _categoryFilter == cat;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: GestureDetector(
                          onTap: () =>
                              setState(() => _categoryFilter = cat),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: isActive
                                  ? LiquidGlassColors.primary
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: isActive
                                    ? LiquidGlassColors.primary
                                    : LiquidGlassColors.primary
                                        .withValues(alpha: 0.3),
                              ),
                            ),
                            child: Text(
                              cat == 'all'
                                  ? 'Все'
                                  : _categoryName(cat),
                              style: TextStyle(
                                color: isActive
                                    ? Colors.white
                                    : LiquidGlassColors.primary,
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),

              const SizedBox(height: 12),

              // Список материалов
              Expanded(
                child: filtered.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              LucideIcons.video,
                              size: 48,
                              color: Colors.grey.withValues(alpha: 0.3),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Нет материалов',
                              style:
                                  Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding:
                            const EdgeInsets.fromLTRB(16, 0, 16, 24),
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final material = filtered[index];

                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: GlassCard(
                              onTap: () =>
                                  _openVideo(material.videoUrl),
                              child: Row(
                                children: [
                                  // Превью
                                  Container(
                                    width: 64,
                                    height: 48,
                                    decoration: BoxDecoration(
                                      borderRadius:
                                          BorderRadius.circular(8),
                                      color: LiquidGlassColors.teal
                                          .withValues(alpha: 0.15),
                                    ),
                                    child: const Icon(
                                      LucideIcons.play,
                                      color: LiquidGlassColors.teal,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          material.title,
                                          style: Theme.of(context)
                                              .textTheme
                                              .titleMedium,
                                          maxLines: 1,
                                          overflow:
                                              TextOverflow.ellipsis,
                                        ),
                                        if (material
                                            .description.isNotEmpty)
                                          Text(
                                            material.description,
                                            style: Theme.of(context)
                                                .textTheme
                                                .bodySmall,
                                            maxLines: 1,
                                            overflow:
                                                TextOverflow.ellipsis,
                                          ),
                                        Text(
                                          _categoryName(
                                              material.category),
                                          style: TextStyle(
                                            fontSize: 11,
                                            color:
                                                LiquidGlassColors.primary,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (auth.isTrainer)
                                    IconButton(
                                      icon: const Icon(
                                        LucideIcons.trash2,
                                        size: 18,
                                        color: LiquidGlassColors.danger,
                                      ),
                                      onPressed: () async {
                                        await data.deleteMaterial(
                                            material.id);
                                      },
                                    ),
                                ],
                              ),
                            )
                                .animate()
                                .fadeIn(
                                    delay: Duration(
                                        milliseconds: index * 60))
                                .slideX(begin: 0.05),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _categoryName(String category) {
    switch (category) {
      case 'technique':
        return 'Техника';
      case 'sparring':
        return 'Спарринг';
      case 'warmup':
        return 'Разминка';
      case 'strength':
        return 'Сила';
      case 'other':
        return 'Другое';
      default:
        return category;
    }
  }

  Future<void> _openVideo(String url) async {
    final uri = Uri.tryParse(url);
    if (uri != null) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _showAddMaterial(BuildContext context) {
    final titleController = TextEditingController();
    final descController = TextEditingController();
    final urlController = TextEditingController();

    showGlassModal(
      context: context,
      title: 'Новый материал',
      child: Column(
        children: [
          TextField(
            controller: titleController,
            decoration: const InputDecoration(hintText: 'Название'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: descController,
            decoration: const InputDecoration(hintText: 'Описание'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: urlController,
            decoration:
                const InputDecoration(hintText: 'Ссылка на видео'),
          ),
          const SizedBox(height: 20),
          GlassButton(
            label: 'Добавить',
            onTap: () async {
              if (titleController.text.isEmpty ||
                  urlController.text.isEmpty) {
                return;
              }
              await context.read<DataProvider>().addMaterial({
                'title': titleController.text,
                'description': descController.text,
                'videoUrl': urlController.text,
              });
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
        ],
      ),
    );
  }
}
