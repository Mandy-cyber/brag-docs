import type { FewShotExample } from "../../types.js";
import type { LearnedEnhancementResult } from "./schema.js";

function example(rawInput: string, output: LearnedEnhancementResult): FewShotExample {
  return { rawInput, output };
}

export const LEARNED_ENHANCEMENT_EXAMPLES: FewShotExample[] = [
  example(
    "picked up opentelemetry to trace requests across services, used it to find where " +
      "the latency was coming from in the caching project",
    {
      title: "OpenTelemetry for distributed tracing",
      description:
        "Adopted OpenTelemetry to trace requests across service boundaries, using it " +
        "to locate latency sources during the caching-layer project.",
      suggestedCategory: "tool",
      clarifyingQuestions: [],
    },
  ),
  example("learned some terraform stuff", {
    title: "Terraform",
    description: "Picked up Terraform.",
    suggestedCategory: "tool",
    clarifyingQuestions: [
      "What specifically did you learn about Terraform — a technique, a module pattern, something else?",
      "What prompted learning this — a project, an incident, self-study?",
    ],
  }),
];
