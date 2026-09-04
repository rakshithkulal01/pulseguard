export default function ReportPreview({ report }) {
  return (
    <div className="report-preview">
      {report ? (
        <pre>
          {typeof report === "string"
            ? report
            : JSON.stringify(report, null, 2)}
        </pre>
      ) : (
        <p>No report selected.</p>
      )}
    </div>
  );
}
