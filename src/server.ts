import { serve } from '@hono/node-server'
import app from './index'

const port = process.env.PORT ? parseInt(process.env.PORT) : 8787

console.log(`🚀 Server running on http://localhost:${port}`)
console.log(`📡 Inngest endpoint: http://localhost:${port}/api/inngest`)

serve({
  fetch: app.fetch,
  port,
})
