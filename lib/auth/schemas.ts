import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Informe um email válido."),
  password: z.string().min(8, "Mínimo de 8 caracteres."),
});

export const signUpSchema = z.object({
  fullName: z
    .string()
    .min(2, "Informe seu nome completo.")
    .max(120, "Nome muito longo."),
  email: z.string().email("Informe um email válido."),
  password: z
    .string()
    .min(8, "Mínimo de 8 caracteres.")
    .max(72, "Máximo de 72 caracteres."),
  acceptTerms: z
    .union([z.literal("on"), z.literal("true"), z.boolean()])
    .refine((v) => v === "on" || v === "true" || v === true, {
      message: "Você precisa aceitar os termos.",
    }),
});

export const oauthProviderSchema = z.enum(["google", "azure"]);
export type OAuthProvider = z.infer<typeof oauthProviderSchema>;
