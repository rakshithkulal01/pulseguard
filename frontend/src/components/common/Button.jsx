export default function Button({
  children,
  type = "button",
  loading = false,
  disabled,
  ...props
}) {
  return (
    <button type={type} disabled={disabled || loading} {...props}>
      {loading ? "Please wait..." : children}
    </button>
  );
}
