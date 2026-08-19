import { Router } from 'express'
import type {
  TaskCreateInput,
  TaskIdParam,
  TaskListQuery,
  TaskUpdateInput,
} from '@my-daily-tasks/shared'
import {
  taskCreateSchema,
  taskIdParamSchema,
  taskListQuerySchema,
  taskUpdateSchema,
} from '@my-daily-tasks/shared'
import { validate } from '@/middlewares/validate'
import { createTask, deleteTask, getTask, listTasks, updateTask } from '@/services/task-service'

export const tasksRouter = Router()

// req.validated は Express の Request 型がルートごとにジェネリクスで narrowing できないため unknown。
// validate() が対応する Zod スキーマ（.transform()込み）で既にパース済みであることを前提に、
// ここで一度だけ既知の型へ絞り込む（再度 .parse() すると .transform() 済みの値
// 例: dueAt が既に Date を string 用スキーマに再度通すことになり誤って失敗するため、再パースはしない）。

tasksRouter.get('/tasks', validate({ query: taskListQuerySchema }), async (req, res) => {
  const query = req.validated?.query as TaskListQuery
  const result = await listTasks(req.userId, query)
  res.json(result)
})

tasksRouter.post('/tasks', validate({ body: taskCreateSchema }), async (req, res) => {
  const body = req.validated?.body as TaskCreateInput
  const task = await createTask(req.userId, body)
  res.status(201).json(task)
})

tasksRouter.get('/tasks/:id', validate({ params: taskIdParamSchema }), async (req, res) => {
  const params = req.validated?.params as TaskIdParam
  const task = await getTask(req.userId, params.id)
  res.json(task)
})

tasksRouter.patch(
  '/tasks/:id',
  validate({ params: taskIdParamSchema, body: taskUpdateSchema }),
  async (req, res) => {
    const params = req.validated?.params as TaskIdParam
    const body = req.validated?.body as TaskUpdateInput
    const task = await updateTask(req.userId, params.id, body)
    res.json(task)
  },
)

tasksRouter.delete('/tasks/:id', validate({ params: taskIdParamSchema }), async (req, res) => {
  const params = req.validated?.params as TaskIdParam
  await deleteTask(req.userId, params.id)
  res.status(204).end()
})
