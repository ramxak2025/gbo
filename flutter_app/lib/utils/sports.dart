/// Справочник видов спорта
///
/// Список видов единоборств для выбора тренером.
/// Синхронизирован с веб-версией (src/utils/sports.js).
library;

/// Вид спорта с иконкой
class Sport {
  final String id;
  final String name;
  final String emoji;

  const Sport({
    required this.id,
    required this.name,
    required this.emoji,
  });
}

/// Список всех видов спорта
const List<Sport> sportsList = [
  Sport(id: 'mma', name: 'ММА', emoji: '\u{1F94A}'),
  Sport(id: 'boxing', name: 'Бокс', emoji: '\u{1F94A}'),
  Sport(id: 'kickboxing', name: 'Кикбоксинг', emoji: '\u{1F94B}'),
  Sport(id: 'muay_thai', name: 'Тайский бокс', emoji: '\u{1F94B}'),
  Sport(id: 'wrestling', name: 'Борьба', emoji: '\u{1F93C}'),
  Sport(id: 'judo', name: 'Дзюдо', emoji: '\u{1F94B}'),
  Sport(id: 'bjj', name: 'БЖЖ', emoji: '\u{1F94B}'),
  Sport(id: 'karate', name: 'Карате', emoji: '\u{1F94B}'),
  Sport(id: 'taekwondo', name: 'Тхэквондо', emoji: '\u{1F94B}'),
  Sport(id: 'sambo', name: 'Самбо', emoji: '\u{1F93C}'),
  Sport(id: 'aikido', name: 'Айкидо', emoji: '\u{1F94B}'),
  Sport(id: 'krav_maga', name: 'Крав-мага', emoji: '\u{1F94A}'),
  Sport(id: 'fencing', name: 'Фехтование', emoji: '\u{2694}'),
  Sport(id: 'other', name: 'Другое', emoji: '\u{1F3CB}'),
];

/// Найти вид спорта по ID
Sport? findSport(String? id) {
  if (id == null) return null;
  try {
    return sportsList.firstWhere((s) => s.id == id);
  } catch (_) {
    return null;
  }
}

/// Получить название вида спорта
String sportName(String? id) {
  return findSport(id)?.name ?? id ?? '';
}
