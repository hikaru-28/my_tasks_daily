import { createBrowserRouter } from 'react-router'
import { HomePage } from '@/routes/HomePage'
import { TasksPage } from '@/routes/TasksPage'

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/tasks', element: <TasksPage /> },
])
