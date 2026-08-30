import STATUS_CODES from "../constants/statusCodes.js";
import {
    getReportService,
    downloadReportService
} from "../services/report.service.js";


export const getReport = async (req, res, next) => {

    try {

        const report = await getReportService(
            req.params.sessionId,
            req.user.id
        );

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

        const result = await downloadReportService(
            req.params.sessionId,
            req.user.id
        );

        return res.download(
            result.filePath,
            result.fileName
        );

    } catch (error) {

        next(error);

    }
};