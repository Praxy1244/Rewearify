export const ok = (res, data = {}) => res.json({ success: true, ...data });
export const fail = (res, error = "Something went wrong", code = 400) =>
  res.status(code).json({ success: false, error });
