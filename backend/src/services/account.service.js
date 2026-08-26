import {
    findAccountBySupabaseUserId,
    createAccount
} from "../repositories/account.repository.js";

export const getOrCreateAccount = async (user) => {

    let account = await findAccountBySupabaseUserId(user.id);

    if (account) {
        return account;
    }

    account = await createAccount({
        supabaseUserId: user.id,
        email: user.email,
        fullName:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            null,
        profilePicture:
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            null
    });

    return account;
};