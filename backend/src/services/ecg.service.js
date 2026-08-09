import * as repository from "../repositories/ecg.repository.js";
import { predictECG } from "../ai/ai.service.js";
import * as profileRepository from "../repositories/profile.repository.js";
import AppError from "../utils/AppError.js";
import STATUS_CODES from "../constants/statusCodes.js";
import SESSION_STATUS from "../constants/sessionStatus.js";
import { generatePDF } from "../reports/pdf.service.js";
import * as reportRepository from "../repositories/report.repository.js";

export const processECGService = async (payload, accountId) => {

    // 1. Verify patient profile
    const profile = await profileRepository.findProfileById(
        payload.profileId,
        accountId
    );

    if (!profile) {
        throw new AppError(
            "Patient profile not found",
            STATUS_CODES.NOT_FOUND
        );
    }

    // 2. Create ECG session
    const session = await repository.createSession({
        profileId: payload.profileId,
        duration: payload.duration,
        rawSamples: payload.samples,
        status: SESSION_STATUS.PROCESSING
    });

    try {

        // 3. Predict ECG
        const result = await predictECG(payload.samples);

        // 4. Update session with prediction
        const updatedSession = await repository.updateSession(session.id, {
            prediction: result.prediction,
            confidence: result.confidence,
            riskLevel: result.riskLevel,
            heartRate: result.heartRate,
            summary: result.summary,
            keyFindings: result.keyFindings,
            processedAt: new Date(),
            status: SESSION_STATUS.COMPLETED
        });

        // 5. Generate PDF report
        const pdf = await generatePDF(
            updatedSession,
            profile
        );

        // 6. Save report information
        await reportRepository.createReport({
            ecgSessionId: updatedSession.id,
            pdfPath: pdf.filePath
        });

        // 7. Return completed session
        return updatedSession;

    } catch (error) {

        // Mark session as failed if anything goes wrong
        await repository.updateSession(session.id, {
            status: SESSION_STATUS.FAILED
        });

        throw error;
    }
};

//get patient history
export const getHistoryService = async (profileId, accountId) => {

    const profile = await profileRepository.findProfileById(
        profileId,
        accountId
    );

    if (!profile) {
        throw new AppError(
            "Patient profile not found",
            STATUS_CODES.NOT_FOUND
        );
    }

    return repository.getHistory(profileId);

};

//get session by id
export const getSessionService = async (id, accountId) => {

    const session = await repository.getSessionById(id);

    if (!session || session.profile.accountId !== accountId) {
        throw new AppError(
            "ECG session not found",
            STATUS_CODES.NOT_FOUND
        );
    }

    return session;

};

//delete session by id
export const deleteSessionService = async (id, accountId) => {

    const session = await repository.getSessionById(id);

    if (!session || session.profile.accountId !== accountId) {
        throw new AppError(
            "ECG session not found",
            STATUS_CODES.NOT_FOUND
        );
    }

    await repository.deleteSession(id);

};

