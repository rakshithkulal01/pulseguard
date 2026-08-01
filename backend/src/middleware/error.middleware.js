import { ZodError } from "zod";
import STATUS_CODES from "../constants/statusCodes.js";

const errorHandler = (err, req, res, next) => {

    if (err instanceof ZodError) {

        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: "Validation failed",
            errors: err.errors
        });

    }

    return res.status(
        err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR
    ).json({
        success: false,
        message: err.message || "Something went wrong"
    });

};

export default errorHandler;