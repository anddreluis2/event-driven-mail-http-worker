import { serve } from 'inngest/hono'
import { inngest } from './client'
import { sendScheduledEmail } from './functions'

export const inngestHandler = serve({
  client: inngest,
  functions: [
    sendScheduledEmail,
  ],
})
