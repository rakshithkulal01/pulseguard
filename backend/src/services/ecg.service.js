import * as repository from "../repositories/ecg.repository.js";
import { predictECG } from "../ai/ai.service.js";

export const processECGService = async (payload) => {

    // 1. Create session

    const session = await repository.createSession({

        profileId: payload.profileId,

        duration: payload.duration,

        rawSamples: payload.samples,

        status: "PROCESSING"

    });

    // 2. Mock prediction

    const result = await predictECG(payload.samples);

    // 3. Update session

    return repository.updateSession(session.id, {

        prediction: result.prediction,

        confidence: result.confidence,

        riskLevel: result.riskLevel,

        heartRate: result.heartRate,

        summary: result.summary,

        keyFindings: result.keyFindings,

        processedAt: new Date(),

        status: "COMPLETED"

    });

};