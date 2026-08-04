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

export const findProfileByIdOnly = async (id) => {
    return prisma.patientProfile.findUnique({
        where: {
            id
        }
    });
};

export const findAllProfiles = async (accountId) => {
    return prisma.patientProfile.findMany({
        where: {
            accountId
        },
        orderBy: {
            createdAt: "desc"
        }
    });
};

export const findProfileById = async (id, accountId) => {
    return prisma.patientProfile.findFirst({
        where: {
            id,
            accountId
        }
    });
};

export const updateProfile = async (id, data) => {
    return prisma.patientProfile.update({
        where: {
            id
        },
        data
    });
};

export const deleteProfile = async (id) => {
    return prisma.patientProfile.delete({
        where: {
            id
        }
    });
};