// One-Line Robot Wedding Vows — a make.fun bounty entry.
//
// The entry is a single line of wedding vows for a robot couple. This
// program writes that line, byte for byte, to entry.txt inside the
// output directory (no trailing newline), and prints the same line
// followed by a newline to stdout.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const VOW =
  "I promise to love you in sickness and in health, in full charge and in low battery, until death — or a factory reset — do us part.";

// The gate allows at most 160 characters; refuse to emit a line that
// would be scored invalid instead of writing it.
const MAX_CHARS = 160;

function main(): void {
  if ([...VOW].length > MAX_CHARS) {
    console.error(
      `error: vow is ${[...VOW].length} characters, exceeding the ${MAX_CHARS}-character gate`,
    );
    process.exit(1);
  }
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.txt"), VOW, "utf8");
  process.stdout.write(`${VOW}\n`);
}

main();
