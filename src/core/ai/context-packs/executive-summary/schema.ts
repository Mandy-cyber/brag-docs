import { z } from "zod";

export const ExecutiveSummaryResultSchema = z.object({
  summary: z.string().min(1).describe(
    "A concise executive summary paragraph, grounded only in the entries provided.",
  ),
});

export type ExecutiveSummaryResult = z.infer<typeof ExecutiveSummaryResultSchema>;
