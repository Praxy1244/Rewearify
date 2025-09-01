import jwt from "jsonwebtoken";
import { fail } from "../utils/response.js";

export function auth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return fail(res, "No token provided", 401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch {
    return fail(res, "Invalid or expired token", 401);
  }
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) return fail(res, "Forbidden", 403);
    next();
  };
}
