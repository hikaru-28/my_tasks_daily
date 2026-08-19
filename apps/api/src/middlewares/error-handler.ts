import type { ErrorRequestHandler } from 'express'
import { AppError } from '@/errors/app-error'

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.status).json({
      error: { code: error.code, message: error.message, details: error.details ?? {} },
    })
    return
  }

  console.error(error)
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'internal server error', details: {} },
  })
}
