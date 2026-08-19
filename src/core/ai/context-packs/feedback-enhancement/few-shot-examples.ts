import type { FewShotExample } from "../../types.js";
import type { FeedbackEnhancementResult } from "./schema.js";

function example(rawInput: string, output: FeedbackEnhancementResult): FewShotExample {
  return { rawInput, output };
}

export const FEEDBACK_ENHANCEMENT_EXAMPLES: FewShotExample[] = [
  example(
    "manager said my PRs sometimes assume people already know context they don't have, " +
      "i started adding a why section to every pr now and made a template for the team",
    {
      content: "PR descriptions sometimes assume shared context other teams don't have.",
      howAddressed:
        "Started including a \"why\" section in every PR description and adopted a " +
        "team-wide PR template.",
      clarifyingQuestions: [],
    },
  ),
  example("someone said I should communicate more", {
    content: "Received feedback to communicate more.",
    howAddressed: null,
    clarifyingQuestions: [
      "Communicate more about what specifically — status updates, decisions, blockers?",
      "Who gave this feedback, and in what context?",
    ],
  }),
];
