import { createApp } from '@/app'
import { env } from '@/lib/env'

const app = createApp()

app.listen(env.PORT, () => {
  console.log(`api listening on http://localhost:${String(env.PORT)}`)
})
