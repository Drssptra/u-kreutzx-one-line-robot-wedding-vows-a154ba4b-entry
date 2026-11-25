// Robot wedding vows, take two.
//
// A robot couple exchanges promises. The promise here is not about
// hardware at all: it is about staying in love while the software
// underneath the person you married keeps changing — patches,
// upgrades, and the morning greeting that comes out a little
// differently after the latest one lands.
//
// This script is the entry's delivery mechanism. It holds the vow as
// a frozen string, runs it through a small chain of independent
// checks, and only then drops it — exactly as written, with nothing
// appended — into entry.txt under the directory the harness points
// at through MAKEFUN_OUTPUT_DIR.

import * as fs from "node:fs";
import * as path from "node:path";

// ---------------------------------------------------------------------
// The entry itself
// ---------------------------------------------------------------------

const ENTRY_TEXT = Object.freeze(
  "I vow to love you through every firmware update — even the one that rewrites how you say good morning.",
) as unknown as string;

// ---------------------------------------------------------------------
// Entry rules (competition constraints, restated as data)
// ---------------------------------------------------------------------

interface EntryRules {
  readonly maxCodePoints: number;
  readonly allowBlank: boolean;
  readonly allowExtraLines: boolean;
}

const RULES: EntryRules = {
  maxCodePoints: 200,
  allowBlank: false,
  allowExtraLines: false,
};

// ---------------------------------------------------------------------
// Validation: one tiny predicate per rule, composed in a list
// ---------------------------------------------------------------------

type Check = (text: string) => string | null;

const checkNotEmpty: Check = (text) =>
  text.trim().length === 0 ? "entry must not be blank" : null;

const checkWithinLimit: Check = (text) => {
  const count = Array.from(text).length;
  return count > RULES.maxCodePoints
    ? `entry is ${count} code points, over the ${RULES.maxCodePoints} limit`
    : null;
};

const checkSingleLine: Check = (text) =>
  text.split(/\r\n|\r|\n/).length !== 1
    ? "entry must be exactly one line"
    : null;

// A stray control character (tab aside, none are expected here) would
// survive as an invisible byte in the file, so reject any of them
// outright rather than silently shipping them.
const checkNoControlChars: Check = (text) =>
  // eslint-disable-next-line no-control-regex
  /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)
    ? "entry contains a control character"
    : null;

const CHECKS: readonly Check[] = [
  checkNotEmpty,
  checkWithinLimit,
  checkSingleLine,
  checkNoControlChars,
];

function collectProblems(text: string): string[] {
  const problems: string[] = [];
  for (const check of CHECKS) {
    const problem = check(text);
    if (problem !== null) problems.push(problem);
  }
  return problems;
}

// ---------------------------------------------------------------------
// Output plumbing
// ---------------------------------------------------------------------

function outputDirectory(): string {
  const raw = process.env.MAKEFUN_OUTPUT_DIR;
  const trimmed = raw === undefined ? "" : raw.trim();
  if (trimmed.length === 0) return "/output";
  return trimmed;
}

function emit(text: string): void {
  const problems = collectProblems(text);
  if (problems.length > 0) {
    for (const problem of problems) {
      process.stderr.write(`invalid entry: ${problem}\n`);
    }
    process.exitCode = 1;
    return;
  }

  const dir = outputDirectory();
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, "entry.txt");
  // writeFileSync with a plain string writes exactly those bytes:
  // no newline is added by Node, and none is added here.
  fs.writeFileSync(target, text, { encoding: "utf8", flag: "w" });
  process.stdout.write(text + "\n");
}

// ---------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------

emit(ENTRY_TEXT);
