export interface CaptureTab {
  id?: number;
  active?: boolean;
  url?: string;
  audible?: boolean;
  mutedInfo?: { muted: boolean };
}

export interface CaptureReadiness {
  eligible: boolean;
  meetingName: string;
  message: string;
  warning?: string;
}

const BLOCKED_WEB_HOSTS = new Set([
  "chrome.google.com",
  "chromewebstore.google.com",
  "addons.mozilla.org",
  "microsoftedge.microsoft.com",
]);

function meetingName(hostname: string): string {
  if (hostname === "meet.google.com") return "Google Meet";
  if (hostname === "zoom.us" || hostname.endsWith(".zoom.us")) return "Zoom Web";
  if (hostname === "teams.microsoft.com" || hostname === "teams.live.com") return "Microsoft Teams Web";
  if (hostname === "webex.com" || hostname.endsWith(".webex.com")) return "Webex";
  return "Browser meeting";
}

export function assessCaptureTab(tab?: CaptureTab): CaptureReadiness {
  const unsupported = (message = "The browser does not allow recording this page. Open the meeting in a regular browser tab, play audio, then reopen Decker."): CaptureReadiness => ({
    eligible: false,
    meetingName: "Browser meeting",
    message,
  });

  if (!tab?.id || !tab.url) {
    return unsupported("Open a meeting in a browser tab. Native meeting apps aren't supported.");
  }
  if (tab.active === false) {
    return unsupported("Return to the active meeting tab before recording.");
  }

  let url: URL;
  try {
    url = new URL(tab.url);
  } catch {
    return unsupported();
  }

  if (!['http:', 'https:'].includes(url.protocol) || BLOCKED_WEB_HOSTS.has(url.hostname)) return unsupported();

  const name = meetingName(url.hostname);
  const warning = tab.mutedInfo?.muted
    ? "This tab is muted. Decker will start capture, but meeting audio may be silent."
    : !tab.audible
      ? "No tab audio is playing yet. Decker will start capture and check the captured signal."
      : undefined;
  return { eligible: true, meetingName: name, message: `${name} is ready to capture.`, warning };
}

const RETRY_STEPS = "Select the meeting tab, make sure audio is playing, reopen Decker, and try again.";

export function captureErrorMessage(message: string): string {
  if (/permission.*denied|denied.*permission|not permitted/i.test(message)) {
    return `Tab audio permission was denied. ${RETRY_STEPS}`;
  }
  if (/browser does not allow recording|cannot access contents|unsupported page|extension page|chrome:\/\/|edge:\/\/|about:/i.test(message)) {
    return "The browser does not allow recording this page. Open the meeting in a regular browser tab, make sure audio is playing, then reopen Decker.";
  }
  if (/active stream|already.*captur/i.test(message)) {
    return `This tab is already being captured. Stop the other capture. ${RETRY_STEPS}`;
  }
  return `Audio capture did not start. ${RETRY_STEPS}`;
}
