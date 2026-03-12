import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/data_provider.dart';
import '../providers/theme_provider.dart';
import '../theme/app_theme.dart';
import '../models/models.dart';
import '../widgets/page_header.dart';

class AddStudentScreen extends StatefulWidget {
  const AddStudentScreen({super.key});

  @override
  State<AddStudentScreen> createState() => _AddStudentScreenState();
}

class _AddStudentScreenState extends State<AddStudentScreen> {
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  int? _groupId;
  bool _loading = false;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final data = context.watch<DataProvider>();
    final tp = context.watch<ThemeProvider>();
    final t = tp.theme;
    final isDark = tp.isDark;

    final groups = data.groups.where((g) => g.trainerId == auth.userId).toList();

    return Scaffold(
      backgroundColor: t.bg,
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const PageHeader(title: 'Новый ученик', showBack: true),

            _buildField('Имя', _nameCtrl, t, isDark),
            const SizedBox(height: 12),
            _buildField('Телефон', _phoneCtrl, t, isDark, keyboard: TextInputType.phone),
            const SizedBox(height: 12),
            _buildField('Пароль', _passwordCtrl, t, isDark),
            const SizedBox(height: 12),

            // Group selector
            Container(
              decoration: BoxDecoration(
                color: t.input,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: t.inputBorder),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<int?>(
                  value: _groupId,
                  isExpanded: true,
                  hint: Text('Группа', style: TextStyle(color: t.textMuted)),
                  dropdownColor: isDark ? const Color(0xFF1A1A2E) : Colors.white,
                  style: TextStyle(color: t.text, fontSize: 14),
                  items: [
                    DropdownMenuItem<int?>(value: null, child: Text('Без группы')),
                    ...groups.map((g) => DropdownMenuItem<int?>(value: g.id, child: Text(g.name))),
                  ],
                  onChanged: (v) => setState(() => _groupId = v),
                ),
              ),
            ),

            const SizedBox(height: 24),

            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: t.accent,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                onPressed: _loading ? null : _submit,
                child: _loading
                    ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Добавить', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildField(String hint, TextEditingController ctrl, dynamic t, bool isDark, {TextInputType? keyboard}) {
    return Container(
      decoration: BoxDecoration(
        color: t.input,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: t.inputBorder),
      ),
      child: TextField(
        controller: ctrl,
        keyboardType: keyboard,
        style: TextStyle(color: t.text, fontSize: 15),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: t.textMuted),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (_nameCtrl.text.trim().isEmpty) return;
    setState(() => _loading = true);
    try {
      await context.read<DataProvider>().addStudent({
        'name': _nameCtrl.text.trim(),
        'phone': _phoneCtrl.text.trim(),
        'password': _passwordCtrl.text.trim(),
        if (_groupId != null) 'groupId': _groupId,
      });
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
    setState(() => _loading = false);
  }
}
