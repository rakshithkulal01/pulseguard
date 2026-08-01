const mockPredictor = async (samples) => {

    // Simulate model processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
        prediction: "NORMAL",
        confidence: 98.2,
        riskLevel: "LOW",
        heartRate: 78,
        summary: "Mock prediction generated during development.",
        keyFindings: [
            "Normal sinus rhythm",
            "No ST-segment abnormalities",
            "Normal QRS morphology"
        ]
    };

};

export default mockPredictor;