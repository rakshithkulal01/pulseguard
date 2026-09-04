export default function ConfidenceScore({ value }) {
  return (
    <div className="confidence-score">
      <span>Confidence</span>
      <strong>{value ?? "N/A"}</strong>
    </div>
  );
}
