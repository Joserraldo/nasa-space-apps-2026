/** Minimal DOM shim for running vanilla TypeScript UI unit tests inside Node Vitest without extra packages. */

type Listener = (event: FakeEvent) => void;

export class FakeEvent {
  readonly type: string;
  readonly bubbles: boolean;
  defaultPrevented = false;
  key = "";
  relatedTarget: FakeElement | null = null;
  target: FakeElement | null = null;

  constructor(type: string, init: { bubbles?: boolean; key?: string; relatedTarget?: FakeElement | null } = {}) {
    this.type = type;
    this.bubbles = Boolean(init.bubbles);
    if (init.key) this.key = init.key;
    if (init.relatedTarget !== undefined) this.relatedTarget = init.relatedTarget;
  }

  preventDefault(): void {
    this.defaultPrevented = true;
  }
}

class FakeStyle {
  [prop: string]: unknown;
  setProperty(name: string, value: string): void {
    this[name] = value;
  }
}

class FakeClassList {
  constructor(private readonly owner: FakeElement) {}
  private tokens(): Set<string> {
    return new Set(this.owner.className.split(/\s+/).filter(Boolean));
  }
  private commit(set: Set<string>): void {
    this.owner.className = [...set].join(" ");
  }
  add(...names: string[]): void {
    const set = this.tokens();
    names.forEach(n => { if (n) set.add(n); });
    this.commit(set);
  }
  remove(...names: string[]): void {
    const set = this.tokens();
    names.forEach(n => set.delete(n));
    this.commit(set);
  }
  contains(name: string): boolean {
    return this.tokens().has(name);
  }
}

export class FakeElement {
  readonly tagName: string;
  children: FakeElement[] = [];
  parentElement: FakeElement | null = null;
  attributes = new Map<string, string>();
  dataset: Record<string, string> = {};
  style = new FakeStyle();
  private listeners = new Map<string, Listener[]>();
  private _text = "";
  value = "";
  checked = false;
  indeterminate = false;
  disabled = false;
  required = false;
  selected = false;
  spellcheck = true;
  tabIndex = 0;
  offsetHeight = 110;
  clientWidth = 640;
  scrollWidth = 420;

  constructor(tagName: string, public readonly ownerDocument: FakeDocument) {
    this.tagName = tagName.toUpperCase();
  }

  get id(): string { return this.attributes.get("id") ?? ""; }
  set id(v: string) { this.setAttribute("id", v); }

  get className(): string { return this.attributes.get("class") ?? ""; }
  set className(v: string) { this.setAttribute("class", v); }

  get classList(): FakeClassList { return new FakeClassList(this); }

  get hidden(): boolean { return this.attributes.has("hidden"); }
  set hidden(v: boolean) {
    if (v) this.setAttribute("hidden", "");
    else this.removeAttribute("hidden");
  }

  get htmlFor(): string { return this.attributes.get("for") ?? ""; }
  set htmlFor(v: string) { this.setAttribute("for", v); }

  get href(): string { return this.attributes.get("href") ?? ""; }
  set href(v: string) { this.setAttribute("href", v); }

  get src(): string { return this.attributes.get("src") ?? ""; }
  set src(v: string) { this.setAttribute("src", v); }

  get alt(): string { return this.attributes.get("alt") ?? ""; }
  set alt(v: string) { this.setAttribute("alt", v); }

  get type(): string { return this.attributes.get("type") ?? "text"; }
  set type(v: string) { this.setAttribute("type", v); }

  get name(): string { return this.attributes.get("name") ?? ""; }
  set name(v: string) { this.setAttribute("name", v); }

  get placeholder(): string { return this.attributes.get("placeholder") ?? ""; }
  set placeholder(v: string) { this.setAttribute("placeholder", v); }

  get min(): string { return this.attributes.get("min") ?? ""; }
  set min(v: string) { this.setAttribute("min", v); }

  get max(): string { return this.attributes.get("max") ?? ""; }
  set max(v: string) { this.setAttribute("max", v); }

  get step(): string { return this.attributes.get("step") ?? ""; }
  set step(v: string) { this.setAttribute("step", v); }

  get isConnected(): boolean {
    let cur: FakeElement | null = this;
    while (cur) {
      if (cur === this.ownerDocument.body) return true;
      cur = cur.parentElement;
    }
    return false;
  }

  get validity(): { valid: boolean } {
    if (this.required && this.value.trim().length === 0) return { valid: false };
    if (this.type === "email" && this.value && !this.value.includes("@")) return { valid: false };
    return { valid: true };
  }

  get validationMessage(): string {
    return this.validity.valid ? "" : "Invalid field value";
  }

  get textContent(): string {
    if (this.children.length === 0) return this._text;
    return this._text + this.children.map(c => c.textContent).join("");
  }

  set textContent(v: string) {
    this.children = [];
    this._text = v;
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, String(value));
  }
  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }
  hasAttribute(name: string): boolean {
    return this.attributes.has(name);
  }
  removeAttribute(name: string): void {
    this.attributes.delete(name);
  }

  append(...nodes: (FakeElement | string)[]): void {
    for (const node of nodes) {
      const el = typeof node === "string" ? this.ownerDocument.createTextNode(node) : node;
      if (el.parentElement) el.remove();
      el.parentElement = this;
      this.children.push(el);
      if (this.tagName === "SELECT" && el.tagName === "OPTION" && (el.selected || !this.value)) {
        this.value = el.value;
      }
    }
  }

  prepend(...nodes: FakeElement[]): void {
    for (const el of [...nodes].reverse()) {
      if (el.parentElement) el.remove();
      el.parentElement = this;
      this.children.unshift(el);
    }
  }

  replaceChildren(...nodes: FakeElement[]): void {
    for (const child of this.children) child.parentElement = null;
    this.children = [];
    this._text = "";
    this.append(...nodes);
  }

  remove(): void {
    if (!this.parentElement) return;
    this.parentElement.children = this.parentElement.children.filter(c => c !== this);
    this.parentElement = null;
  }

  contains(other: FakeElement | null): boolean {
    let cur = other;
    while (cur) {
      if (cur === this) return true;
      cur = cur.parentElement;
    }
    return false;
  }

  focus(): void {
    this.ownerDocument.activeElement = this;
  }

  click(): void {
    if (this.disabled) return;
    this.dispatchEvent(new FakeEvent("click", { bubbles: true }));
  }

  matches(selector: string): boolean {
    if (selector.startsWith(".")) return this.classList.contains(selector.slice(1));
    if (selector.startsWith("#")) return this.id === selector.slice(1);
    return this.tagName === selector.toUpperCase();
  }

  querySelector<T extends FakeElement = FakeElement>(selector: string): T | null {
    return (this.querySelectorAll(selector)[0] as T | undefined) ?? null;
  }

  querySelectorAll<T extends FakeElement = FakeElement>(selector: string): T[] {
    const results: T[] = [];
    const visit = (node: FakeElement) => {
      for (const child of node.children) {
        if (matchesSimple(child, selector)) results.push(child as T);
        visit(child);
      }
    };
    visit(this);
    return results;
  }

  addEventListener(type: string, cb: Listener): void {
    const list = this.listeners.get(type) ?? [];
    list.push(cb);
    this.listeners.set(type, list);
  }

  dispatchEvent(event: FakeEvent): boolean {
    if (!event.target) event.target = this;
    for (const cb of this.listeners.get(event.type) ?? []) cb(event);
    if (event.bubbles && this.parentElement) this.parentElement.dispatchEvent(event);
    return !event.defaultPrevented;
  }
}

function matchesSimple(el: FakeElement, selector: string): boolean {
  const attrMatch = /^([a-z0-9-]*)?\[([a-z-]+)(?:="([^"]*)")?\]$/i.exec(selector.trim());
  if (attrMatch) {
    const [, tag, attr, expected] = attrMatch;
    if (tag && el.tagName !== tag.toUpperCase()) return false;
    if (!el.hasAttribute(attr)) return false;
    return expected === undefined || el.getAttribute(attr) === expected;
  }
  if (selector.startsWith("#")) return el.id === selector.slice(1);
  if (selector.startsWith(".")) return el.classList.contains(selector.slice(1));
  return el.tagName === selector.toUpperCase();
}

export class FakeDocument {
  readonly body: FakeElement;
  activeElement: FakeElement | null = null;

  constructor() {
    this.body = new FakeElement("body", this);
  }

  createElement(tag: string): FakeElement {
    return new FakeElement(tag, this);
  }
  createElementNS(_ns: string, tag: string): FakeElement {
    return new FakeElement(tag, this);
  }
  createTextNode(text: string): FakeElement {
    const span = new FakeElement("#text", this);
    span.textContent = text;
    return span;
  }
  querySelector<T extends FakeElement = FakeElement>(selector: string): T | null {
    return this.body.querySelector<T>(selector);
  }
  querySelectorAll<T extends FakeElement = FakeElement>(selector: string): T[] {
    return this.body.querySelectorAll<T>(selector);
  }
}

export function installDomShim(): Document {
  const doc = new FakeDocument();
  Object.assign(globalThis, {
    document: doc,
    HTMLElement: FakeElement,
    HTMLInputElement: FakeElement,
    Event: FakeEvent,
  });
  return doc as unknown as Document;
}

export function fireDomEvent(target: Element, type: string, init: { bubbles?: boolean; key?: string } = {}): void {
  target.dispatchEvent(new FakeEvent(type, init) as unknown as Event);
}
