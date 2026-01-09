import { z } from "zod";

export const OnboardingSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
  phone: z
    .string()
    .regex(/^(\+)?[0-9]{7,15}$/, "Telemóvel deve ter entre 7 a 15 números.")
    .transform((val) => val.replace(/\s/g, "")), // Auto-sanitize spaces
  nif: z
    .string()
    .regex(/^[0-9]{9}$/, "NIF deve ter exatamente 9 dígitos.")
    .transform((val) => val.replace(/\s/g, "")),
  address: z.string().min(5, "Morada muito curta."),
  referralCode: z
    .string()
    .optional()
    .transform((val) => val?.toUpperCase().trim())
});
