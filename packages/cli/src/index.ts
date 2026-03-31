#!/usr/bin/env node

/**
 * @design-axioms/color-cli — Axiomatic Color CLI
 *
 * Solves the color system from a config file and emits CSS.
 */

import type { SolverConfig } from "@design-axioms/color";
import {
  DEFAULT_CONFIG,
  generateCSS,
  generateHTML,
  solve,
} from "@design-axioms/color";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === "help" || command === "--help") {
  console.log(`axiomatic — Axiomatic Color System CLI

Commands:
  build [config]    Solve and emit CSS (default: axiomatic.config.json)
  validate [config] Validate config without emitting CSS
  inspect [config]  Print solver output as JSON
  demo [config]     Generate a self-contained HTML demo page

Options:
  --output, -o      Output file (default: stdout)
`);
  process.exit(0);
}

function loadConfig(configPath?: string): SolverConfig {
  if (!configPath) return DEFAULT_CONFIG;

  const resolved = resolve(configPath);
  const raw = readFileSync(resolved, "utf-8");
  return JSON.parse(raw) as SolverConfig;
}

const configPath = args[1];
const outputFlag = args.indexOf("--output");
const outputPath = outputFlag !== -1 ? args[outputFlag + 1] : undefined;

if (command === "build") {
  const config = loadConfig(configPath);
  const output = solve(config);
  const css = generateCSS(output, config.options);

  if (outputPath) {
    writeFileSync(resolve(outputPath), css, "utf-8");
    console.log(`CSS written to ${outputPath}`);
  } else {
    console.log(css);
  }
} else if (command === "validate") {
  const config = loadConfig(configPath);
  const output = solve(config);

  // Report composition and diagnostics
  for (const mode of [output.light, output.dark]) {
    console.log(`\n=== ${mode.mode.toUpperCase()} MODE ===`);
    for (const surface of mode.surfaces) {
      console.log(
        `  ${surface.slug}: L=${surface.lightness.toFixed(4)}, polarity=${surface.polarity}`,
      );
      if (surface.diagnostics) {
        const { unmetTextGrades, unmetBorderTiers } = surface.diagnostics;
        if (unmetTextGrades.length > 0) {
          console.log(
            `    ⚠ unmet text grades: ${unmetTextGrades.join(", ")}`,
          );
        }
        if (unmetBorderTiers.length > 0) {
          console.log(
            `    ⚠ unmet border tiers: ${unmetBorderTiers.join(", ")}`,
          );
        }
      }
    }
    console.log(`\n  Composition:`);
    for (const c of mode.composition) {
      console.log(
        `    ${c.surfaceA} ↔ ${c.surfaceB}: ${c.interContrast.toFixed(1)} APCA [${c.tier}]`,
      );
    }
  }
} else if (command === "inspect") {
  const config = loadConfig(configPath);
  const output = solve(config);
  console.log(JSON.stringify(output, null, 2));
} else if (command === "demo") {
  const config = loadConfig(configPath);
  const output = solve(config);
  const html = generateHTML(output, config);

  if (outputPath) {
    writeFileSync(resolve(outputPath), html, "utf-8");
    console.log(`Demo written to ${outputPath}`);
  } else {
    const defaultPath = resolve("demo.html");
    writeFileSync(defaultPath, html, "utf-8");
    console.log(`Demo written to demo.html`);
  }
} else {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}
