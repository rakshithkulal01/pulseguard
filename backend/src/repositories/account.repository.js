import prisma from "../config/prisma.js";

export const findAccountBySupabaseUserId = async (supabaseUserId) => {
    return prisma.account.findUnique({
        where: {
            supabaseUserId
        }
    });
};

export const createAccount = async (data) => {
    return prisma.account.create({
        data
    });
};
