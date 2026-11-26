export type UILayer = "foundation" | "atom" | "molecule" | "organism";

export interface UIComponentMetadata {
  layer: UILayer;
  name: string;
  figmaNodeId: string;
  description: string;
}

export interface UIComponentDefinition<P extends object> {
  metadata: UIComponentMetadata;
  variants: Readonly<Record<string, P>>;
  parse: (input: unknown) => P;
  render: (params: P) => HTMLElement;
}

export interface RegisteredUIComponent {
  id: string;
  metadata: UIComponentMetadata;
  variants: Readonly<Record<string, object>>;
  parse: (input: unknown) => object;
  render: (params: object) => HTMLElement;
}

export function asRecord(input: unknown): Record<string, unknown> {
  if (input === undefined || input === null) return {};
  if (typeof input !== "object" || Array.isArray(input)) {
    throw new Error("UI component params must be an object");
  }
  return input as Record<string, unknown>;
}

export function pickEnum<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number],
  field: string,
): T[number] {
  if (value === undefined) return fallback;
  if (typeof value === "string" && (allowed as readonly string[]).includes(value)) {
    return value as T[number];
  }
  throw new Error(`Invalid ${field}: ${String(value)}`);
}

export function pickBoolean(value: unknown, fallback: boolean, field: string): boolean {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  throw new Error(`Invalid ${field}: expected boolean`);
}

export function pickString(value: unknown, fallback: string, field: string): string {
  if (value === undefined) return fallback;
  if (typeof value === "string") return value;
  throw new Error(`Invalid ${field}: expected string`);
}

export function pickNumber(
  value: unknown,
  fallback: number,
  field: string,
  min = -Infinity,
  max = Infinity,
): number {
  if (value === undefined) return fallback;
  if (typeof value === "number" && Number.isFinite(value) && value >= min && value <= max) {
    return value;
  }
  throw new Error(`Invalid ${field}: expected number in [${min}, ${max}]`);
}
