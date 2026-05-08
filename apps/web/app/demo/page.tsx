import { buildMeetingDoc } from "../../lib/docTemplate";

// ---------------------------------------------------------------------------
// Sample meeting data — shows the full Decker output experience
// ---------------------------------------------------------------------------
const SAMPLE_DOC = {
  title: "Q3 Product & Engineering Review",
  subtitle: "Transcript · May 8, 2026 · 52 min",
  summary:
    "The team aligned on prioritising the mobile rewrite for Q3, agreed to defer two feature launches to Q4, and confirmed headcount plans including two senior engineering hires by July. Budget allocation and success metrics were finalised.",
  topics: [
    {
      title: "Mobile App Rewrite Priority",
      summary:
        "The team unanimously agreed to make the mobile rewrite the single top priority for Q3. The current app has a 2.1★ App Store rating driven by crash rates and slow load times. A rewrite in React Native is expected to cut crash rate by 60% and improve retention.",
      keyDecision: "Mobile rewrite is the #1 engineering priority for Q3; no new feature work until v2.0 ships.",
      subtopics: [
        "Current app crashes affect ~18% of DAU — unacceptable for growth targets",
        "React Native chosen over Flutter due to existing web team expertise",
        "Target launch: September 15th; public beta August 1st",
        "All 6 mobile engineers re-allocated from feature work effective immediately",
        "Weekly ship cadence with TestFlight builds starting Week 1",
      ],
      actionItems: [
        "Set up React Native monorepo scaffold: @sarah by May 12",
        "Archive v1 codebase and document component mapping: @tim by May 15",
        "Create public beta waitlist landing page: @design team by May 20",
      ],
    },
    {
      title: "Q4 Feature Deferrals",
      summary:
        "Two planned Q3 features — collaborative notebooks and advanced analytics — will be pushed to Q4 to protect mobile rewrite bandwidth. Stakeholders have been informed. The team discussed customer impact and agreed compensating measures.",
      keyDecision:
        "Collaborative notebooks and advanced analytics moved to Q4 roadmap; notify affected enterprise customers by May 15.",
      subtopics: [
        "Collaborative notebooks: 23 enterprise customers waiting — propose interim workaround via API",
        "Advanced analytics: only 4 customers in beta; low urgency, smooth deferral expected",
        "Both features resume October 1st with dedicated pod structure",
        "Customer success to run 1:1 calls with all affected enterprise accounts",
        "No SLA compensation required based on contract review",
      ],
      actionItems: [
        "Draft customer notification email for notebooks deferral: @maya by May 10",
        "Schedule enterprise 1:1s for all 23 affected accounts: @cs team this week",
        "Update public roadmap page: @product by May 12",
      ],
    },
    {
      title: "Headcount & Hiring Plan",
      summary:
        "Two senior React Native / mobile engineers approved for Q3 hiring. Existing budget headroom confirmed. Recruiting pipeline targets 30-day time-to-offer. One contractor extension approved for design support during mobile rewrite sprint.",
      keyDecision: "Two senior mobile engineer hires approved; contractor design support extended through Q3.",
      subtopics: [
        "JDs drafted; posting to LinkedIn, AngelList and internal referral program",
        "Target profile: 5+ years mobile, React Native preferred, system design required",
        "Recruiting budget: $12K per hire for agency + job board fees",
        "Interview process: screen → take-home → system design → culture → offer (30 days)",
        "Contractor (@designco) extended at current rate through September 30",
      ],
      actionItems: [
        "Post job descriptions to all channels: @hr by May 9",
        "Set up Greenhouse pipeline with new scorecards: @recruiting by May 10",
        "Brief engineering leads on interviewing expectations: @CTO by May 13",
      ],
    },
    {
      title: "Success Metrics & KPIs",
      summary:
        "The team defined clear success criteria for the mobile rewrite and Q3 overall. North Star metric remains weekly active users. Secondary metrics focus on crash rate, app store rating, and 30-day retention. A new dashboard will be set up in Amplitude.",
      keyDecision:
        "Mobile v2.0 success = crash rate <1%, App Store rating ≥4.0★, 30-day retention +15% vs. v1.",
      subtopics: [
        "Crash rate target: <1% (down from 18%) — measured via Sentry",
        "App Store rating target: ≥4.0★ by end of Q3",
        "30-day retention: lift from 34% to 39%+",
        "Weekly active users: maintain current trajectory of +8% MoM",
        "Amplitude dashboard to track all metrics in real-time from beta launch",
      ],
      actionItems: [
        "Set up Amplitude mobile rewrite dashboard: @data team by May 14",
        "Configure Sentry crash rate alerts at 1% threshold: @eng on-call by May 11",
        "Add KPIs to weekly exec summary template: @product by May 9",
      ],
    },
    {
      title: "Budget & Resource Allocation",
      summary:
        "Q3 engineering budget reviewed. Cloud infrastructure costs are on track. AWS spend expected to increase 15% due to mobile beta CDN load. Total Q3 eng budget approved at $1.2M including headcount, contractors, and infra.",
      keyDecision: "Q3 eng budget confirmed at $1.2M. AWS spend increase pre-approved. No further approvals needed below $50K.",
      subtopics: [
        "Headcount costs: $840K (7 FTEs + 2 new hires from August + 1 contractor)",
        "AWS infrastructure: $180K budget, +15% from Q2 for CDN and mobile backend",
        "Tooling and licenses: $45K (unchanged from Q2)",
        "Recruiting costs: $24K for two senior hires",
        "Contingency reserve: $111K (~9%) held for unexpected needs",
      ],
      actionItems: [
        "Get AWS cost forecast from infra team for CDN spike modeling: @devops by May 13",
        "Update budget tracker with Q3 actuals template: @finance by May 10",
      ],
    },
  ],
  overallActionItems: [
    "Send Q3 all-hands recap email summarising key decisions: @CEO by May 9",
    "Update Notion project board with all phase 1 tickets: @EM by May 10",
    "Schedule mid-quarter check-in for July 15: @chiefs-of-staff",
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
      {/* Meta wrapper — the iframe fills the viewport */}
      <style>{`
        html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #080c18; }
        .demo-frame { width: 100%; height: 100vh; border: none; display: block; }
      `}</style>
      <iframe
        className="demo-frame"
        srcDoc={demoHtml}
        title="Decker — Sample Meeting Document"
        sandbox="allow-same-origin allow-scripts"
      />
    </>
  );
}

export const metadata = {
  title: "Decker Demo — Sample Meeting Document",
  description: "See what a Decker-generated meeting document looks like. Claude researches every topic while you're still in the call.",
};
