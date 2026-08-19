import { Router } from 'express'
import type {
  EventCreateInput,
  EventIdParam,
  EventListQuery,
  EventUpdateInput,
} from '@my-daily-tasks/shared'
import {
  eventCreateSchema,
  eventIdParamSchema,
  eventListQuerySchema,
  eventUpdateSchema,
} from '@my-daily-tasks/shared'
import { validate } from '@/middlewares/validate'
import {
  createEvent,
  deleteEvent,
  getEvent,
  listEvents,
  updateEvent,
} from '@/services/event-service'

export const eventsRouter = Router()

// req.validated の絞り込み方針は routes/tasks.ts のコメントを参照。

eventsRouter.get('/events', validate({ query: eventListQuerySchema }), async (req, res) => {
  const query = req.validated?.query as EventListQuery
  const result = await listEvents(req.userId, query)
  res.json(result)
})

eventsRouter.post('/events', validate({ body: eventCreateSchema }), async (req, res) => {
  const body = req.validated?.body as EventCreateInput
  const event = await createEvent(req.userId, body)
  res.status(201).json(event)
})

eventsRouter.get('/events/:id', validate({ params: eventIdParamSchema }), async (req, res) => {
  const params = req.validated?.params as EventIdParam
  const event = await getEvent(req.userId, params.id)
  res.json(event)
})

eventsRouter.patch(
  '/events/:id',
  validate({ params: eventIdParamSchema, body: eventUpdateSchema }),
  async (req, res) => {
    const params = req.validated?.params as EventIdParam
    const body = req.validated?.body as EventUpdateInput
    const event = await updateEvent(req.userId, params.id, body)
    res.json(event)
  },
)

eventsRouter.delete('/events/:id', validate({ params: eventIdParamSchema }), async (req, res) => {
  const params = req.validated?.params as EventIdParam
  await deleteEvent(req.userId, params.id)
  res.status(204).end()
})
