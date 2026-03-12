import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

class AvatarWidget extends StatelessWidget {
  final String? name;
  final String? src;
  final double size;

  const AvatarWidget({
    super.key,
    this.name,
    this.src,
    this.size = 44,
  });

  String get initials {
    if (name == null || name!.isEmpty) return '?';
    final parts = name!.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }

  Color get _color {
    if (name == null || name!.isEmpty) return Colors.grey;
    int hash = 0;
    for (int i = 0; i < name!.length; i++) {
      hash = name!.codeUnitAt(i) + ((hash << 5) - hash);
    }
    final colors = [
      const Color(0xFF8B5CF6),
      const Color(0xFFEF4444),
      const Color(0xFF3B82F6),
      const Color(0xFF22C55E),
      const Color(0xFFF97316),
      const Color(0xFFEC4899),
      const Color(0xFF06B6D4),
      const Color(0xFFA855F7),
    ];
    return colors[hash.abs() % colors.length];
  }

  @override
  Widget build(BuildContext context) {
    if (src != null && src!.isNotEmpty) {
      final imageUrl = src!.startsWith('http') ? src! : 'https://iborcuha.ru$src';
      return ClipRRect(
        borderRadius: BorderRadius.circular(size / 2),
        child: CachedNetworkImage(
          imageUrl: imageUrl,
          width: size,
          height: size,
          fit: BoxFit.cover,
          placeholder: (_, __) => _fallback(),
          errorWidget: (_, __, ___) => _fallback(),
        ),
      );
    }
    return _fallback();
  }

  Widget _fallback() {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [_color, _color.withOpacity(0.7)],
        ),
      ),
      child: Center(
        child: Text(
          initials,
          style: TextStyle(
            color: Colors.white,
            fontSize: size * 0.36,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }
}
