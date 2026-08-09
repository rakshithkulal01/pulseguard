import { generatePDF } from "../src/reports/pdf.service.js";

const session = {
    id: "test-session-001",
    createdAt: new Date(),
    duration: 30,
    prediction: "NORMAL",
    confidence: 98.2,
    riskLevel: "LOW",
    heartRate: 76,
    summary: "Mock prediction generated during development.",
    keyFindings: [
        "Normal sinus rhythm",
        "No ST-segment abnormalities",
        "Normal QRS morphology"
    ]
};

const profile = {
    fullName: "Rakshith Kulal",
    age: 22,
    gender: "MALE",
    bloodGroup: "O_POSITIVE"
};

generatePDF(session, profile)
    .then((result) => {
        console.log("PDF Generated Successfully");
        console.log(result);
    })
    .catch(console.error);