import type { PrepNotes } from "@/types";

/**
 * Builds plain text representation of prep notes for copying to clipboard.
 */
export function getPrepNotesAsText(notes: PrepNotes): string {
  const parts: string[] = [];

  if (notes.meetingSummary?.trim()) {
    parts.push("Meeting overview\n" + notes.meetingSummary.trim());
  }
  if (notes.talkingPoints?.length) {
    parts.push("Key talking points\n" + notes.talkingPoints.map((t) => `• ${t}`).join("\n"));
  }
  if (notes.questionsToPrepare?.length) {
    parts.push("Likely interview questions\n" + notes.questionsToPrepare.map((q) => `• ${q}`).join("\n"));
  }
  if (notes.strengthsToHighlight?.length) {
    parts.push("Strengths to highlight\n" + notes.strengthsToHighlight.map((s) => `• ${s}`).join("\n"));
  }
  if (notes.skillsToReview?.length) {
    parts.push("Skills or topics to review\n" + notes.skillsToReview.map((s) => `• ${s}`).join("\n"));
  }
  if (notes.gapsOrMissing?.length) {
    parts.push("Gaps or missing qualifications\n" + notes.gapsOrMissing.map((g) => `• ${g}`).join("\n"));
  }
  if (notes.followUpQuestions?.length) {
    parts.push("Follow-up questions to ask\n" + notes.followUpQuestions.map((q) => `• ${q}`).join("\n"));
  }

  return parts.join("\n\n");
}
