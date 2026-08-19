import type { FewShotExample } from "../../types.js";
import type { EnhancementResult } from "./schema.js";

function example(rawInput: string, output: EnhancementResult): FewShotExample {
  return { rawInput, output };
}

export const ENTRY_ENHANCEMENT_EXAMPLES: FewShotExample[] = [
  example(
    "fixed the caching bug that was making the api slow, like 40% faster now and " +
      "we also ended up not needing to buy more servers, saved like $50k/year",
    {
      title: "Fixed a caching bug causing API slowdowns",
      description:
        "Diagnosed and fixed a caching bug that was degrading API response times, " +
        "and the fix removed the need for a planned infrastructure upgrade.",
      impacts: [
        { statement: "Reduced API latency", metrics: [{ value: 40, unit: "% faster" }] },
        {
          statement: "Avoided a planned server capacity upgrade",
          metrics: [{ value: 50000, unit: "USD saved annually" }],
        },
      ],
      suggestedType: "bug-catch",
      clarifyingQuestions: [],
    },
  ),
  example("did some stuff on the search service this week", {
    title: "Worked on the search service",
    description: "Made changes to the search service.",
    impacts: [{ statement: "Contributed to the search service", metrics: [] }],
    suggestedType: "other",
    clarifyingQuestions: [
      "What specifically changed in the search service?",
      "What was the outcome or impact of the change?",
    ],
  }),
  example(
    "helped onboard the two new hires on the team, paired with them a lot and they're " +
      "both handling on-call fine now",
    {
      title: "Onboarded two new team members",
      description:
        "Paired regularly with two new hires and supported their ramp-up until they " +
        "were both comfortable handling on-call independently.",
      impacts: [
        {
          statement: "Both new hires reached on-call readiness",
          metrics: [],
        },
      ],
      suggestedType: "mentorship",
      clarifyingQuestions: [],
    },
  ),
];
