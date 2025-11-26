console.log("📡 Service Worker loaded and ready.");

self.addEventListener("push", (event) => {
  console.log("🚨 PUSH EVENT RECEIVED:", event);

  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error("Push event data error:", e);
  }

  const title = data.title || "Peelr Alert";
  const body = data.body || "There's an update!";
  const url = data.url || "https://usepeelr.com";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/static/icons/icon-192.png",
      badge: "/static/icons/icon-192.png",
      data: { url },
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("🖱 Notification clicked");

  event.notification.close();

  const targetUrl = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});