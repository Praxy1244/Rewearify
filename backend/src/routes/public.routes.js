import { Router } from "express";
import { ok } from "../utils/response.js";

const router = Router();

router.get("/stats", async (req, res) => {
  // TODO: replace with real aggregates later
  return ok(res, {
    total_donations: 12847,
    clothes_distributed: 45290,
    partnered_ngos: 127,
    lives_impacted: 8934
  });
});

export default router;
