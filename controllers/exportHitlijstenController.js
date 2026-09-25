// controllers/exportHitlijstenController.js
import { z } from "zod";
import { exportRunToHitlijsten } from "../models/hitlijsten.js";

const bodySchema = z.object({
  runId: z.string().uuid("runId must be a UUID"),
  dryRun: z.boolean().optional()
});

export async function exportHitlijstenForRun(req, res, next) {
  try {
    const parsed = bodySchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues.map((i) => i.message).join("; ") });
    }

    const { runId, dryRun } = parsed.data;

    const result = await exportRunToHitlijsten(runId, { dryRun: dryRun === true });
    res.json(result);
  } catch (e) {
    next(e);
  }
}
