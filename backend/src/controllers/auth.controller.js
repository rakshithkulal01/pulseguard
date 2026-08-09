import STATUS_CODES from "../constants/statusCodes.js";

export const testAuth = async (req, res, next) => {
    try {
        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: "Authentication successful",
            user: {
                id: req.user.supabaseUserId,
                email: req.user.email
            }
        });
    } catch (error) {
        next(error);
    }
};
