import { processECGSchema } from "../validators/ecg.validator.js";

import STATUS_CODES from "../constants/statusCodes.js";
import { sendSuccess } from "../utils/response.js";
import {
    processECGService,
    getHistoryService,
    getSessionService,
    deleteSessionService
} from "../services/ecg.service.js";

export const processECG = async (req, res, next) => {

    try {

        const validated = processECGSchema.parse(req.body);

        const session = await processECGService(validated);

        return sendSuccess(
            res,
            STATUS_CODES.CREATED,
            "ECG processed successfully",
            session
        );

    } catch (error) {

        next(error);

    }

};

export const getHistory = async (req, res, next) => {

    try {

        const history = await getHistoryService(
            req.params.profileId
        );

        return sendSuccess(
            res,
            STATUS_CODES.OK,
            "ECG history fetched successfully",
            history
        );

    } catch (error) {

        next(error);

    }

};

export const getSession = async (req, res, next) => {

    try {

        const session = await getSessionService(
            req.params.id
        );

        return sendSuccess(
            res,
            STATUS_CODES.OK,
            "ECG session fetched successfully",
            session
        );

    } catch (error) {

        next(error);

    }

};

export const deleteSession = async (req, res, next) => {

    try {

        await deleteSessionService(
            req.params.id
        );

        return sendSuccess(
            res,
            STATUS_CODES.OK,
            "ECG session deleted successfully"
        );

    } catch (error) {

        next(error);

    }

};