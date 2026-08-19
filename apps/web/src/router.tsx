import { createBrowserRouter } from 'react-router'
import { HomePage } from '@/routes/HomePage'
import { TasksPage } from '@/routes/TasksPage'
import { EventsPage } from '@/routes/EventsPage'

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/tasks', element: <TasksPage /> },
  { path: '/events', element: <EventsPage /> },
])
