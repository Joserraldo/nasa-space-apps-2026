import { beforeEach, describe, expect, it } from "vitest";
import {
  createAvatar,
  createBreadcrumbs,
  createButton,
  createCheckbox,
  createContentSwitcher,
  createDropdown,
  createLink,
  createNavbar,
  createPagination,
  createSearchBar,
  createSlider,
  createTag,
  createTextField,
  createToggle,
  showToast,
} from "../../src/ui";
import { fireDomEvent, installDomShim } from "./helpers/dom-shim";

describe("Sci-fi UI Kit component semantics and interactions", () => {
  let doc: Document;

  beforeEach(() => {
    doc = installDomShim();
  });

  it("renders accessible buttons, icon-only labels, disabled links, avatars, and dismissible tags", () => {
    const iconBtn = createButton({ label: "Scan sector", onlyIcon: true, prefixIcon: "scan-frame-02" });
    expect(iconBtn.getAttribute("aria-label")).toBe("Scan sector");
    expect(iconBtn.type).toBe("button");

    const disabledLink = createLink({ label: "Locked", disabled: true });
    expect(disabledLink.getAttribute("aria-disabled")).toBe("true");
    expect(disabledLink.hasAttribute("href")).toBe(false);

    const avatar = createAvatar({ content: "Image", alt: "Commander Vega", style: "Fill", size: "Large" });
    const img = avatar.querySelector("img")!;
    expect(img.alt).toBe("Commander Vega");
    expect(img.src.startsWith("data:image/svg+xml")).toBe(true);

    const host = doc.createElement("div");
    const tag = createTag({ label: "Fault", type: "Error", dismissible: true });
    host.append(tag);
    expect(host.children).toHaveLength(1);
    tag.querySelector("button")!.click();
    expect(host.children).toHaveLength(0);
  });

  it("builds Toggle on <input type='checkbox' switch> and supports Checkbox indeterminate state", () => {
    const toggle = createToggle({ id: "balanced", label: "Balanced resolution", checked: true });
    const input = toggle.querySelector("input")!;
    expect(input.id).toBe("balanced");
    expect(input.hasAttribute("switch")).toBe(true);
    expect(input.checked).toBe(true);

    const chk = createCheckbox({ label: "Subsystems", indeterminate: true });
    expect(chk.querySelector("input")!.indeterminate).toBe(true);
  });

  it("applies progressive validation on TextField and Dropdown without premature error states", () => {
    const field = createTextField({
      label: "Callsign",
      helpText: "Required crew identifier",
      required: true,
    });
    doc.body.append(field);

    const input = field.querySelector("input")!;
    const error = field.querySelector<HTMLElement>(".ui-field__error")!;
    expect(input.getAttribute("aria-invalid")).toBe("false");
    expect(error.hidden).toBe(true);
    expect(input.getAttribute("aria-describedby")).toContain("-hint");
    expect(input.getAttribute("aria-describedby")).not.toContain("-error");

    fireDomEvent(input, "invalid");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(error.hidden).toBe(false);
    expect(input.getAttribute("aria-describedby")).toContain("-error");

    input.value = "ARES-01";
    fireDomEvent(input, "input");
    expect(input.getAttribute("aria-invalid")).toBe("false");
    expect(error.hidden).toBe(true);
    expect(input.getAttribute("aria-describedby")).not.toContain("-error");

    const dropdown = createDropdown({ label: "Sector", value: "polar" });
    expect(dropdown.querySelector("select")!.value).toBe("polar");

    const slider = createSlider({ label: "Power", min: 0, max: 200, value: 150, unit: "W" });
    expect(slider.querySelector("output")!.textContent).toBe("150W");
  });

  it("supports SearchBar <search>, ContentSwitcher keyboard roving & beforematch, Breadcrumbs, and Pagination", () => {
    const queries: string[] = [];
    const search = createSearchBar({
      mode: "Minimised",
      onSearch: q => queries.push(q),
    });
    expect(search.tagName).toBe("SEARCH");
    const trigger = search.querySelector("button")!;
    trigger.click();
    const searchInput = search.querySelector("input")!;
    expect(searchInput.getAttribute("autocorrect")).toBe("off");
    searchInput.value = "DN-04";
    fireDomEvent(searchInput, "input");
    expect(queries).toEqual(["DN-04"]);

    const selectedTabs: string[] = [];
    const switcher = createContentSwitcher({
      items: [
        { id: "a", label: "Alpha", panelText: "Panel A" },
        { id: "b", label: "Beta", panelText: "Panel B" },
        { id: "c", label: "Gamma", panelText: "Panel C" },
      ],
      selectedId: "a",
      onSelect: id => selectedTabs.push(id),
    });
    const tabs = switcher.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    const panels = switcher.querySelectorAll<HTMLElement>('[role="tabpanel"]');
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(panels[1].getAttribute("hidden")).toBe("until-found");

    fireDomEvent(tabs[0], "keydown", { key: "ArrowRight" });
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    expect(panels[1].hasAttribute("hidden")).toBe(false);

    fireDomEvent(panels[2], "beforematch");
    expect(tabs[2].getAttribute("aria-selected")).toBe("true");
    expect(selectedTabs).toEqual(["b", "c"]);

    const crumbs = createBreadcrumbs({
      items: [
        { label: "Home", href: "/" },
        { label: "One", href: "/1" },
        { label: "Two", href: "/2" },
        { label: "Three", href: "/3" },
        { label: "Four", href: "/4" },
        { label: "Current" },
      ],
      collapseAfter: 5,
    });
    expect(crumbs.querySelectorAll("li")).toHaveLength(4);
    crumbs.querySelector("button")!.click();
    expect(crumbs.querySelectorAll("li")).toHaveLength(6);

    const pages: number[] = [];
    const pagination = createPagination({
      currentPage: 1,
      totalPages: 5,
      onPageChange: p => pages.push(p),
    });
    const pageButtons = pagination.querySelectorAll("button");
    pageButtons[pageButtons.length - 1].click();
    expect(pages).toEqual([2]);
    expect(pagination.querySelector('[aria-current="page"]')!.textContent).toBe("2");
  });

  it("mounts Navbar with aria-current='page' and Toast with popover='manual' and focus restoration", () => {
    const nav = createNavbar({
      title: "Kit catalog",
      items: [
        { label: "Base scene", href: "/" },
        { label: "Catalog", href: "/catalog", current: true },
        { label: "UI Kit", href: "/ui" },
      ],
    });
    expect(nav.querySelector('[aria-current="page"]')!.textContent).toBe("Catalog");

    const trigger = createButton({ label: "Trigger alert" });
    doc.body.append(trigger);

    const toast = showToast({
      type: "Warning",
      title: "Dust Storm",
      description: "Close exterior shutters.",
      durationMs: 0,
      triggerElement: trigger,
    });
    expect(toast.getAttribute("popover")).toBe("manual");
    const closeBtn = toast.querySelector("button")!;
    closeBtn.focus();
    closeBtn.click();
    expect(doc.activeElement).toBe(trigger);
    expect(doc.body.querySelector(".ui-toast")).toBeNull();
  });
});
