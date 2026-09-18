import type { HoodlistCampaign } from "./types";

export type WizardStepId =
  | "project"
  | "eligibility"
  | "reward"
  | "allocation"
  | "verification"
  | "review"
  | "publish";

export const WIZARD_STEPS: {
  id: WizardStepId;
  number: number;
  label: string;
  question: string;
}[] = [
  {
    id: "project",
    number: 1,
    label: "Project",
    question: "Which project is this Hoodlist for?",
  },
  {
    id: "eligibility",
    number: 2,
    label: "Eligibility",
    question: "Who qualifies?",
  },
  {
    id: "reward",
    number: 3,
    label: "Reward",
    question: "What do they receive?",
  },
  {
    id: "allocation",
    number: 4,
    label: "Allocation",
    question: "How much do they receive?",
  },
  {
    id: "verification",
    number: 5,
    label: "Verification",
    question: "How is ownership verified?",
  },
  {
    id: "review",
    number: 6,
    label: "Review",
    question: "Does this look right?",
  },
  {
    id: "publish",
    number: 7,
    label: "Publish",
    question: "Ready to go live?",
  },
];

export function canLeaveProjectStep(campaign: HoodlistCampaign): boolean {
  return (
    campaign.project.name.trim().length > 0 &&
    campaign.project.campaignName.trim().length > 0
  );
}
