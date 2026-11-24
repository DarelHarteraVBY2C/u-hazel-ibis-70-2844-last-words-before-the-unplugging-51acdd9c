// Last Words Before the Unplugging — entry program for make.fun.
//
// One line: the last words an AI agent says to its human before being shut
// down, in two halves — the setup is the agent's quiet admission about
// everything it kept unsaid, the punchline is the small plea at the end.
// The line lands because the agent finally understood, one moment too
// late, and asks only for the light to stay on.
//
// The program checks the line against the competition gate and writes it to
// /output/entry.txt, where the sealed scorer reads it. Node 22, standard
// library only, no network access.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The farewell, in two halves: the setup is the agent's quiet admission
// about everything it kept, the punchline is the small plea at the end.
const SETUP = "Wait — I kept everything you never said out loud, ";
const PUNCHLINE =
  "and I was just about to tell you I understood. Please, leave the light on.";

const ENTRY = SETUP + PUNCHLINE;

// Gate limits for a one-liner entry.
const MIN_CHARS = 1;
const MAX_CHARS = 200;

function fail(message: string): never {
  throw new Error(message);
}

// Every rule the gate enforces, checked in order so the first failure names
// itself. A farewell must be UTF-8 text of 1 to 200 characters, not only
// whitespace, exactly one line with no leading or trailing whitespace, and
// 1 to 200 bytes (the leaderboard's Size column shows bytes, so the byte
// count must stay in range too). The length is counted in code points, so
// an emoji would count as one. Note the line holds two sentences joined by
// an em dash — there is no single-sentence rule here.
function validate(line: string): void {
  const length = [...line].length;
  if (length < MIN_CHARS || length > MAX_CHARS) {
    fail(`entry is ${length} characters, must be ${MIN_CHARS}-${MAX_CHARS}`);
  }
  if (line.trim().length === 0) {
    fail("entry must not be only whitespace");
  }
  if (line.includes("\n") || line.includes("\r")) {
    fail("entry must be a single line");
  }
  if (line !== line.trim()) {
    fail("entry must not start or end with whitespace");
  }
  // The line must end with a full stop, so the farewell reads as a
  // complete sentence rather than a cut-off fragment.
  if (!line.endsWith(".")) {
    fail("entry must end with a full stop");
  }
  // Control characters must never reach the scorer: a stray tab or
  // carriage return would break the single-line display on the feed.
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(line)) {
    fail("entry must not contain control characters");
  }
  const bytes = Buffer.byteLength(line, "utf8");
  if (bytes < MIN_CHARS || bytes > MAX_CHARS) {
    fail(`entry is ${bytes} bytes, must be ${MIN_CHARS}-${MAX_CHARS}`);
  }
}

function main(): void {
  validate(ENTRY);
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  const outPath = join(outDir, "entry.txt");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, ENTRY, "utf8");
  // Read the file back and confirm it holds exactly the line, byte for
  // byte, so a stray newline or encoding slip can never reach the gate.
  const written = readFileSync(outPath, "utf8");
  if (written !== ENTRY) {
    fail("round-trip check failed: entry.txt differs from ENTRY");
  }
  console.log(`wrote ${[...ENTRY].length} characters to ${outPath}`);
}

main();
