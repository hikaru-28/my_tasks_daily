import { Router } from 'express'
import { checkHealth } from '@/services/health-service'

export const healthRouter = Router()

healthRouter.get('/health', async (_req, res) => {
  const result = await checkHealth()
  res.json({ ...result, timestamp: new Date().toISOString() })
})
