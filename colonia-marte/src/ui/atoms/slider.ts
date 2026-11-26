import type { UIRegistry } from "../registry";
import { asRecord, pickBoolean, pickNumber, pickString } from "../types";

let sliderSeq = 0;

export interface UISliderParams {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit: string;
  disabled: boolean;
  id?: string;
}

export function parseSliderParams(input: unknown): UISliderParams {
  const rec = asRecord(input);
  const min = pickNumber(rec.min, 0, "min");
  const max = pickNumber(rec.max, 100, "max", min);
  return {
    label: pickString(rec.label, "Habitat illumination", "label"),
    min,
    max,
    step: pickNumber(rec.step, 1, "step", 0.001),
    value: pickNumber(rec.value, 50, "value", min, max),
    unit: pickString(rec.unit, "%", "unit"),
    disabled: pickBoolean(rec.disabled, false, "disabled"),
    id: typeof rec.id === "string" ? rec.id : undefined,
  };
}

export function createSlider(params: Partial<UISliderParams> = {}): HTMLElement {
  const parsed = parseSliderParams(params);
  sliderSeq += 1;
  const controlId = parsed.id ?? `ui-slider-${sliderSeq}`;
  const wrap = document.createElement("div");
  wrap.className = "ui-slider";

  const header = document.createElement("div");
  header.className = "ui-slider__header";
  const label = document.createElement("label");
  label.htmlFor = controlId;
  label.textContent = parsed.label;
  const readout = document.createElement("output");
  readout.htmlFor = controlId;
  readout.className = "ui-slider__value";
  header.append(label, readout);

  const input = document.createElement("input");
  input.type = "range";
  input.id = controlId;
  input.className = "ui-slider__input ui-focusable";
  input.min = String(parsed.min);
  input.max = String(parsed.max);
  input.step = String(parsed.step);
  input.value = String(parsed.value);
  input.disabled = parsed.disabled;

  const sync = () => {
    const numeric = Number(input.value);
    const span = parsed.max - parsed.min || 1;
    const pct = ((numeric - parsed.min) / span) * 100;
    wrap.style.setProperty("--ui-slider-pct", `${pct.toFixed(1)}%`);
    readout.textContent = `${numeric}${parsed.unit}`;
  };
  sync();
  input.addEventListener("input", sync);

  wrap.append(header, input);
  return wrap;
}

export function registerSliderAtom(registry: UIRegistry): void {
  registry.register<UISliderParams>("UI-ATOM-SLIDER", {
    metadata: {
      layer: "atom",
      name: "Progress Range Slider",
      figmaNodeId: "65:985",
      description: "Range slider with filled/hollow dual-height track and square target thumb.",
    },
    variants: {
      zeroPercent: parseSliderParams({ label: "Dust Shield Opacity", value: 0 }),
      fiftyPercent: parseSliderParams({ label: "Habitat Illumination", value: 50 }),
      fullPercent: parseSliderParams({ label: "O2 Reserve Target", value: 100 }),
    },
    parse: parseSliderParams,
    render: createSlider,
  });
}
