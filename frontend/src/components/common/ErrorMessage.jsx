export default function ErrorMessage({
  message = "Something went wrong.",
  onRetry,
}) {
  return (
    <div role="alert" className="error-message">
      {message}
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
