import { inngest } from './client'
import { prisma } from '../../lib/prisma'
// import { Resend } from 'resend' // Adicionar depois quando instalar Resend

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

    // Step 4: Enviar email via Resend (implementar depois)
    await step.run('send-email', async () => {
      // TODO: Implementar Resend
      // const resend = new Resend(process.env.RESEND_API_KEY)
      // await resend.emails.send({
      //   to: email.toEmail,
      //   subject: email.subject,
      //   html: email.body,
      // })
      
      console.log(`Would send email to ${email.toEmail}`)
      return { success: true }
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

    return { success: true, emailId }
  }
)
