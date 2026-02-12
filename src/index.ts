import { Hono } from 'hono'
import { inngestHandler } from './inngest/serve'
import emails from './routes/emails'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

// Endpoint para Inngest Dev Server
app.all('/api/inngest', inngestHandler)

// Rotas de emails
app.route('/emails', emails)

export default app
