const now = new Date().toISOString()
const inMonth = new Date(Date.now() + 30 * 86400000).toISOString()
const expired = new Date(Date.now() - 5 * 86400000).toISOString()

export const seedData = {
  users: [
    {
      id: 'u1',
      name: 'Администратор',
      email: 'admin@iborcuha.com',
      password: 'admin123',
      role: 'superadmin',
      avatar: null,
      phone: '+7 900 000-00-00',
      clubName: 'iBorcuha HQ',
    },
    {
      id: 'u2',
      name: 'Рустам Хабилов',
      email: 'rustam@club.com',
      password: 'trainer123',
      role: 'trainer',
      avatar: null,
      phone: '+7 900 111-11-11',
      clubName: 'Ахмат Fight Club',
    },
    {
      id: 'u3',
      name: 'Камил Гаджиев',
      email: 'kamil@club.com',
      password: 'trainer123',
      role: 'trainer',
      avatar: null,
      phone: '+7 900 222-22-22',
      clubName: 'Eagle MMA',
    },
  ],

  groups: [
    { id: 'g1', trainerId: 'u2', name: 'Утро 09:00', schedule: 'Пн, Ср, Пт — 09:00', subscriptionCost: 5000 },
    { id: 'g2', trainerId: 'u2', name: 'Вечер 19:00', schedule: 'Пн, Ср, Пт — 19:00', subscriptionCost: 6000 },
    { id: 'g3', trainerId: 'u3', name: 'Основная', schedule: 'Вт, Чт, Сб — 18:00', subscriptionCost: 5500 },
  ],

  students: [
    {
      id: 's1', trainerId: 'u2', groupId: 'g1',
      name: 'Алихан Магомедов', phone: '+7 900 301-01-01',
      weight: 77, belt: 'Синий', birthDate: '2000-03-15',
      avatar: null, subscriptionExpiresAt: inMonth, createdAt: now,
      login: 'alikhan', password: 'student123',
    },
    {
      id: 's2', trainerId: 'u2', groupId: 'g1',
      name: 'Тимур Валиев', phone: '+7 900 302-02-02',
      weight: 84, belt: 'Фиолетовый', birthDate: '1998-07-22',
      avatar: null, subscriptionExpiresAt: expired, createdAt: now,
      login: 'timur', password: 'student123',
    },
    {
      id: 's3', trainerId: 'u2', groupId: 'g2',
      name: 'Заур Рахманов', phone: '+7 900 303-03-03',
      weight: 93, belt: 'Белый', birthDate: '2002-11-01',
      avatar: null, subscriptionExpiresAt: inMonth, createdAt: now,
      login: 'zaur', password: 'student123',
    },
    {
      id: 's4', trainerId: 'u3', groupId: 'g3',
      name: 'Магомед Исмаилов', phone: '+7 900 304-04-04',
      weight: 93, belt: 'Коричневый', birthDate: '1995-01-10',
      avatar: null, subscriptionExpiresAt: inMonth, createdAt: now,
      login: 'magomed', password: 'student123',
    },
    {
      id: 's5', trainerId: 'u3', groupId: 'g3',
      name: 'Ислам Махачев', phone: '+7 900 305-05-05',
      weight: 70, belt: 'Черный', birthDate: '1991-09-27',
      avatar: null, subscriptionExpiresAt: expired, createdAt: now,
      login: 'islam', password: 'student123',
    },
  ],

  transactions: [
    { id: 't1', trainerId: 'u2', type: 'income', amount: 5000, category: 'Абонемент', description: 'Оплата — Алихан Магомедов', studentId: 's1', date: now },
    { id: 't2', trainerId: 'u2', type: 'expense', amount: 15000, category: 'Аренда', description: 'Аренда зала — январь', studentId: null, date: now },
    { id: 't3', trainerId: 'u3', type: 'income', amount: 5500, category: 'Абонемент', description: 'Оплата — Магомед Исмаилов', studentId: 's4', date: now },
  ],

  tournaments: [
    {
      id: 'tour1',
      title: 'ADCC Moscow Open 2026',
      coverImage: null,
      date: '2026-04-15',
      location: 'Москва, СК "Лужники"',
      description: 'Открытый турнир по грэпплингу по правилам ADCC. Весовые категории: 66, 77, 88, 99, +99 кг. Регистрация до 1 апреля. Награждение: медали + денежные призы для абсолютной категории.',
      createdBy: 'u1',
    },
    {
      id: 'tour2',
      title: 'BJJ Pro Championship',
      coverImage: null,
      date: '2026-05-20',
      location: 'Санкт-Петербург, Юбилейный',
      description: 'Профессиональный чемпионат по бразильскому джиу-джитсу. Gi и No-Gi дивизионы. Белые-Черные пояса.',
      createdBy: 'u1',
    },
  ],

  news: [
    { id: 'n1', trainerId: 'u2', groupId: 'g1', title: 'Смена расписания', content: 'С 1 марта тренировки по понедельникам переносятся на 10:00.', date: now },
    { id: 'n2', trainerId: 'u3', groupId: 'g3', title: 'Открытый мат', content: 'В субботу проводим открытую тренировку. Можно приглашать друзей!', date: now },
  ],
}
