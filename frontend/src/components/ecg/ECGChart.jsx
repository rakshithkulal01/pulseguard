export default function ECGChart({ samples = [], height = 220 }) {
  const numericSamples = samples
    .map((value) =>
      typeof value === "object"
        ? (value.value ?? value.voltage ?? value.amplitude)
        : value,
    )
    .map(Number)
    .filter(Number.isFinite);

  if (!numericSamples.length) {
    return (
      <div className="ecg-chart-empty">
        Waiting for ECG signal data from the backend...
      </div>
    );
  }

  const width = 1000;
  const min = Math.min(...numericSamples);
  const max = Math.max(...numericSamples);
  const range = max - min || 1;
  const points = numericSamples
    .map(
      (sample, index) =>
        `${(index / Math.max(numericSamples.length - 1, 1)) * width},${height - ((sample - min) / range) * (height - 20) - 10}`,
    )
    .join(" ");

  return (
    <div className="ecg-chart-wrap">
      <div className="ecg-grid" aria-hidden="true" />
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="ecg-chart"
        role="img"
        aria-label="ECG waveform from backend"
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
