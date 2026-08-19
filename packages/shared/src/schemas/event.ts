import { z } from 'zod'

export const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  allDay: z.boolean(),
  location: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type Event = z.infer<typeof eventSchema>

export const eventCreateSchema = z.object({
  title: z.string().trim().min(1, 'title is required').max(200),
  description: z.string().trim().max(2000).optional(),
  startAt: z
    .string()
    .datetime()
    .transform((value) => new Date(value)),
  endAt: z
    .string()
    .datetime()
    .transform((value) => new Date(value)),
  allDay: z.boolean().default(false),
  location: z.string().trim().max(200).optional(),
})
// サーバー用（validateミドルウェア通過後）。startAt/endAtはtransform済みでDate
export type EventCreateInput = z.infer<typeof eventCreateSchema>
// フロント用（送信ペイロード）。startAt/endAtはtransform前でstring
export type EventCreateBody = z.input<typeof eventCreateSchema>

export const eventUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    startAt: z
      .string()
      .datetime()
      .transform((value) => new Date(value))
      .optional(),
    endAt: z
      .string()
      .datetime()
      .transform((value) => new Date(value))
      .optional(),
    allDay: z.boolean().optional(),
    location: z.string().trim().max(200).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'at least one field must be provided',
  })
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>
export type EventUpdateBody = z.input<typeof eventUpdateSchema>

export const eventIdParamSchema = z.object({ id: z.string().cuid() })
export type EventIdParam = z.infer<typeof eventIdParamSchema>

// from/toは api-design.md の仕様上必須（taskのdueBeforeとは異なりoptionalにしない）
export const eventListQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
})
export type EventListQuery = z.infer<typeof eventListQuerySchema>

export const eventListResponseSchema = z.object({
  items: z.array(eventSchema),
  total: z.number().int().nonnegative(),
})
export type EventListResponse = z.infer<typeof eventListResponseSchema>
