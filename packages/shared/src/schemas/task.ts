import { z } from 'zod'

export const taskStatusSchema = z.enum(['TODO', 'DOING', 'DONE'])
export type TaskStatus = z.infer<typeof taskStatusSchema>

export const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH'])
export type TaskPriority = z.infer<typeof taskPrioritySchema>

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  dueAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  sortOrder: z.number().int(),
  eventId: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type Task = z.infer<typeof taskSchema>

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1, 'title is required').max(200),
  description: z.string().trim().max(2000).optional(),
  priority: taskPrioritySchema.default('MEDIUM'),
  dueAt: z
    .string()
    .datetime()
    .transform((value) => new Date(value))
    .optional(),
})
// サーバー用（validateミドルウェア通過後）。dueAtはtransform済みでDate
export type TaskCreateInput = z.infer<typeof taskCreateSchema>
// フロント用（送信ペイロード）。dueAtはtransform前でstring
export type TaskCreateBody = z.input<typeof taskCreateSchema>

export const taskUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    priority: taskPrioritySchema.optional(),
    dueAt: z
      .string()
      .datetime()
      .transform((value) => new Date(value))
      .nullable()
      .optional(),
    status: taskStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'at least one field must be provided',
  })
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>
export type TaskUpdateBody = z.input<typeof taskUpdateSchema>

export const taskIdParamSchema = z.object({ id: z.string().cuid() })
export type TaskIdParam = z.infer<typeof taskIdParamSchema>

export const taskListQuerySchema = z.object({
  status: taskStatusSchema.optional(),
  dueBefore: z.coerce.date().optional(),
  tagId: z.string().cuid().optional(),
  q: z.string().trim().min(1).optional(),
})
export type TaskListQuery = z.infer<typeof taskListQuerySchema>

export const taskListResponseSchema = z.object({
  items: z.array(taskSchema),
  total: z.number().int().nonnegative(),
})
export type TaskListResponse = z.infer<typeof taskListResponseSchema>
