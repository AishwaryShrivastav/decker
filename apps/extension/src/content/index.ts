import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { DeckerPanel } from "./DeckerPanel";
import { Message, MessageType, RecordingStatus } from "../shared/types";
import panelStyles from "./panel.css?inline";

// Google Meet room URLs look like meet.google.com/abc-defg-hij
function isMeetingUrl(): boolean {
  return (
    window.location.hostname === "meet.google.com" &&
    /^\/[a-z]+-[a-z]+-[a-z]+/.test(window.location.pathname)
  );
}

function waitForMeet(): Promise<void> {
  return new Promise((resolve) => {
    // Already on a meeting URL — wait briefly for the DOM to settle
    if (isMeetingUrl()) {
      setTimeout(resolve, 1500);
      return;
    }

    // Not a meeting URL yet — watch for navigation (Google Meet is a SPA)
    const observer = new MutationObserver(() => {
      if (isMeetingUrl()) {
        observer.disconnect();
        setTimeout(resolve, 1500);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
}

async function injectPanel(): Promise<void> {
  // Don't inject twice
  if (document.getElementById("decker-shadow-host")) return;

  await waitForMeet();

  // Get current recording status from background
  let initialStatus: RecordingStatus = "idle";
  try {
    const response = await chrome.runtime.sendMessage<Message>({
      type: MessageType.GET_STATUS,
    });
    initialStatus = (response as { status: RecordingStatus }).status ?? "idle";
  } catch {
    // Background not ready yet, default to idle
  }

  // Shadow DOM host
  const host = document.createElement("div");
  host.id = "decker-shadow-host";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  // Inject styles into shadow root
  const styleEl = document.createElement("style");
  styleEl.textContent = panelStyles as string;
  shadow.appendChild(styleEl);

  // Panel container
  const container = document.createElement("div");
  container.id = "decker-root";
  shadow.appendChild(container);

  // Mount React
  const root = createRoot(container);
  root.render(createElement(DeckerPanel, { initialStatus }));

  console.log("[Decker content] Panel injected");
}

injectPanel().catch(console.error);
