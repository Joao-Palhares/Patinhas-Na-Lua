import { z } from "zod";

// Portuguese NIF Checksum Validation
// Validates the check digit (last digit) using modulo 11 algorithm
function isValidPortugueseNIF(nif: string): boolean {
  if (!/^[0-9]{9}$/.test(nif)) return false;
  
  // Valid first digits: 1,2,3,5,6,7,8,9 (individuals and companies)
  const firstDigit = nif[0];
  if (!['1', '2', '3', '5', '6', '7', '8', '9'].includes(firstDigit)) {
    return false;
  }
  
  // Calculate check digit using modulo 11
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += parseInt(nif[i]) * (9 - i);
  }
  
  const remainder = sum % 11;
  const checkDigit = remainder < 2 ? 0 : 11 - remainder;
  
  return parseInt(nif[8]) === checkDigit;
}

// ============ USER SCHEMAS ============

export const OnboardingSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres.").max(100, "Nome muito longo."),
  phone: z
    .string()
    .regex(/^(\+)?[0-9]{7,15}$/, "Telemóvel deve ter entre 7 a 15 números.")
    .transform((val) => val.replace(/\s/g, "")),
  nif: z
    .string()
    .regex(/^[0-9]{9}$/, "NIF deve ter exatamente 9 dígitos.")
    .refine(isValidPortugueseNIF, "NIF inválido. Verifique o dígito de controlo.")
    .transform((val) => val.replace(/\s/g, "")),
  address: z.string().min(5, "Morada muito curta.").max(500, "Morada muito longa."),
  referralCode: z
    .string()
    .optional()
    .transform((val) => val?.toUpperCase().trim())
});

// ============ PET SCHEMAS ============

export const PetSchema = z.object({
  name: z.string().min(1, "Nome do pet é obrigatório.").max(50, "Nome muito longo."),
  species: z.enum(["DOG", "CAT", "RABBIT", "OTHER"]),
  breed: z.string().max(100, "Raça muito longa.").optional(),
  gender: z.enum(["Macho", "Fêmea"]).optional(),
  sizeCategory: z.enum(["TOY", "SMALL", "MEDIUM", "LARGE", "XL", "GIANT"]).optional(),
  coatType: z.enum(["SHORT", "MEDIUM", "LONG"]).optional(),
  birthDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  microchip: z.string().max(50).optional(),
  medicalNotes: z.string().max(2000, "Notas muito longas.").optional(),
});

// ============ SERVICE SCHEMAS ============

export const ServiceSchema = z.object({
  name: z.string().min(2, "Nome do serviço é obrigatório.").max(100),
  description: z.string().max(500).optional(),
  category: z.enum(["GROOMING", "HYGIENE", "EXOTIC", "SPA"]),
  isMobileAvailable: z.boolean().default(false),
  isTimeBased: z.boolean().default(false),
});

export const ServiceOptionSchema = z.object({
  petSize: z.enum(["TOY", "SMALL", "MEDIUM", "LARGE", "XL", "GIANT", "ALL"]).optional(),
  coatType: z.enum(["SHORT", "MEDIUM", "LONG", "ALL"]).optional(),
  price: z.number().min(0, "Preço não pode ser negativo.").max(10000, "Preço muito alto."),
  durationMin: z.number().min(5, "Duração mínima é 5 minutos.").max(480, "Duração máxima é 8 horas."),
  durationMax: z.number().max(480).optional(),
});

// ============ APPOINTMENT SCHEMAS ============

export const AppointmentSchema = z.object({
  userId: z.string().min(1, "Cliente é obrigatório."),
  petId: z.string().min(1, "Pet é obrigatório."),
  serviceId: z.string().min(1, "Serviço é obrigatório."),
  date: z.date(),
  price: z.number().min(0).max(10000),
  locationType: z.enum(["SALON", "MOBILE"]).default("SALON"),
  mobileAddress: z.string().max(500).optional(),
  travelFee: z.number().min(0).default(0),
});

// ============ COUPON SCHEMAS ============

export const CouponSchema = z.object({
  code: z.string()
    .min(4, "Código deve ter pelo menos 4 caracteres.")
    .max(20, "Código muito longo.")
    .transform((val) => val.toUpperCase().trim()),
  discount: z.number()
    .min(1, "Desconto mínimo é 1%.")
    .max(100, "Desconto máximo é 100%."),
  maxUses: z.number().min(1).default(1),
});

// ============ EXPENSE SCHEMAS ============

export const ExpenseSchema = z.object({
  description: z.string().min(2, "Descrição é obrigatória.").max(200),
  amount: z.number().min(0.01, "Valor deve ser positivo.").max(100000),
  category: z.enum(["PRODUCT", "EQUIPMENT", "UTILITIES", "RENT", "TAXES", "OTHER"]),
  date: z.date().optional(),
  notes: z.string().max(1000).optional(),
});

// ============ REVIEW SCHEMAS ============

export const ReviewSchema = z.object({
  rating: z.number().min(1, "Avaliação mínima é 1.").max(5, "Avaliação máxima é 5."),
  comment: z.string().min(10, "Comentário muito curto.").max(1000, "Comentário muito longo."),
  appointmentId: z.string().min(1),
});

// ============ ABSENCE SCHEMAS ============

export const AbsenceSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  reason: z.string().max(200).optional(),
}).refine((data) => data.endDate >= data.startDate, {
  message: "Data de fim deve ser igual ou posterior à data de início.",
  path: ["endDate"],
});

// Export the validation function for use elsewhere
export { isValidPortugueseNIF };
