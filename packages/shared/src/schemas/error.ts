import { z } from 'zod'

export const appErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'BAD_REQUEST',
  'NOT_FOUND',
  'CONFLICT',
  'UNPROCESSABLE',
  'INTERNAL_ERROR',
])
export type ApiErrorCode = z.infer<typeof appErrorCodeSchema>

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: appErrorCodeSchema,
    message: z.string(),
    details: z.unknown(),
  }),
})
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>
