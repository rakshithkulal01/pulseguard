export default function EmptyState({ message, action }) {
  return (
    <div className="no-patients">
      {message}
      {action}
    </div>
  );
}
