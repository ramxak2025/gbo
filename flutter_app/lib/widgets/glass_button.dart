/// Кнопка в стиле Liquid Glass
///
/// Полупрозрачная кнопка с размытием и анимацией нажатия.
/// Поддерживает разные стили: primary, danger, outline.
library;

import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Стиль кнопки
enum GlassButtonStyle {
  primary,
  danger,
  outline,
  glass,
}

/// Стеклянная кнопка с анимацией
class GlassButton extends StatefulWidget {
  final String label;
  final VoidCallback? onTap;
  final IconData? icon;
  final GlassButtonStyle style;
  final bool isLoading;
  final bool fullWidth;

  const GlassButton({
    super.key,
    required this.label,
    this.onTap,
    this.icon,
    this.style = GlassButtonStyle.primary,
    this.isLoading = false,
    this.fullWidth = true,
  });

  @override
  State<GlassButton> createState() => _GlassButtonState();
}

class _GlassButtonState extends State<GlassButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.97).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Color get _backgroundColor {
    switch (widget.style) {
      case GlassButtonStyle.primary:
        return LiquidGlassColors.primary;
      case GlassButtonStyle.danger:
        return LiquidGlassColors.danger;
      case GlassButtonStyle.outline:
        return Colors.transparent;
      case GlassButtonStyle.glass:
        return Colors.white.withValues(alpha: 0.1);
    }
  }

  Color get _textColor {
    switch (widget.style) {
      case GlassButtonStyle.primary:
      case GlassButtonStyle.danger:
        return Colors.white;
      case GlassButtonStyle.outline:
        return LiquidGlassColors.primary;
      case GlassButtonStyle.glass:
        return Colors.white;
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: child,
        );
      },
      child: GestureDetector(
        onTapDown: (_) => _controller.forward(),
        onTapUp: (_) {
          _controller.reverse();
          widget.onTap?.call();
        },
        onTapCancel: () => _controller.reverse(),
        child: Container(
          width: widget.fullWidth ? double.infinity : null,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          decoration: BoxDecoration(
            color: _backgroundColor,
            borderRadius: BorderRadius.circular(14),
            border: widget.style == GlassButtonStyle.outline
                ? Border.all(color: LiquidGlassColors.primary)
                : null,
          ),
          child: Row(
            mainAxisSize:
                widget.fullWidth ? MainAxisSize.max : MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (widget.isLoading)
                SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor:
                        AlwaysStoppedAnimation<Color>(_textColor),
                  ),
                )
              else ...[
                if (widget.icon != null) ...[
                  Icon(widget.icon, size: 18, color: _textColor),
                  const SizedBox(width: 8),
                ],
                Text(
                  widget.label,
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                    color: _textColor,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
