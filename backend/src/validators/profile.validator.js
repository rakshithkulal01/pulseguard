import { z } from "zod";

export const createProfileSchema = z.object({
    fullName: z
        .string()
        .trim()
        .min(2, "Full name must contain at least 2 characters")
        .max(100, "Full name cannot exceed 100 characters"),

    age: z
        .number()
        .int()
        .min(1)
        .max(120),

    gender: z.enum([
        "MALE",
        "FEMALE",
        "OTHER"
    ]),

    bloodGroup: z.enum([
        "A_POSITIVE",
        "A_NEGATIVE",
        "B_POSITIVE",
        "B_NEGATIVE",
        "AB_POSITIVE",
        "AB_NEGATIVE",
        "O_POSITIVE",
        "O_NEGATIVE"
    ])
});