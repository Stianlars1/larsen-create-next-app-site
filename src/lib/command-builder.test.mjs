import assert from "node:assert/strict";
import test from "node:test";

import { buildScaffoldCommand } from "./command-builder.ts";

const selectedAnswers = {
  appName: "daniel",
  palette: {
    kind: "custom",
    hex: "#006045",
    preset: "shadcn",
    format: "hsl-values",
    neutralTint: "subtle",
  },
  pm: "npm",
  linter: "eslint",
  skills: { kind: "recommended" },
  git: true,
  install: true,
  cnaVersion: "latest",
};

const commandTokens = (command) => command.replace(/\\\s*\n/g, " ").split(/\s+/);

test("the copied command answers every selected control without npm or CLI prompts", () => {
  const command = buildScaffoldCommand(selectedAnswers);
  const tokens = commandTokens(command);

  assert.deepEqual(tokens, [
    "npx",
    "--yes",
    "@larsen-utvikling/create-next-app@0.6.0",
    "daniel",
    "--defaults",
    "--hex",
    "006045",
    "--skills",
    "recommended",
  ]);
});

test("non-default controls remain explicit overrides of the unattended baseline", () => {
  const command = buildScaffoldCommand({
    ...selectedAnswers,
    palette: { kind: "default" },
    pm: "pnpm",
    linter: "biome",
    skills: { kind: "none" },
    git: false,
    install: false,
    cnaVersion: "16.3.0",
  });
  const tokens = commandTokens(command);

  assert.deepEqual(tokens, [
    "npx",
    "--yes",
    "@larsen-utvikling/create-next-app@0.6.0",
    "daniel",
    "--defaults",
    "--pm",
    "pnpm",
    "--linter",
    "biome",
    "--no-git",
    "--no-install",
    "--cna-version",
    "16.3.0",
  ]);
});
