import { z } from "zod";

export const processECGSchema = z.object({

    profileId: z.string().uuid(),

    duration: z
        .number()
        .int()
        .positive(),

    samplingRate: z
        .number()
        .int()
        .positive(),

    samples: z
        .array(z.number())
        .min(10, "Minimum 100 ECG samples required")

});