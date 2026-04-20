/**
 * iBorcuha — Shared Zod schemas
 *
 * Эти схемы используются одновременно веб-клиентом, мобильным клиентом
 * и серверной валидацией. Контракт один — расхождений между платформами нет.
 *
 * Import:
 *   // web:    import { LoginInput } from '../../shared/schemas/index.js'
 *   // mobile: import { LoginInput } from '../../../shared/schemas/index.js'
 *   // server: import { LoginInput } from '../../shared/schemas/index.js'
 */
import { z } from 'zod'

// ---------- Primitives ----------
export const PhoneSchema = z
  .string()
  .transform((s) => s.replace(/\D/g, ''))
  .refine((digits) => digits.length >= 10 && digits.length <= 15, {
    message: 'Некорректный номер телефона (10–15 цифр)',
  })

export const PasswordSchema = z
  .string()
  .min(6, 'Пароль должен быть от 6 символов')
  .max(128, 'Пароль не должен превышать 128 символов')

export const NameSchema = z
  .string()
  .trim()
  .min(1, 'Имя обязательно')
  .max(255, 'Имя не должно превышать 255 символов')

export const IdSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_-]{1,64}$/, 'Некорректный ID')

export const IsoDateSchema = z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
  message: 'Некорректная дата',
})

export const AmountSchema = z
  .number({ error: 'Сумма обязательна' })
  .positive('Сумма должна быть положительной')
  .max(99_999_999, 'Слишком большая сумма')

export const SportTypeSchema = z.enum(['bjj', 'mma', 'boxing', 'wrestling', 'judo', 'karate', 'kickboxing', 'muaythai', 'grappling', 'other'])

export const RoleSchema = z.enum(['superadmin', 'trainer', 'student'])

// ---------- Auth ----------
export const LoginInput = z.object({
  phone: PhoneSchema,
  password: PasswordSchema,
})

export const RegisterInput = z.object({
  name: NameSchema,
  phone: PhoneSchema,
  password: PasswordSchema,
  clubName: z.string().max(255).optional(),
  sportType: SportTypeSchema.optional().nullable(),
  city: z.string().max(255).optional().nullable(),
  consent: z.literal(true, { error: 'Необходимо согласие на обработку персональных данных' }),
})

// ---------- Students ----------
export const StudentCreateInput = z.object({
  name: NameSchema,
  phone: PhoneSchema,
  password: PasswordSchema.optional(),
  weight: z.number().positive().max(300).optional().nullable(),
  belt: z.string().max(50).optional().nullable(),
  birthDate: IsoDateSchema.optional().nullable(),
  avatar: z.string().optional().nullable(),
  groupId: IdSchema.optional().nullable(),
  trainerId: IdSchema.optional(),
  subscriptionExpiresAt: IsoDateSchema.optional().nullable(),
  trainingStartDate: IsoDateSchema.optional().nullable(),
})

export const StudentUpdateInput = StudentCreateInput.partial().extend({
  status: z.enum(['sick', 'injury', 'skip']).nullable().optional(),
})

// ---------- Groups ----------
export const GroupCreateInput = z.object({
  name: NameSchema,
  schedule: z.string().max(255).optional(),
  subscriptionCost: z.number().nonnegative().max(9_999_999).optional(),
  sportType: SportTypeSchema.optional().nullable(),
  trainerId: IdSchema.optional(),
})

export const GroupUpdateInput = GroupCreateInput.partial().extend({
  attendanceEnabled: z.boolean().optional(),
  pinnedMaterialId: IdSchema.nullable().optional(),
})

// ---------- Transactions ----------
export const TransactionCreateInput = z.object({
  type: z.enum(['income', 'expense']),
  amount: AmountSchema,
  category: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  studentId: IdSchema.optional().nullable(),
  trainerId: IdSchema.optional(),
})

export const TransactionUpdateInput = TransactionCreateInput.partial()

// ---------- Tournaments ----------
export const TournamentCreateInput = z.object({
  title: NameSchema,
  date: IsoDateSchema,
  location: z.string().max(255).optional(),
  description: z.string().max(4000).optional(),
  coverImage: z.string().optional().nullable(),
})

export const TournamentUpdateInput = TournamentCreateInput.partial()

// ---------- Attendance ----------
export const AttendanceRecordInput = z.object({
  groupId: IdSchema,
  studentId: IdSchema,
  date: IsoDateSchema,
  present: z.boolean().default(true),
})

export const AttendanceBulkInput = z.object({
  groupId: IdSchema,
  date: IsoDateSchema,
  records: z.array(z.object({
    studentId: IdSchema,
    present: z.boolean(),
  })).min(1),
})

// ---------- Trainer (admin) ----------
export const TrainerCreateInput = z.object({
  name: NameSchema,
  phone: PhoneSchema,
  password: PasswordSchema.optional(),
  clubName: z.string().max(255).optional(),
  avatar: z.string().optional().nullable(),
  sportType: SportTypeSchema.optional().nullable(),
  sportTypes: z.array(SportTypeSchema).optional(),
  city: z.string().max(255).optional().nullable(),
})

export const TrainerUpdateInput = TrainerCreateInput.partial().extend({
  materialCategories: z.array(z.string().max(100)).optional(),
})

// ---------- Materials ----------
export const MaterialCreateInput = z.object({
  title: NameSchema,
  description: z.string().max(4000).optional(),
  videoUrl: z.string().url('Некорректная ссылка на видео'),
  groupIds: z.array(IdSchema).default([]),
  category: z.string().max(100).optional(),
  customThumb: z.string().optional().nullable(),
  trainerId: IdSchema.optional(),
})

export const MaterialUpdateInput = MaterialCreateInput.partial()

// ---------- Clubs (admin) ----------
export const ClubCreateInput = z.object({
  name: NameSchema,
  city: z.string().max(255).optional(),
  sportTypes: z.array(SportTypeSchema).default([]),
  headTrainerId: IdSchema.optional().nullable(),
})

export const ClubUpdateInput = ClubCreateInput.partial()

// ---------- Internal Tournaments ----------
export const InternalTournamentCreateInput = z.object({
  title: NameSchema,
  date: IsoDateSchema.optional().nullable(),
  brackets: z.object({
    categories: z.array(z.any()).optional(),
    weightClass: z.string().optional(),
    rounds: z.array(z.any()).optional(),
    participants: z.array(z.any()).optional(),
  }).default({}),
  sportType: SportTypeSchema.optional().nullable(),
  coverImage: z.string().optional().nullable(),
})

export const InternalTournamentUpdateInput = InternalTournamentCreateInput.partial().extend({
  status: z.enum(['active', 'finished', 'cancelled']).optional(),
})

// ---------- News ----------
export const NewsCreateInput = z.object({
  title: NameSchema,
  content: z.string().max(10000).optional(),
  groupId: IdSchema.optional().nullable(),
  trainerId: IdSchema.optional(),
})

// ---------- Push / Notifications ----------
export const PushSubscriptionInput = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
})

export const ExpoPushTokenInput = z.object({
  token: z.string().min(10),
  platform: z.enum(['ios', 'android']).optional(),
})

export const NotificationSettingsInput = z.object({
  news: z.boolean().optional(),
  tournaments: z.boolean().optional(),
  payments: z.boolean().optional(),
  schedule: z.boolean().optional(),
})

// ---------- Author info ----------
export const AuthorInfoInput = z.object({
  name: z.string().max(255).optional(),
  instagram: z.string().max(255).optional(),
  website: z.string().max(500).optional(),
  description: z.string().max(4000).optional(),
  phone: z.string().max(50).optional(),
})

// ---------- Helpers ----------
/**
 * Парсит данные через zod-схему и возвращает { success, data, error }.
 * Единообразный формат для клиентской валидации форм.
 */
export function safeParse(schema, input) {
  const result = schema.safeParse(input)
  if (result.success) return { success: true, data: result.data }
  const errors = {}
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_'
    if (!errors[key]) errors[key] = issue.message
  }
  return { success: false, errors }
}
