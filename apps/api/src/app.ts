import express from 'express'
import { healthRouter } from '@/routes/health'
import { tasksRouter } from '@/routes/tasks'
import { errorHandler } from '@/middlewares/error-handler'
import { injectUserId } from '@/middlewares/inject-user-id'
import { NotFoundError } from '@/errors/app-error'

export function createApp() {
  const app = express()

  app.use(express.json())
  app.use(injectUserId)
  app.use('/api/v1', healthRouter)
  app.use('/api/v1', tasksRouter)

  app.use((_req, _res, next) => {
    next(new NotFoundError('resource not found'))
  })

  app.use(errorHandler)

  return app
}
