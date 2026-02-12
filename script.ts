import { prisma } from './lib/prisma'

async function main() {
  // Create a scheduled email
  const email = await prisma.email.create({
    data: {
      toEmail: 'test@example.com',
      subject: 'Test Email',
      body: 'This is a test email scheduled for the future.',
      status: 'scheduled',
      sendAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },
  })
  console.log('Created email:', email)

  // Fetch all emails
  const allEmails = await prisma.email.findMany()
  console.log('All emails:', JSON.stringify(allEmails, null, 2))
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
