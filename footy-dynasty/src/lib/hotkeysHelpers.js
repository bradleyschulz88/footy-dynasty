/** True when keyboard shortcuts should not steal focus from inputs. */
export function isTypingTarget(target) {
  if (!target || typeof target !== "object") return false;
  const el = target;
  const tag = String(el.tagName || "").toUpperCase();
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  if (el.getAttribute?.("role") === "textbox") return true;
  return false;
}

export function collectFocusables(container) {
  if (!container) return [];
  const sel =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll(sel));
}
