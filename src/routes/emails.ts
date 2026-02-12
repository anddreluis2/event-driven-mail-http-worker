import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { inngest } from "../inngest/client";

const emails = new Hono();

// Schema de validação para criar email
const createEmailSchema = z.object({
  toEmail: z.string().email("Email inválido"),
  subject: z.string().min(1, "Assunto é obrigatório"),
  body: z.string().min(1, "Corpo do email é obrigatório"),
  sendAt: z.string().datetime("Data de envio inválida"),
});

type CreateEmailInput = z.infer<typeof createEmailSchema>;

// POST /emails/schedule
emails.post("/schedule", zValidator("json", createEmailSchema), async (c) => {
  try {
    const validated = c.req.valid("json") as CreateEmailInput;
    const { toEmail, subject, body: emailBody, sendAt } = validated;
    const sendAtDate = new Date(sendAt);

    // Validar que a data é no futuro
    if (sendAtDate <= new Date()) {
      return c.json({ error: "A data de envio deve ser no futuro" }, 400);
    }

    // Salvar email no banco
    const email = await prisma.email.create({
      data: {
        toEmail,
        subject,
        body: emailBody,
        sendAt: sendAtDate,
        status: "scheduled",
      },
    });

    // Tentar emitir evento Inngest (não falha se não conseguir)
    try {
      await inngest.send({
        name: "email/scheduled",
        data: {
          emailId: email.id,
          sendAt: sendAtDate.toISOString(),
        },
      });
      console.log(`✅ Evento Inngest emitido para email ${email.id}`);
    } catch (inngestError) {
      // Log do erro mas não falha a requisição
      console.warn(
        "⚠️ Erro ao emitir evento Inngest:",
        inngestError instanceof Error ? inngestError.message : "Unknown error",
      );
      console.warn(
        "📝 Email salvo no banco, mas evento não foi emitido. Certifique-se que o Inngest Dev Server está rodando.",
      );
      // O email já foi salvo, então continuamos normalmente
    }

    return c.json(email, 201);
  } catch (error) {
    console.error("Erro ao agendar email:", error);
    return c.json(
      {
        error: "Erro ao agendar email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export default emails;
