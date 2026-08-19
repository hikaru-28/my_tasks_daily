import type { RequestHandler } from 'express'
import { getDevUserId } from '@/services/dev-user-service'

export const injectUserId: RequestHandler = async (req, _res, next) => {
  req.userId = await getDevUserId()
  next()
}
