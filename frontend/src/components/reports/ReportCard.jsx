import DownloadReport from "./DownloadReport";
export default function ReportCard({ session }) {
  return (
    <div className="report-card">
      <div>
        <strong>ECG Session #{session.id}</strong>
        <p>{session.report ? "Report available" : "No report available"}</p>
      </div>
      {session.report && <DownloadReport sessionId={session.id} />}
    </div>
  );
}
