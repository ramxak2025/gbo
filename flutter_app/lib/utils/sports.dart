const Map<String, String> sportTypes = {
  'bjj': 'Бразильское Джиу-Джитсу',
  'judo': 'Дзюдо',
  'wrestling': 'Борьба',
  'karate': 'Каратэ',
  'taekwondo': 'Тхэквондо',
  'boxing': 'Бокс',
  'muay_thai': 'Муай-тай',
  'mma': 'ММА',
  'sambo': 'Самбо',
  'kickboxing': 'Кикбоксинг',
  'aikido': 'Айкидо',
  'grappling': 'Грэпплинг',
  'other': 'Другой',
};

String getSportLabel(String? type) {
  if (type == null) return '—';
  return sportTypes[type] ?? type;
}

const Map<String, List<String>> beltColors = {
  'bjj': ['Белый', 'Синий', 'Пурпурный', 'Коричневый', 'Чёрный'],
  'grappling': ['Белый', 'Синий', 'Пурпурный', 'Коричневый', 'Чёрный'],
  'judo': ['Белый', 'Жёлтый', 'Оранжевый', 'Зелёный', 'Синий', 'Коричневый', 'Чёрный'],
  'karate': ['Белый', 'Жёлтый', 'Оранжевый', 'Зелёный', 'Синий', 'Коричневый', 'Чёрный'],
  'taekwondo': ['Белый', 'Жёлтый', 'Зелёный', 'Синий', 'Красный', 'Чёрный'],
};
