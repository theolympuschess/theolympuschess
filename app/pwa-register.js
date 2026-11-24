/* Register the same PWA service worker from login and the main dashboard. */
(() => {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js", {
        scope: "./"
      });

      // Check whether the deployed service worker itself has changed.
      // The current app is not forcibly refreshed, so an active class is not interrupted.
      registration.update().catch((error) => {
        console.warn("Olympus PWA update check was skipped:", error);
      });

      console.info("Olympus PWA service worker registered.");
    } catch (error) {
      console.error("Olympus PWA service worker registration failed:", error);
    }
  });
})();
