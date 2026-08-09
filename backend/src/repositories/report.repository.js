import prisma from "../config/prisma.js";

export const createReport = async (data) => {
    return prisma.report.create({
        data
    });
};

export const getReportBySessionId = async (ecgSessionId) => {
    return prisma.report.findUnique({
        where: {
            ecgSessionId
        }
    });
};