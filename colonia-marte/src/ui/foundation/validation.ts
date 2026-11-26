/**
 * Accessible form validation helper following modern-web-guidance:
 * - Initializes aria-invalid="false" rather than leaving it unset
 * - Uses :user-invalid with a .user-invalid-fallback class for older engines
 * - Links error IDs in aria-describedby ONLY while invalid, preserving hint IDs
 * - Announces errors on blur through ariaNotify or a single polite live region
 */

let sharedAnnouncer: HTMLElement | null = null;

function supportsUserInvalid(): boolean {
  try {
    return typeof CSS !== "undefined" && typeof CSS.supports === "function"
      && CSS.supports("selector(:user-invalid)");
  } catch {
    return false;
  }
}

export function ensureValidationAnnouncer(root: ParentNode = document.body): HTMLElement {
  if (sharedAnnouncer && sharedAnnouncer.isConnected) return sharedAnnouncer;
  const existing = root.querySelector<HTMLElement>("#ui-validation-announcer");
  if (existing) {
    sharedAnnouncer = existing;
    return existing;
  }
  const region = document.createElement("div");
  region.id = "ui-validation-announcer";
  region.className = "visually-hidden";
  region.setAttribute("aria-live", "polite");
  region.setAttribute("aria-atomic", "true");
  if (document.body) document.body.append(region);
  sharedAnnouncer = region;
  return region;
}

export function announcePolite(message: string): void {
  const navNotify = (document as Document & {
    ariaNotify?: (text: string, opts?: { priority?: string }) => void;
  }).ariaNotify;
  if (typeof navNotify === "function") {
    navNotify.call(document, message, { priority: "normal" });
    return;
  }
  const region = ensureValidationAnnouncer();
  region.textContent = "";
  region.textContent = message;
}

export interface ValidationBindingOptions {
  control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  errorElement: HTMLElement;
  hintId?: string;
  defaultErrorMessage?: string;
}

export function bindFieldValidation({
  control,
  errorElement,
  hintId,
  defaultErrorMessage = "Invalid input",
}: ValidationBindingOptions): { sync: (forceFallback?: boolean) => boolean } {
  control.setAttribute("aria-invalid", "false");
  if (hintId) control.setAttribute("aria-describedby", hintId);
  ensureValidationAnnouncer();

  const nativeUserInvalid = supportsUserInvalid();

  const updateDescribedBy = (includeError: boolean) => {
    const ids = [hintId, includeError ? errorElement.id : undefined].filter(Boolean);
    if (ids.length) control.setAttribute("aria-describedby", ids.join(" "));
    else control.removeAttribute("aria-describedby");
  };

  const sync = (forceFallback = false): boolean => {
    if (forceFallback && !control.validity.valid) {
      control.classList.add("user-invalid-fallback");
    } else if (control.validity.valid) {
      control.classList.remove("user-invalid-fallback");
    }
    const matchesNative = nativeUserInvalid && safeMatches(control, ":user-invalid");
    const isInvalid = !control.validity.valid
      && (matchesNative || control.classList.contains("user-invalid-fallback") || forceFallback);

    control.setAttribute("aria-invalid", String(isInvalid));
    if (isInvalid) {
      errorElement.textContent = control.validationMessage || defaultErrorMessage;
      errorElement.hidden = false;
      updateDescribedBy(true);
    } else {
      errorElement.textContent = "";
      errorElement.hidden = true;
      updateDescribedBy(false);
    }
    return isInvalid;
  };

  control.addEventListener("input", () => { sync(false); });
  control.addEventListener("change", () => { sync(false); });
  control.addEventListener("invalid", () => { sync(true); });
  control.addEventListener("blur", () => {
    const hadInteraction = control.value.length > 0 || control.classList.contains("user-invalid-fallback");
    const isInvalid = sync(!nativeUserInvalid && hadInteraction);
    if (isInvalid && errorElement.textContent) {
      announcePolite(errorElement.textContent);
    }
  });

  return { sync };
}

function safeMatches(element: Element, selector: string): boolean {
  try {
    return element.matches(selector);
  } catch {
    return false;
  }
}
