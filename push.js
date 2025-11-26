let VAPID_PUBLIC_KEY = null;
let SW_REGISTRATION = null;

const API_BASE =
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost"
    ? "http://127.0.0.1:5000"
    : "https://peelr-backend-29561842452.us-central1.run.app";

async function loadVapidKey() {
  if (VAPID_PUBLIC_KEY) return;

  const res = await fetch(`${API_BASE}/api/vapid-public-key`, {
    headers: {
      "X-PEELR-CLIENT": PEELR_CLIENT_TOKEN
    }
  });

  if (!res.ok) {
    console.error("Failed to load VAPID key:", res.status);
    throw new Error("Unauthorized");
  }

  const data = await res.json();
  VAPID_PUBLIC_KEY = data.publicKey;
}

async function registerServiceWorker() {
  if (SW_REGISTRATION) return SW_REGISTRATION;

  console.log("Registering service worker...");

  SW_REGISTRATION = await navigator.serviceWorker.register("/static/sw.js");

  console.log("Service worker registered.");

  return SW_REGISTRATION;
}

async function getPushSubscription(productId) {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers not supported.");
  }

  await loadVapidKey();

  const registration = await registerServiceWorker();

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    console.log("Creating a new push subscription...");

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    console.log("REAL PUSH SUBSCRIPTION:", subscription);
  }

  await fetch(`${API_BASE}/api/register-push`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-PEELR-CLIENT": PEELR_CLIENT_TOKEN
  },
  body: JSON.stringify({
    subscription,
    product_id: productId
  })
});

  return subscription;
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const raw = atob(base64);
  const output = new Uint8Array(raw.length);

  for (let i = 0; i < raw.length; ++i) {
    output[i] = raw.charCodeAt(i);
  }

  return output;
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Push.js loaded.");

  try {
    await loadVapidKey();
    await registerServiceWorker();
  } catch (err) {
    console.error("Push init error:", err);
  }
});