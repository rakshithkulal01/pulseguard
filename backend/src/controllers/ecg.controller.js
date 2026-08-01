import { processECGSchema } from "../validators/ecg.validator.js";
import { processECGService } from "../services/ecg.service.js";

import STATUS_CODES from "../constants/statusCodes.js";
import { sendSuccess } from "../utils/response.js";

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