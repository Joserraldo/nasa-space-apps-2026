import { createShell } from "./shell";

export function createReviewShell(title: string, description: string) {
  const shell = createShell(false);
  document.title = `${title} | Mars Colony`;
  document.querySelector("h1")!.textContent = title;
  const aside = document.querySelector("aside")!;
  aside.replaceChildren();
  const heading = document.createElement("h2"); heading.textContent = title;
  const text = document.createElement("p"); text.textContent = description;
  const controls = document.createElement("div"); controls.className = "review-controls";
  aside.append(heading, text, controls);
  return { ...shell, controls };
}

export function addSelect(parent: HTMLElement, id: string, title: string, options: readonly string[]) {
  const label = document.createElement("label"); label.htmlFor = id; label.textContent = title;
  const select = document.createElement("select"); select.id = id;
  for (const value of options) {
    const option = document.createElement("option"); option.value = value; option.textContent = value;
    select.append(option);
  }
  parent.append(label, select);
  return select;
}
