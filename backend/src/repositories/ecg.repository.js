import prisma from "../config/prisma.js";

export const createSession = async (data) => {
    return prisma.eCGSession.create({
        data
    });
};

export const updateSession = async (id, data) => {
    return prisma.eCGSession.update({
        where: {
            id
        },
        data
    });
};

export const getSessionById = async (id) => {
    return prisma.eCGSession.findUnique({
        where: {
            id
        },
        include: {
            report: true,
            profile: true
        }
    });
};

export const getHistory = async (profileId) => {
    return prisma.eCGSession.findMany({
        where: {
            profileId
        },
        orderBy: {
            createdAt: "desc"
        },
        include: {
            report: true
        }
    });
};

export const deleteSession = async (id) => {
    return prisma.eCGSession.delete({
        where: {
            id
        }
    });
};