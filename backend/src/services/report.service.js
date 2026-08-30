import fs from "fs";

import * as reportRepository from "../repositories/report.repository.js";
import { getSessionById } from "../repositories/ecg.repository.js";

import AppError from "../utils/AppError.js";
import STATUS_CODES from "../constants/statusCodes.js";


export const getReportService = async (
    sessionId,
    accountId
) => {

    const session = await getSessionById(sessionId);

    if (!session || session.profile.accountId !== accountId) {
        throw new AppError(
            "Report not found",
            STATUS_CODES.NOT_FOUND
        );
    }

    const report =
        await reportRepository.getReportBySessionId(
            sessionId
        );

    if (!report) {
        throw new AppError(
            "Report not found",
            STATUS_CODES.NOT_FOUND
        );
    }

    return report;
};


export const downloadReportService = async (
    sessionId,
    accountId
) => {

    const session = await getSessionById(sessionId);

    if (!session || session.profile.accountId !== accountId) {
        throw new AppError(
            "Report not found",
            STATUS_CODES.NOT_FOUND
        );
    }

    const report =
        await reportRepository.getReportBySessionId(
            sessionId
        );

    if (!report) {
        throw new AppError(
            "Report not found",
            STATUS_CODES.NOT_FOUND
        );
    }

    if (!fs.existsSync(report.pdfPath)) {
        throw new AppError(
            "PDF file not found",
            STATUS_CODES.NOT_FOUND
        );
    }

    return {
        filePath: report.pdfPath,
        fileName: `ECG_Report_${sessionId}.pdf`
    };
};