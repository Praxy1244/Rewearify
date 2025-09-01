// express-async-errors is installed to catch async throws automatically
export function notFound(req, res, next) {
  res.status(404).json({ success: false, error: "Route not found" });
}
export function onError(err, req, res, next) {
  console.error("Unhandled Error:", err);
  res.status(500).json({ success: false, error: "Server error" });
}
