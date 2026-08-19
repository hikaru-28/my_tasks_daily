import { useQuery } from '@tanstack/react-query'
import { API_BASE_PATH } from '@my-daily-tasks/shared'

type HealthResponse = {
  status: string
  db: string
  timestamp: string
}

async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_PATH}/health`)
  if (!response.ok) {
    throw new Error('failed to fetch health')
  }
  const data: unknown = await response.json()
  return data as HealthResponse
}

export function HomePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  })

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Hello, my daily tasks</h1>
      {isLoading && <p>health を確認中...</p>}
      {isError && <p className="text-red-600">health の取得に失敗しました</p>}
      {data && (
        <p className="text-slate-600">
          status: {data.status} / db: {data.db}
        </p>
      )}
    </main>
  )
}
