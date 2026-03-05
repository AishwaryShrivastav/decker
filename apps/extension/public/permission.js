document.addEventListener("DOMContentLoaded", async () => {
  const allow = document.getElementById("allow");
  const status = document.getElementById("status");

  async function updateUI(granted) {
    status.style.display = "block";
    if (granted) {
      status.className = "status success";
      status.textContent = "Permission granted. You can close this tab.";
      allow.style.display = "none";
    } else {
      status.style.display = "none";
      allow.style.display = "";
    }
  }

  async function checkPermission() {
    try {
      const perm = await navigator.permissions.query({ name: "microphone" });
      if (perm.state === "granted") {
        updateUI(true);
        return;
      }
    } catch (_) {
      /* Permissions API may not support microphone in this context */
    }
    updateUI(false);
  }

  await checkPermission();

  allow.addEventListener("click", async () => {
    allow.disabled = true;
    status.style.display = "block";
    status.className = "status pending";
    status.textContent = "Requesting…";

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      status.className = "status success";
      status.textContent = "Permission granted. You can close this tab.";
      allow.style.display = "none";
    } catch (err) {
      const msg = err.name === "NotAllowedError"
        ? "Permission denied. Click the lock/camera icon in the address bar to allow microphone for this extension."
        : err.message || "Failed to access microphone.";
      status.className = "status error";
      status.textContent = msg;
      allow.disabled = false;
    }
  });
});
