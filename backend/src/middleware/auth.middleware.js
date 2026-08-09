import supabase from "../config/supabase.js";
import AppError from "../utils/AppError.js";
import STATUS_CODES from "../constants/statusCodes.js";
import { findAccountBySupabaseUserId, createAccount } from "../repositories/account.repository.js";

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return next(new AppError("Authentication token required", STATUS_CODES.UNAUTHORIZED));
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return next(new AppError("Authentication token required", STATUS_CODES.UNAUTHORIZED));
        }

        // Verify Supabase access token
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return next(new AppError("Invalid or expired token", STATUS_CODES.UNAUTHORIZED));
        }

        // Find or create backend Account mapping
        let account = await findAccountBySupabaseUserId(user.id);
        if (!account) {
            const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split("@")[0];
            const profilePicture = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

            account = await createAccount({
                supabaseUserId: user.id,
                email: user.email,
                fullName,
                profilePicture
            });
        }

        // Attach account to req.user
        req.user = {
            id: account.id,
            supabaseUserId: account.supabaseUserId,
            email: account.email,
            fullName: account.fullName,
            profilePicture: account.profilePicture
        };

        next();
    } catch (err) {
        next(err);
    }
};

export default authMiddleware;
