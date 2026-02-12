import { inngest } from './client'
import { prisma } from '../../lib/prisma'
import { resend } from '../../lib/resend'

export const sendScheduledEmail = inngest.createFunction(
  { id: 'send-scheduled-email', name: 'Send Scheduled Email' },
  { event: 'email/scheduled' },
  async ({ event, step }) => {
    const { emailId, sendAt } = event.data

    // Step 1: Aguardar até a data de envio
    await step.sleepUntil('wait-until-send', sendAt)

    // Step 2: Buscar email no banco
    const email = await step.run('fetch-email', async () => {
      return await prisma.email.findUnique({
        where: { id: emailId },
      })
    })

    if (!email) {
      throw new Error(`Email ${emailId} not found`)
    }

    // Step 3: Atualizar status para processing
    await step.run('update-status-processing', async () => {
      return await prisma.email.update({
        where: { id: emailId },
        data: { status: 'processing' },
      })
    })

    // Step 4: Enviar email via Resend
    const emailResult = await step.run('send-email', async () => {
      try {
        const result = await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: email.toEmail,
          subject: email.subject,
          html: email.body,
        })

        if (result.error) {
          throw new Error(`Resend error: ${result.error.message}`)
        }

        return { success: true, messageId: result.data?.id }
      } catch (error) {
        // Se falhar, atualiza status para failed
        await prisma.email.update({
          where: { id: emailId },
          data: { status: 'failed' },
        })
        throw error
      }
    })

    // Step 5: Atualizar status para sent
    await step.run('update-status-sent', async () => {
      return await prisma.email.update({
        where: { id: emailId },
        data: { 
          status: 'sent',
          sentAt: new Date(),
        },
      })
    })

    return { success: true, emailId, messageId: emailResult.messageId }
  }
)
