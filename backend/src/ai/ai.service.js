import mockPredictor from "./mockPredictor.js";
// import fastapiPredictor from "./fastapiPredictor.js";

export const predictECG = async (samples) => {

    // Later we'll switch to FastAPI
    return await mockPredictor(samples);

};