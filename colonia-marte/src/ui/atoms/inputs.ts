import { createIcon, type UIIconInput } from "../foundation/icons";
import { bindFieldValidation } from "../foundation/validation";
import type { UIRegistry } from "../registry";
import { asRecord, pickBoolean, pickEnum, pickString } from "../types";

let fieldSeq = 0;
function nextFieldId(prefix: string): string {
  fieldSeq += 1;
  return `${prefix}-${fieldSeq}`;
}

export interface UITextFieldParams {
  label: string;
  placeholder: string;
  value: string;
  helpText?: string;
  errorMessage?: string;
  size: "Medium" | "Large";
  type: "text" | "email" | "search" | "password" | "url";
  required: boolean;
  disabled: boolean;
  clearable: boolean;
  prefixIcon?: UIIconInput;
  id?: string;
}

export function parseTextFieldParams(input: unknown): UITextFieldParams {
  const rec = asRecord(input);
  return {
    label: pickString(rec.label, "Callsign", "label"),
    placeholder: pickString(rec.placeholder, "Enter sector or crew ID...", "placeholder"),
    value: pickString(rec.value, "", "value"),
    helpText: typeof rec.helpText === "string" ? rec.helpText : undefined,
    errorMessage: typeof rec.errorMessage === "string" ? rec.errorMessage : undefined,
    size: pickEnum(rec.size, ["Medium", "Large"] as const, "Medium", "size"),
    type: pickEnum(rec.type, ["text", "email", "search", "password", "url"] as const, "text", "type"),
    required: pickBoolean(rec.required, false, "required"),
    disabled: pickBoolean(rec.disabled, false, "disabled"),
    clearable: pickBoolean(rec.clearable, true, "clearable"),
    prefixIcon: typeof rec.prefixIcon === "string" ? (rec.prefixIcon as UIIconInput) : undefined,
    id: typeof rec.id === "string" ? rec.id : undefined,
  };
}

export function createTextField(params: Partial<UITextFieldParams> = {}): HTMLElement {
  const parsed = parseTextFieldParams(params);
  const controlId = parsed.id ?? nextFieldId("ui-tf");
  const hintId = parsed.helpText ? `${controlId}-hint` : undefined;
  const errorId = `${controlId}-error`;

  const wrap = document.createElement("div");
  wrap.className = "ui-field";

  const label = document.createElement("label");
  label.htmlFor = controlId;
  label.className = "ui-field__label";
  label.textContent = parsed.label;
  if (parsed.required) {
    const req = document.createElement("span");
    req.className = "ui-field__req";
    req.setAttribute("aria-hidden", "true");
    req.textContent = "*";
    label.append(req);
  }
  wrap.append(label);

  /* Hint placed above input so autocomplete popovers do not obscure it (modern-web-guidance: accessibility) */
  if (parsed.helpText && hintId) {
    const hint = document.createElement("span");
    hint.id = hintId;
    hint.className = "ui-field__hint";
    hint.textContent = parsed.helpText;
    wrap.append(hint);
  }

  const frame = document.createElement("div");
  frame.className = `ui-field__frame ${parsed.size === "Large" ? "ui-field__frame--lg" : ""}`.trim();
  if (parsed.prefixIcon) frame.append(createIcon(parsed.prefixIcon, { size: 16 }));

  const input = document.createElement("input");
  input.id = controlId;
  input.type = parsed.type;
  input.className = "ui-input";
  input.placeholder = parsed.placeholder;
  input.value = parsed.value;
  input.required = parsed.required;
  input.disabled = parsed.disabled;
  if (parsed.type === "search") {
    input.setAttribute("autocorrect", "off");
    input.setAttribute("autocapitalize", "none");
    input.spellcheck = false;
  }
  frame.append(input);

  if (parsed.clearable && !parsed.disabled) {
    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "ui-field__clear ui-focusable";
    clearBtn.setAttribute("aria-label", `Clear ${parsed.label}`);
    clearBtn.hidden = input.value.length === 0;
    clearBtn.append(createIcon("close", { size: 14 }));
    input.addEventListener("input", () => { clearBtn.hidden = input.value.length === 0; });
    clearBtn.addEventListener("click", () => {
      input.value = "";
      clearBtn.hidden = true;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
    });
    frame.append(clearBtn);
  }

  const error = document.createElement("span");
  error.id = errorId;
  error.className = "ui-field__error";
  error.hidden = true;
  wrap.append(frame, error);

  bindFieldValidation({
    control: input,
    errorElement: error,
    hintId,
    defaultErrorMessage: parsed.errorMessage ?? `Please provide a valid ${parsed.label.toLowerCase()}.`,
  });
  return wrap;
}

export interface UIDropdownOption {
  value: string;
  label: string;
}

export interface UIDropdownParams {
  label: string;
  options: readonly UIDropdownOption[];
  value: string;
  helpText?: string;
  size: "Small" | "Medium" | "Large";
  required: boolean;
  disabled: boolean;
  id?: string;
  onChange?: (value: string) => void;
}

export function parseDropdownParams(input: unknown): UIDropdownParams {
  const rec = asRecord(input);
  const rawOptions = Array.isArray(rec.options) ? rec.options : [
    { value: "jezero", label: "Jezero Crater Base" },
    { value: "polar", label: "North Polar Outpost" },
    { value: "orbital", label: "Ares Orbital Relay" },
  ];
  const options = rawOptions.map((item, idx) => {
    const obj = asRecord(item);
    return {
      value: pickString(obj.value, `opt-${idx}`, "options.value"),
      label: pickString(obj.label, `Sector ${idx + 1}`, "options.label"),
    };
  });
  return {
    label: pickString(rec.label, "Deployment sector", "label"),
    options,
    value: pickString(rec.value, options[0]?.value ?? "", "value"),
    helpText: typeof rec.helpText === "string" ? rec.helpText : undefined,
    size: pickEnum(rec.size, ["Small", "Medium", "Large"] as const, "Medium", "size"),
    required: pickBoolean(rec.required, false, "required"),
    disabled: pickBoolean(rec.disabled, false, "disabled"),
    id: typeof rec.id === "string" ? rec.id : undefined,
    onChange: typeof rec.onChange === "function" ? (rec.onChange as (value: string) => void) : undefined,
  };
}

export function createDropdown(params: Partial<UIDropdownParams> = {}): HTMLElement {
  const parsed = parseDropdownParams(params);
  const controlId = parsed.id ?? nextFieldId("ui-dd");
  const hintId = parsed.helpText ? `${controlId}-hint` : undefined;
  const errorId = `${controlId}-error`;

  const wrap = document.createElement("div");
  wrap.className = "ui-field";

  const label = document.createElement("label");
  label.htmlFor = controlId;
  label.className = "ui-field__label";
  label.textContent = parsed.label;
  if (parsed.required) {
    const req = document.createElement("span");
    req.className = "ui-field__req";
    req.setAttribute("aria-hidden", "true");
    req.textContent = "*";
    label.append(req);
  }
  wrap.append(label);

  if (parsed.helpText && hintId) {
    const hint = document.createElement("span");
    hint.id = hintId;
    hint.className = "ui-field__hint";
    hint.textContent = parsed.helpText;
    wrap.append(hint);
  }

  const frame = document.createElement("div");
  frame.className = `ui-field__frame ${parsed.size === "Large" ? "ui-field__frame--lg" : ""}`.trim();

  const select = document.createElement("select");
  select.id = controlId;
  select.className = "ui-select";
  select.required = parsed.required;
  select.disabled = parsed.disabled;
  for (const opt of parsed.options) {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.label;
    option.selected = opt.value === parsed.value;
    select.append(option);
  }
  if (parsed.onChange) {
    select.addEventListener("change", () => parsed.onChange?.(select.value));
  }
  frame.append(select, createIcon("arrow-down-01", { size: 14, className: "ui-field__chevron" }));

  const error = document.createElement("span");
  error.id = errorId;
  error.className = "ui-field__error";
  error.hidden = true;
  wrap.append(frame, error);

  bindFieldValidation({ control: select, errorElement: error, hintId });
  return wrap;
}

export function registerInputAtoms(registry: UIRegistry): void {
  registry.register<UITextFieldParams>("UI-ATOM-TEXT-FIELD", {
    metadata: {
      layer: "atom",
      name: "Bracketed Text Field",
      figmaNodeId: "55:913",
      description: "Sci-fi text input with side bracket bars, hint above field, clear button, and :user-invalid state.",
    },
    variants: {
      mediumDefault: parseTextFieldParams({
        label: "Crew Callsign", placeholder: "e.g. ARES-04", helpText: "Uppercase alphanumeric identifier.",
        required: true, prefixIcon: "search-01",
      }),
      largeEmail: parseTextFieldParams({
        label: "Telemetry Uplink Email", type: "email", size: "Large",
        placeholder: "ops@mars-colony.org", required: true,
      }),
    },
    parse: parseTextFieldParams,
    render: createTextField,
  });

  registry.register<UIDropdownParams>("UI-ATOM-DROPDOWN", {
    metadata: {
      layer: "atom",
      name: "HUD Select Dropdown",
      figmaNodeId: "57:1855",
      description: "Bracketed select progressively enhanced with appearance: base-select.",
    },
    variants: {
      mediumSector: parseDropdownParams({
        label: "Target Sector", size: "Medium", helpText: "Select active pressurized module.",
      }),
      largeRequired: parseDropdownParams({
        label: "Airlock Protocol", size: "Large", required: true,
      }),
    },
    parse: parseDropdownParams,
    render: createDropdown,
  });
}
