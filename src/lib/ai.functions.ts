import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TaskInput = z.object({
  task: z.enum(["interview-questions", "cover-letter", "resume-tips", "skills"]),
  role: z.string().min(1),
  company: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

function buildPrompt(input: z.infer<typeof TaskInput>) {
  const { task, role, company, notes } = input;
  const ctx = `Role: ${role}${company ? `\nCompany: ${company}` : ""}${notes ? `\nExtra context: ${notes}` : ""}`;
  switch (task) {
    case "interview-questions":
      return `Generate 8 realistic interview questions for the following role. Mix behavioral and technical. Format as a numbered markdown list.\n\n${ctx}`;
    case "cover-letter":
      return `Write a concise, modern cover letter (around 220 words) for this role. Confident, warm, no fluff. Use short paragraphs, no bullet lists, no placeholders like [Your Name].\n\n${ctx}`;
    case "resume-tips":
      return `Suggest 6 concrete resume improvements tailored to this role. Each tip should be a short markdown bullet with an action verb.\n\n${ctx}`;
    case "skills":
      return `List 10 high-impact skills (technical and soft) someone should highlight for this role. Format as a comma-separated list with no numbering or extra text.\n\n${ctx}`;
  }
}

export const generateAiContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TaskInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system:
        "You are a senior career coach. Be specific, concrete, and actionable. Never invent biographical facts. Use markdown when helpful.",
      prompt: buildPrompt(data),
    });

    return { text };
  });
