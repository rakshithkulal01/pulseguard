import AppError from "../utils/AppError.js";
import STATUS_CODES from "../constants/statusCodes.js";

const fastapiPredictor = async (samples) => {
    const fastapiUrl = process.env.FASTAPI_URL || "http://127.0.0.1:8000";

    if (!Array.isArray(samples) || samples.length !== 1000) {
        throw new AppError(
            `ECG input must contain exactly 1000 samples. Received ${samples?.length ?? 0} samples.`,
            STATUS_CODES.BAD_REQUEST
        );
    }

    try {
        const response = await fetch(`${fastapiUrl}/predict`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ samples })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.detail || `FastAPI server returned status ${response.status}`;
            throw new AppError(
                errorMessage,
                response.status >= 400 && response.status < 500
                    ? response.status
                    : STATUS_CODES.INTERNAL_SERVER_ERROR
            );
        }

        const data = await response.json();
        return data;

    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        
        throw new AppError(
            `Failed to communicate with AI inference service: ${error.message}`,
            STATUS_CODES.INTERNAL_SERVER_ERROR
        );
    }
};

export default fastapiPredictor;