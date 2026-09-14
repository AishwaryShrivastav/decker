import { buildMeetingDoc } from "../../lib/docTemplate";

// ---------------------------------------------------------------------------
// Sample meeting data showing the Decker closing artifact shape.
// ---------------------------------------------------------------------------
const SAMPLE_DOC = {
  title: "Q3 Product & Engineering Review",
  subtitle: "Transcript · 52 min",
  summary:
    "The team aligned on priorities and next steps: mobile rewrite first, delayed feature scope, and open action items.",
  topics: [
    {
      title: "Mobile Rewrite Priority",
      summary:
        "The team approved a mobile rewrite as the top Q3 engineering priority and confirmed no new feature work until the core rewrite ships.",
      keyDecision: "Mobile rewrite is the #1 engineering priority for Q3; no new feature work until the rewrite is live.",
      subtopics: [
        "Current reliability issues are a core blocker for growth",
        "React Native is the selected approach",
        "Target launch planning now begins this sprint",
        "All six mobile engineers remain focused on rewrite work",
        "Weekly shipping cadence will run through rollout",
      ],
      actionItems: [
        "Set up mobile monorepo scaffold",
        "Archive previous architecture references and document handoff points",
        "Create beta rollout plan and ship cadence",
      ],
    },
    {
      title: "Q4 Feature Deferrals",
      summary:
        "Two Q3 features were moved to Q4 so the team can protect rewrite bandwidth and keep delivery quality stable.",
      keyDecision:
        "Collaborative notebooks and advanced analytics moved to Q4; customers receive scope changes notices.",
      subtopics: [
        "Only one high-retention vertical needs interim workaround",
        "The affected feature set is being reviewed with CS",
        "No immediate SLA change required",
        "Communication draft needed before release",
        "Owners will align with support and success teams",
      ],
      actionItems: [
        "Prepare impact communication notes",
        "Coordinate with affected customers",
        "Update roadmap artifacts for Q4 shift",
      ],
    },
    {
      title: "Headcount & Hiring Plan",
      summary:
        "Leadership approved additional hires and confirmed budget headroom for the rewrite period.",
      keyDecision:
        "Two senior mobile engineering hires approved, contractor design support extended into Q3.",
      subtopics: [
        "Hiring process is active",
        "Roles include senior mobile engineering",
        "Budget allocation remains within current quarter envelope",
        "Contractor support helps with design and release preparation",
      ],
      actionItems: [
        "Post finalized role descriptions",
        "Open recruiting channels",
        "Update recruiting and timeline tracker",
      ],
    },
    {
      title: "Success markers",
      summary:
        "The room confirmed success criteria and monitoring requirements before release.",
      keyDecision:
        "Success includes reliability, retention, and user quality thresholds for release acceptance.",
      subtopics: [
        "Reliability target established for rewrite baseline",
        "Retention and user quality markers are defined",
        "Analytics dashboard configuration is part of rollout plan",
        "Cadence for review is fixed weekly",
        "Reporting responsibilities are assigned",
      ],
      actionItems: [
        "Set dashboard schema",
        "Add alerts for rollback criteria",
        "Publish team progress updates",
      ],
    },
    {
      title: "Budget and approvals",
      summary:
        "The Q3 engineering budget and cloud growth assumptions were confirmed with clear approval boundaries.",
      keyDecision: "Q3 budget is approved at the revised amount with no additional approvals under the threshold.",
      subtopics: [
        "Headcount and contractor allocation are set",
        "Cloud spend expectations are approved",
        "Contingency allocation is maintained",
        "No additional approval required below current cap",
      ],
      actionItems: [
        "Publish budget tracker with current status",
        "Coordinate finance checkpoints each sprint",
      ],
    },
  ],
  overallActionItems: [
    "Send meeting recap with decisions and owners",
    "Update the team board with ticket owners",
    "Schedule the next check-in",
  ],
};

export default function DemoPage() {
  // Build the HTML on the server — no JS needed in the component itself
  let demoHtml: string;
  try {
    demoHtml = buildMeetingDoc(SAMPLE_DOC);
  } catch {
    demoHtml = "<p>Demo unavailable</p>";
  }

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #080c18; }
        .demo-frame { width: 100%; height: 100vh; border: none; display: block; }
      `}</style>
      <iframe
        className="demo-frame"
        srcDoc={demoHtml}
        title="Decker sample meeting artifact"
        sandbox="allow-same-origin allow-scripts"
      />
    </>
  );
}

export const metadata = {
  title: "Decker demo | Closing deck sample",
  description: "View a sample Decker closing deck generated from meeting content to verify structure and format.",
};
