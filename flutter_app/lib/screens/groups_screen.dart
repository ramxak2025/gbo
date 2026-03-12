import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/data_provider.dart';
import '../providers/theme_provider.dart';
import '../theme/app_theme.dart';
import '../models/models.dart';
import '../widgets/glass_card.dart';
import '../widgets/page_header.dart';

class GroupsScreen extends StatelessWidget {
  const GroupsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final data = context.watch<DataProvider>();
    final tp = context.watch<ThemeProvider>();
    final t = tp.theme;
    final isDark = tp.isDark;

    final isAdmin = auth.role == 'superadmin';
    final groups = isAdmin ? data.groups : data.groups.where((g) => g.trainerId == auth.userId).toList();

    return Scaffold(
      backgroundColor: t.bg,
      body: Stack(
        children: [
          Positioned(top: -80, left: -60, child: Container(
            width: 180, height: 180,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(colors: [AppColors.blue.withOpacity(0.12), Colors.transparent]),
            ),
          )),

          SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const PageHeader(title: 'Группы', showBack: true),

                if (groups.isEmpty)
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.all(40),
                      child: Column(
                        children: [
                          Icon(Icons.groups_outlined, size: 48, color: t.textMuted),
                          const SizedBox(height: 12),
                          Text('Нет групп', style: TextStyle(color: t.textMuted)),
                        ],
                      ),
                    ),
                  ),

                ...groups.map((group) {
                  final students = data.students.where((s) => s.groupId == group.id).toList();
                  final activeCount = students.where((s) => !s.isExpired).length;

                  return GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(14),
                                gradient: LinearGradient(
                                  colors: [
                                    AppColors.blue.withOpacity(isDark ? 0.2 : 0.1),
                                    AppColors.cyan.withOpacity(isDark ? 0.15 : 0.08),
                                  ],
                                ),
                              ),
                              child: Icon(Icons.groups, size: 20, color: isDark ? AppColors.blue : const Color(0xFF2563EB)),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(group.name, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: t.text)),
                                  if (group.schedule != null)
                                    Text(group.schedule!, style: TextStyle(fontSize: 12, color: t.textMuted)),
                                ],
                              ),
                            ),
                            // Stats
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.people_outline, size: 14, color: t.textSecondary),
                                    const SizedBox(width: 4),
                                    Text(students.length.toString(), style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: t.text)),
                                  ],
                                ),
                                Text('$activeCount акт.', style: TextStyle(fontSize: 10, color: AppColors.green, fontWeight: FontWeight.w600)),
                              ],
                            ),
                          ],
                        ),
                        if (group.cost != null) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Icon(Icons.payments_outlined, size: 14, color: t.textMuted),
                              const SizedBox(width: 6),
                              Text('${group.cost} \u20BD/мес', style: TextStyle(fontSize: 12, color: t.textSecondary)),
                            ],
                          ),
                        ],
                      ],
                    ),
                  );
                }),

                const SizedBox(height: 120),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: auth.role == 'trainer' ? FloatingActionButton(
        onPressed: () => _showAddGroup(context, t, isDark),
        backgroundColor: t.accent,
        child: const Icon(Icons.add, color: Colors.white),
      ) : null,
    );
  }

  void _showAddGroup(BuildContext context, dynamic t, bool isDark) {
    final nameCtrl = TextEditingController();
    final scheduleCtrl = TextEditingController();
    final costCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1A1A2E) : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withOpacity(0.3), borderRadius: BorderRadius.circular(2)))),
              const SizedBox(height: 20),
              Text('Новая группа', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: t.text)),
              const SizedBox(height: 16),
              _buildField('Название', nameCtrl, t),
              const SizedBox(height: 12),
              _buildField('Расписание', scheduleCtrl, t),
              const SizedBox(height: 12),
              _buildField('Стоимость', costCtrl, t, keyboard: TextInputType.number),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: t.accent,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  onPressed: () async {
                    if (nameCtrl.text.trim().isEmpty) return;
                    try {
                      await context.read<DataProvider>().addGroup({
                        'name': nameCtrl.text.trim(),
                        'schedule': scheduleCtrl.text.trim(),
                        'cost': int.tryParse(costCtrl.text) ?? 0,
                      });
                      if (ctx.mounted) Navigator.pop(ctx);
                    } catch (e) {
                      if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text(e.toString())));
                    }
                  },
                  child: const Text('Создать', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildField(String hint, TextEditingController ctrl, dynamic t, {TextInputType? keyboard}) {
    return TextField(
      controller: ctrl,
      keyboardType: keyboard,
      style: TextStyle(color: t.text),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: t.textMuted),
        filled: true,
        fillColor: t.input,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: t.inputBorder)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: t.inputBorder)),
      ),
    );
  }
}
