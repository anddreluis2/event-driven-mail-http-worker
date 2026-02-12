import { Hono } from 'hono'
import { inngestHandler } from './inngest/serve'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

// Endpoint para Inngest Dev Server
app.all('/api/inngest', inngestHandler)

export default app
