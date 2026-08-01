import prisma from "../config/prisma.js";

export const createProfile = async (data) => {
    return prisma.patientProfile.create({
        data
    });
};

export const findProfileByName = async (accountId, fullName) => {
    return prisma.patientProfile.findFirst({
        where: {
            accountId,
            fullName
        }
    });
};