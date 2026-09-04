import { z } from "zod";

export const createSessionSchema = z.object({
    profileId: z.string().uuid(),
    duration: z.number().int().positive().optional().default(10),
    samplingRate: z.number().int().positive().optional().default(100)
});

export const processECGSchema = z.object({
    profileId: z.string().uuid(),
    duration: z.number().int().positive().optional().default(10),
    samplingRate: z.number().int().positive().optional().default(100),
    samples: z.array(z.number()).optional().default([])
});