import fastapiPredictor from "./fastapiPredictor.js";

export const predictECG = async (samples) => {
    return await fastapiPredictor(samples);
};