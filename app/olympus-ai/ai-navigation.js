
/* =========================================================
   OLYMPUS AI — SAFE NAVIGATION
   Supports:
   1. Normal dashboard sections using data-tab
   2. Standalone games using data-lock-tab

   Always triggers the REAL existing MainUI button.
   Does not bypass original click handlers or permissions.
   ========================================================= */

import { findFeatureByTab } from "./ai-catalog.js";

export function openFeature(tab) {

  // Find the verified feature in the live catalogue.
  const feature = findFeatureByTab(tab);

  if (!feature) {
    return {
      ok: false,
      message: "That feature is not currently available."
    };
  }

  // Find the original MainUI button.
  const button = feature.buttonId
    ? document.getElementById(feature.buttonId)
    : document.querySelector(
        `.nav-btn[data-tab="${CSS.escape(feature.tab)}"]`
      );

  if (!button) {
    return {
      ok: false,
      message: "The original dashboard button could not be found."
    };
  }

  // Confirm that the button still represents this feature.
  if (feature.kind === "standalone") {

    if (button.dataset.lockTab !== feature.tab) {
      return {
        ok: false,
        message: "The original game button could not be verified."
      };
    }

  } else {

    if (button.dataset.tab !== feature.tab) {
      return {
        ok: false,
        message: "The original dashboard button could not be verified."
      };
    }

    // Normal dashboard features must have a real section.
    const section = document.getElementById(feature.sectionId);

    if (!section) {
      return {
        ok: false,
        message: "The destination section could not be found."
      };
    }
  }

  // Check whether the original button is available.
  if (
    button.disabled ||
    button.hidden ||
    button.getAttribute("aria-hidden") === "true" ||
    button.getAttribute("aria-disabled") === "true" ||
    getComputedStyle(button).display === "none"
  ) {
    return {
      ok: false,
      message: "This feature is currently unavailable."
    };
  }

  try {

    // Trigger the original MainUI click handler.
    // This preserves the existing game launch and lock logic.
    button.click();

    return {
      ok: true,
      feature,
      message: `Opening ${feature.label.replace(/\s+/g, " ").trim()}.`
    };

  } catch (error) {

    console.error("Olympus AI navigation error:", error);

    return {
      ok: false,
      message: "The feature could not be opened."
    };

  }
}
