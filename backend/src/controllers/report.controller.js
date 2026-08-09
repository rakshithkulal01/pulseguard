import * as reportRepository from "../repositories/report.repository.js";
import AppError from "../utils/AppError.js";
import STATUS_CODES from "../constants/statusCodes.js";
import fs from "fs";
import { getSessionById } from "../repositories/ecg.repository.js";

export const getReport = async (req, res, next) => {
    try {
        const { sessionId } = req.params;

        // Verify session ownership
        const session = await getSessionById(sessionId);
        if (!session || session.profile.accountId !== req.user.id) {
            throw new AppError(
                "Report not found",
                STATUS_CODES.NOT_FOUND
            );
        }

        const report = await reportRepository.getReportBySessionId(
            sessionId
        );

        if (!report) {
            throw new AppError(
                "Report not found",
                STATUS_CODES.NOT_FOUND
            );
        }

        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: "Report fetched successfully",
            data: report
        });

    } catch (error) {
        next(error);
    }
};

export const downloadReport = async (req, res, next) => {
    try {
        const { sessionId } = req.params;

        // Verify session ownership
        const session = await getSessionById(sessionId);
        if (!session || session.profile.accountId !== req.user.id) {
            throw new AppError(
                "Report not found",
                STATUS_CODES.NOT_FOUND
            );
        }

        const report =
            await reportRepository.getReportBySessionId(sessionId);

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

        return res.download(
            report.pdfPath,
            `ECG_Report_${sessionId}.pdf`
        );

    } catch (error) {
        next(error);
    }
};