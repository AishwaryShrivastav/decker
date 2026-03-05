import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { DeckerPanel } from "./DeckerPanel";
import { Message, MessageType, RecordingStatus } from "../shared/types";
import panelStyles from "./panel.css?inline";

// Only inject on active Google Meet pages
function isMeetPage(): boolean {
  return (
    window.location.hostname === "meet.google.com" &&
    document.querySelector("[data-meeting-code]") !== null
  );
}

function waitForMeet(): Promise<void> {
  return new Promise((resolve) => {
    if (isMeetPage()) {
      resolve();
      return;
    }

    const observer = new MutationObserver(() => {
      if (isMeetPage()) {
        observer.disconnect();
        resolve();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Fallback: check every second for up to 30s
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (isMeetPage()) {
        clearInterval(interval);
        observer.disconnect();
        resolve();
      } else if (attempts > 30) {
        clearInterval(interval);
        observer.disconnect();
        resolve(); // inject anyway
      }
    }, 1000);
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
