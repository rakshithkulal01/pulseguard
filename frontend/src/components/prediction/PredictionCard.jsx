import ConfidenceScore from "./ConfidenceScore";
import RiskIndicator from "./RiskIndicator";
import Findings from "./Findings";
export default function PredictionCard({ prediction }) {
  if (!prediction) return null;
  return (
    <section className="prediction-card">
      <div>
        <h2>AI Prediction</h2>
        <strong>{prediction.prediction || "N/A"}</strong>
      </div>
      <ConfidenceScore value={prediction.confidence} />
      <RiskIndicator value={prediction.riskLevel || prediction.risk} />
      <Findings
        findings={prediction.keyFindings}
        explanation={prediction.explanation}
      />
    </section>
  );
}
