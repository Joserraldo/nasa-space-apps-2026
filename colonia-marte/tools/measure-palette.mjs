import { readFileSync, writeFileSync } from "node:fs";

// Curated base decisions stay in palette.json. Remeasure without reverting gate corrections.
const document = JSON.parse(readFileSync("palette.json", "utf8"));
if (document.version !== 2) throw new Error("Expected palette schema version 2");
const samples = document.colors.flatMap(color => ["observed", "baseSample"].flatMap(field => {
  const sample = color[field];
  return sample?.frame ? [{ id: `${color.id}-${field}`, frame: sample.frame, region: sample.region }] : [];
}));
if (process.argv.includes("--regions")) {
  console.log(JSON.stringify(samples));
  process.exit(0);
}
for (const color of document.colors) {
  for (const field of ["observed", "baseSample"]) {
    const sample = color[field];
    if (!sample?.frame) continue;
    const rgb = readFileSync(`node_modules/.cache/palette/${color.id}-${field}.rgb`);
    if (rgb.length !== 3) throw new Error(`Unexpected RGB output for ${color.id}-${field}`);
    const hex = `#${rgb.toString("hex").toUpperCase()}`;
    if (field === "baseSample" ? color.base === sample.hex : color.baseReason === "matches observed") {
      color.base = hex;
    }
    sample.hex = hex;
  }
}
// Compact observations keep the editable document below 300 lines.
const rows = document.colors.map(color => {
  const lines = ["    {"];
  for (const [key, value] of Object.entries(color)) {
    lines.push(`      ${JSON.stringify(key)}: ${JSON.stringify(value)},`);
  }
  lines[lines.length - 1] = lines.at(-1).slice(0, -1);
  return `${lines.join("\n")}\n    }`;
});
writeFileSync("palette.json", `{
  "version": 2,
  "measurement": ${JSON.stringify(document.measurement)},
  "colors": [
${rows.join(",\n")}
  ]
}\n`, "utf8");
console.log(`${samples.length} RGB samples; ${document.colors.length} colors; curated bases preserved.`);
