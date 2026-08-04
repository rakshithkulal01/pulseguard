import * as repository from "../repositories/ecg.repository.js";
import { predictECG } from "../ai/ai.service.js";
import * as profileRepository from "../repositories/profile.repository.js";
import AppError from "../utils/AppError.js";
import STATUS_CODES from "../constants/statusCodes.js";
import SESSION_STATUS from "../constants/sessionStatus.js";


export const processECGService = async (payload) => {
      const profile = await profileRepository.findProfileByIdOnly(
        payload.profileId
    );

    if (!profile) {
        throw new AppError(
            "Patient profile not found",
            STATUS_CODES.NOT_FOUND
        );
    }

    // 1. Create session

    const session = await repository.createSession({   profileId: payload.profileId,
    duration: payload.duration,
    rawSamples: payload.samples,
    status: SESSION_STATUS.PROCESSING
});

try {

    const result = await predictECG(payload.samples);

    return await repository.updateSession(session.id, {
        prediction: result.prediction,
        confidence: result.confidence,
        riskLevel: result.riskLevel,
        heartRate: result.heartRate,
        summary: result.summary,
        keyFindings: result.keyFindings,
        processedAt: new Date(),
        status: "COMPLETED"
    });

} catch (error) {

    await repository.updateSession(session.id, {
        status: "FAILED"
    });

    throw error;
}
};

//get patient history
export const getHistoryService = async (profileId) => {

    const profile = await profileRepository.findProfileByIdOnly(profileId);

    if (!profile) {
        throw new AppError(
            "Patient profile not found",
            STATUS_CODES.NOT_FOUND
        );
    }

    return repository.getHistory(profileId);

};

//get session by id
export const getSessionService = async (id) => {

    const session = await repository.getSessionById(id);

    if (!session) {
        throw new AppError(
            "ECG session not found",
            STATUS_CODES.NOT_FOUND
        );
    }

    return session;

};

//delete session by id
export const deleteSessionService = async (id) => {

    const session = await repository.getSessionById(id);

    if (!session) {
        throw new AppError(
            "ECG session not found",
            STATUS_CODES.NOT_FOUND
        );
    }

    await repository.deleteSession(id);

};