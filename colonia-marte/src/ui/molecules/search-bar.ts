import { createButton } from "../atoms/button";
import { createIcon } from "../foundation/icons";
import type { UIRegistry } from "../registry";
import { asRecord, pickEnum, pickString } from "../types";

let searchSeq = 0;

export interface UISearchBarParams {
  mode: "Minimised" | "Expanded";
  placeholder: string;
  label: string;
  buttonLabel: string;
  value: string;
  id?: string;
  onSearch?: (query: string) => void;
}

export function parseSearchBarParams(input: unknown): UISearchBarParams {
  const rec = asRecord(input);
  return {
    mode: pickEnum(rec.mode, ["Minimised", "Expanded"] as const, "Expanded", "mode"),
    placeholder: pickString(rec.placeholder, "Filter pieces or IDs...", "placeholder"),
    label: pickString(rec.label, "Search kit", "label"),
    buttonLabel: pickString(rec.buttonLabel, "Search", "buttonLabel"),
    value: pickString(rec.value, "", "value"),
    id: typeof rec.id === "string" ? rec.id : undefined,
    onSearch: typeof rec.onSearch === "function" ? (rec.onSearch as (query: string) => void) : undefined,
  };
}

export function createSearchBar(params: Partial<UISearchBarParams> = {}): HTMLElement {
  const parsed = parseSearchBarParams(params);
  searchSeq += 1;
  const inputId = parsed.id ?? `ui-search-input-${searchSeq}`;

  /* Semantic <search> landmark per modern-web-guidance: forms */
  const searchRegion = document.createElement("search");
  searchRegion.className = "ui-search";
  searchRegion.setAttribute("aria-label", parsed.label);

  const trigger = createButton({
    label: parsed.buttonLabel,
    style: "Primary",
    size: "Medium",
    prefixIcon: "search-01",
  });
  trigger.classList.add("ui-search__submit");

  const form = document.createElement("form");
  form.className = "ui-search__form";
  form.addEventListener("submit", event => {
    event.preventDefault();
    parsed.onSearch?.(input.value.trim());
  });

  const label = document.createElement("label");
  label.htmlFor = inputId;
  label.className = "visually-hidden";
  label.textContent = parsed.label;

  const frame = document.createElement("div");
  frame.className = "ui-field__frame ui-search__frame";
  frame.append(createIcon("search-01", { size: 15 }));

  const input = document.createElement("input");
  input.id = inputId;
  input.type = "search";
  input.className = "ui-input";
  input.placeholder = parsed.placeholder;
  input.value = parsed.value;
  input.setAttribute("autocorrect", "off");
  input.setAttribute("autocapitalize", "none");
  input.spellcheck = false;

  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className = "ui-field__clear ui-focusable";
  clearBtn.setAttribute("aria-label", `Clear ${parsed.label}`);
  clearBtn.hidden = input.value.length === 0;
  clearBtn.append(createIcon("close", { size: 13 }));

  input.addEventListener("input", () => {
    clearBtn.hidden = input.value.length === 0;
    parsed.onSearch?.(input.value.trim());
  });

  clearBtn.addEventListener("click", () => {
    input.value = "";
    clearBtn.hidden = true;
    parsed.onSearch?.("");
    input.focus();
  });

  const submitBtn = createButton({
    label: parsed.buttonLabel,
    style: "Primary",
    size: "Medium",
    type: "submit",
  });
  submitBtn.classList.add("ui-search__submit");

  frame.append(input, clearBtn);
  form.append(label, frame, submitBtn);

  if (parsed.mode === "Minimised") {
    form.hidden = true;
    trigger.addEventListener("click", () => {
      trigger.hidden = true;
      form.hidden = false;
      input.focus();
    });
    searchRegion.append(trigger, form);
  } else {
    searchRegion.append(form);
  }
  return searchRegion;
}

export function registerSearchBarMolecule(registry: UIRegistry): void {
  registry.register<UISearchBarParams>("UI-MOLECULE-SEARCH-BAR", {
    metadata: {
      layer: "molecule",
      name: "HUD Search Bar",
      figmaNodeId: "106:170",
      description: "Semantic <search> landmark supporting Minimised trigger and Expanded bracketed query bar.",
    },
    variants: {
      expanded: parseSearchBarParams({ mode: "Expanded", placeholder: "Search station pieces (e.g. DN-04)..." }),
      minimised: parseSearchBarParams({ mode: "Minimised" }),
    },
    parse: parseSearchBarParams,
    render: createSearchBar,
  });
}
