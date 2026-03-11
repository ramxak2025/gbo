/// Виджет аватара пользователя
///
/// Отображает фото пользователя или его инициалы
/// на цветном фоне. Поддерживает разные размеры.
library;

import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme/app_theme.dart';

/// Аватар пользователя с фоллбэком на инициалы
class AvatarWidget extends StatelessWidget {
  final String? imageUrl;
  final String name;
  final double size;
  final String? baseUrl;

  const AvatarWidget({
    super.key,
    this.imageUrl,
    required this.name,
    this.size = 44,
    this.baseUrl,
  });

  /// Получить инициалы из имени
  String get _initials {
    final parts = name.trim().split(' ');
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
  }

  /// Цвет фона на основе имени
  Color get _backgroundColor {
    final colors = [
      LiquidGlassColors.primary,
      LiquidGlassColors.success,
      LiquidGlassColors.purple,
      LiquidGlassColors.teal,
      LiquidGlassColors.warning,
      LiquidGlassColors.pink,
    ];
    final index = name.hashCode.abs() % colors.length;
    return colors[index];
  }

  @override
  Widget build(BuildContext context) {
    final hasImage = imageUrl != null && imageUrl!.isNotEmpty;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: _backgroundColor,
        boxShadow: [
          BoxShadow(
            color: _backgroundColor.withValues(alpha: 0.3),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: hasImage
          ? CachedNetworkImage(
              imageUrl: _resolveUrl(imageUrl!),
              fit: BoxFit.cover,
              placeholder: (context, url) => _initialsWidget(),
              errorWidget: (context, url, error) => _initialsWidget(),
            )
          : _initialsWidget(),
    );
  }

  Widget _initialsWidget() {
    return Center(
      child: Text(
        _initials,
        style: TextStyle(
          color: Colors.white,
          fontSize: size * 0.38,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  String _resolveUrl(String url) {
    if (url.startsWith('http')) return url;
    if (baseUrl != null) return '$baseUrl$url';
    return url;
  }
}
