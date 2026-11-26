import type { UIRegistry } from "../registry";
import { asRecord, pickBoolean, pickString } from "../types";

const SVG_NS = "http://www.w3.org/2000/svg";
let selectionSeq = 0;

function nextId(prefix: string): string {
  selectionSeq += 1;
  return `${prefix}-${selectionSeq}`;
}

export interface UICheckboxParams {
  label: string;
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  id?: string;
}

export function parseCheckboxParams(input: unknown): UICheckboxParams {
  const rec = asRecord(input);
  return {
    label: pickString(rec.label, "Enable atmospheric scrubbers", "label"),
    checked: pickBoolean(rec.checked, false, "checked"),
    indeterminate: pickBoolean(rec.indeterminate, false, "indeterminate"),
    disabled: pickBoolean(rec.disabled, false, "disabled"),
    id: typeof rec.id === "string" ? rec.id : undefined,
  };
}

export function createCheckbox(params: Partial<UICheckboxParams> = {}): HTMLLabelElement {
  const parsed = parseCheckboxParams(params);
  const controlId = parsed.id ?? nextId("ui-chk");
  const label = document.createElement("label");
  label.htmlFor = controlId;
  label.className = `ui-check-row ${parsed.disabled ? "ui-check-row--disabled" : ""}`.trim();

  const input = document.createElement("input");
  input.type = "checkbox";
  input.id = controlId;
  input.className = "ui-native-choice";
  input.checked = parsed.checked;
  input.indeterminate = parsed.indeterminate;
  input.disabled = parsed.disabled;

  const box = document.createElement("span");
  box.className = "ui-checkbox-box";
  box.setAttribute("aria-hidden", "true");

  const text = document.createElement("span");
  text.textContent = parsed.label;
  label.append(input, box, text);
  return label;
}

export interface UIRadioGroupParams {
  legend: string;
  name: string;
  options: readonly { value: string; label: string; disabled?: boolean }[];
  selectedValue: string;
}

export function parseRadioGroupParams(input: unknown): UIRadioGroupParams {
  const rec = asRecord(input);
  const rawOptions = Array.isArray(rec.options) ? rec.options : [
    { value: "orbit", label: "Orbital telemetry" },
    { value: "surface", label: "Surface rover relay" },
    { value: "standby", label: "Low-power standby", disabled: true },
  ];
  const options = rawOptions.map((item, idx) => {
    const obj = asRecord(item);
    return {
      value: pickString(obj.value, `opt-${idx}`, "options.value"),
      label: pickString(obj.label, `Option ${idx + 1}`, "options.label"),
      disabled: pickBoolean(obj.disabled, false, "options.disabled"),
    };
  });
  return {
    legend: pickString(rec.legend, "Relay channel", "legend"),
    name: pickString(rec.name, nextId("ui-radio-grp"), "name"),
    options,
    selectedValue: pickString(rec.selectedValue, options[0]?.value ?? "orbit", "selectedValue"),
  };
}

function buildHexRadioGraphic(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", "ui-radio-hex");

  const outer = document.createElementNS(SVG_NS, "polygon");
  outer.setAttribute("points", "12,2 20.6,7 20.6,17 12,22 3.4,17 3.4,7");
  outer.setAttribute("fill", "none");
  outer.setAttribute("stroke", "currentColor");
  outer.setAttribute("stroke-width", "1.6");

  const core = document.createElementNS(SVG_NS, "polygon");
  core.setAttribute("points", "12,6.5 16.8,9.2 16.8,14.8 12,17.5 7.2,14.8 7.2,9.2");
  core.setAttribute("class", "ui-radio-hex__core");
  svg.append(outer, core);
  return svg;
}

export function createRadioGroup(params: Partial<UIRadioGroupParams> = {}): HTMLFieldSetElement {
  const parsed = parseRadioGroupParams(params);
  const fieldset = document.createElement("fieldset");
  fieldset.className = "ui-radio-fieldset";
  const legend = document.createElement("legend");
  legend.className = "ui-radio-legend";
  legend.textContent = parsed.legend;
  fieldset.append(legend);

  for (const option of parsed.options) {
    const id = nextId("ui-radio");
    const row = document.createElement("label");
    row.htmlFor = id;
    row.className = `ui-radio-option ${option.disabled ? "ui-radio-option--disabled" : ""}`.trim();

    const input = document.createElement("input");
    input.type = "radio";
    input.id = id;
    input.name = parsed.name;
    input.value = option.value;
    input.className = "ui-native-choice";
    input.checked = option.value === parsed.selectedValue;
    input.disabled = Boolean(option.disabled);

    const text = document.createElement("span");
    text.textContent = option.label;
    row.append(input, buildHexRadioGraphic(), text);
    fieldset.append(row);
  }
  return fieldset;
}

export interface UIToggleParams {
  label: string;
  checked: boolean;
  disabled: boolean;
  id?: string;
  className?: string;
}

export function parseToggleParams(input: unknown): UIToggleParams {
  const rec = asRecord(input);
  return {
    label: pickString(rec.label, "Balanced resolution", "label"),
    checked: pickBoolean(rec.checked, false, "checked"),
    disabled: pickBoolean(rec.disabled, false, "disabled"),
    id: typeof rec.id === "string" ? rec.id : undefined,
    className: typeof rec.className === "string" ? rec.className : undefined,
  };
}

export function createToggle(params: Partial<UIToggleParams> = {}): HTMLLabelElement {
  const parsed = parseToggleParams(params);
  const controlId = parsed.id ?? nextId("ui-switch");
  const label = document.createElement("label");
  label.htmlFor = controlId;
  const classes = ["ui-toggle-row"];
  if (parsed.disabled) classes.push("ui-toggle-row--disabled");
  if (parsed.className) classes.push(parsed.className);
  label.className = classes.join(" ");

  const input = document.createElement("input");
  input.type = "checkbox";
  input.id = controlId;
  input.className = "ui-native-choice";
  /* Native HTML switch attribute + ARIA switch role fallback (modern-web-guidance: switch) */
  input.setAttribute("switch", "");
  if (typeof HTMLInputElement !== "undefined" && !("switch" in HTMLInputElement.prototype)) {
    input.setAttribute("role", "switch");
  }
  input.checked = parsed.checked;
  input.disabled = parsed.disabled;

  const track = document.createElement("span");
  track.className = "ui-toggle-track";
  track.setAttribute("aria-hidden", "true");
  const thumb = document.createElement("span");
  thumb.className = "ui-toggle-thumb";
  track.append(thumb);

  const text = document.createElement("span");
  text.textContent = parsed.label;
  label.append(input, track, text);
  return label;
}

export function registerSelectionAtoms(registry: UIRegistry): void {
  registry.register<UICheckboxParams>("UI-ATOM-CHECKBOX", {
    metadata: {
      layer: "atom",
      name: "HUD Checkbox",
      figmaNodeId: "52:506",
      description: "Square reticle checkbox supporting unchecked, solid-core checked, and indeterminate states.",
    },
    variants: {
      unchecked: parseCheckboxParams({ label: "Isolate hydroponic loop", checked: false }),
      checked: parseCheckboxParams({ label: "Pressurize canteen sector", checked: true }),
      indeterminate: parseCheckboxParams({ label: "Subsystems nominal (3/4)", indeterminate: true }),
    },
    parse: parseCheckboxParams,
    render: createCheckbox,
  });

  registry.register<UIRadioGroupParams>("UI-ATOM-RADIO", {
    metadata: {
      layer: "atom",
      name: "Hex Radio Group",
      figmaNodeId: "57:1108",
      description: "Pointy-top hexagonal radio selector grouped inside a semantic fieldset.",
    },
    variants: {
      defaultGroup: parseRadioGroupParams({ selectedValue: "orbit" }),
      surfaceSelected: parseRadioGroupParams({ selectedValue: "surface" }),
    },
    parse: parseRadioGroupParams,
    render: createRadioGroup,
  });

  registry.register<UIToggleParams>("UI-ATOM-TOGGLE", {
    metadata: {
      layer: "atom",
      name: "Octagonal Toggle Switch",
      figmaNodeId: "65:645",
      description: "Chamfered octagonal track with hexagonal thumb built on <input type=\"checkbox\" switch>.",
    },
    variants: {
      off: parseToggleParams({ label: "Auxiliary radiators", checked: false }),
      on: parseToggleParams({ label: "Balanced resolution", checked: true }),
      disabled: parseToggleParams({ label: "External airlock override", checked: false, disabled: true }),
    },
    parse: parseToggleParams,
    render: createToggle,
  });
}
